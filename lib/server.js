'use strict'

let Sentry

if (process.env.SENTRY_DSN) {
  Sentry = require('@sentry/node')
  // Ensure to call this before requiring any other modules!
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    // Adds request headers and IP for users, for more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#sendDefaultPii
    sendDefaultPii: true,
  })
}

const crypto = require('crypto')
const path = require('path')
const fs = require('fs')
const Fastify = require('fastify')
const fastifySwagger = require('@fastify/swagger')
const fastifySwaggerUi = require('@fastify/swagger-ui')
const fastifyCors = require('@fastify/cors')
const fastifyHelmet = require('@fastify/helmet')
const forceHttps = require('./force-https')

const EventBus = require('./event-bus')
const KeepAlive = require('./keep-alive')

const files = [
  'favicon.png',
  'index.html',
  'webhooks.html',
  'main.min.css',
  'main.min.js'
].map(file => fs.readFileSync(path.join(__dirname, '..', 'public', file)))

  ; (async () => {
  const fastify = Fastify({ logger: true })

  if (Sentry) {
    Sentry.setupFastifyErrorHandler(fastify)
  }

  await fastify.register(fastifySwagger)
  await fastify.register(fastifySwaggerUi)
  await fastify.register(fastifyCors)
  await fastify.register(fastifyHelmet)

  if (process.env.FORCE_HTTPS) {
    await fastify.register(forceHttps)
  }

  const bus = new EventBus({ logger: fastify.log })

  fastify.get('/public/favicon.png', {
    schema: {
      hide: true
    }
  }, async (req, reply) => {
    return reply
      .header('Content-Type', 'image/png')
      .status(200)
      .send(files[0])
  })

  fastify.get('/public/main.min.css', {
    schema: {
      hide: true
    }
  }, async (req, reply) => {
    return reply
      .header('Content-Type', 'text/css; charset=utf-8')
      .status(200)
      .send(files[3])
  })

  fastify.get('/public/main.min.js', {
    schema: {
      hide: true
    }
  }, async (req, reply) => {
    return reply
      .header('Content-Type', 'text/javascript; charset=utf-8')
      .status(200)
      .send(files[4])
  })

  fastify.get('/', {
    schema: {
      hide: true
    }
  }, async (req, reply) => {
    return reply
      .header('Content-Type', 'text/html; charset=utf-8')
      .status(200)
      .send(files[1])
  })

  fastify.get('/new', (req, reply) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol
    const host = req.headers['x-forwarded-host'] || req.headers.host
    const channel = crypto.randomBytes(12).toString('base64url')

    reply.redirect(`${protocol}://${host}/${channel}`, 307)
  })

  fastify.decorateReply('message_count', 0)

  fastify.decorateReply('ssePing', function () {
    this.raw.write(`id: ${this.message_count++}\nevent: ping\ndata: {}\n\n`)
  })

  fastify.decorateReply('sseReady', function () {
    this.raw.write(`id: ${this.message_count++}\nevent: ready\ndata: {}\n\n`)
  })

  // When redis is enabled, we know we have only string payloads
  fastify.decorateReply('sse', process.env.REDIS_URL
    ? function (payload, event) {
      this.raw.write(`id: ${this.message_count++}\n${event ? `event: ${event}\n` : ''}data: ${payload}\n\n`)
    }
    : function (payload, event) {
      this.raw.write(`id: ${this.message_count++}\n${event ? `event: ${event}\n` : ''}data: ${JSON.stringify(payload)}\n\n`)
    })

  const channelsBlocked = new Set(process.env.BLOCKED_CHANNELS ? process.env.BLOCKED_CHANNELS.split(',') : [])

  const channelsBlockedHandler = channelsBlocked.size !== 0
    ? (req, reply, done) => {
        if (channelsBlocked.has(req.params.channel)) {
          return reply.status(403).send('Channel has been disabled due to too many connections.')
        }
        done()
      }
    : undefined

  // Setup interval to ping every 30 seconds to keep the connection alive
  const keepAlive = new KeepAlive(30000)

  fastify.get('/:channel', {
    onRequest: channelsBlockedHandler,
    schema: {
      params: {
        type: 'object',
        properties: {
          channel: {
            type: 'string',
            minLength: 1,
            maxLength: 128,
            pattern: '^[a-zA-Z0-9-_]+$'
          }
        }
      }
    }
  }, async (req, reply) => {
    const { channel } = req.params

    if (req.headers.accept === 'text/event-stream') {
      keepAlive.start(reply)

      reply.raw.socket.setTimeout(0)

      reply
        .raw
        .writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'x-no-compression': 1
        })

      function close () {
        bus.events.removeListener(channel, reply.sse)
        keepAlive.stop(reply)
        fastify.log.info('Client disconnected', channel, bus.events.listenerCount(channel))
      }

      // Listen for events on this channel
      bus.events.on(channel, reply.sse.bind(reply))

      // Clean up when the client disconnects
      reply.raw.on('close', close)

      reply.sseReady()

      fastify.log.info('Client connected to sse', channel, bus.events.listenerCount(channel))
      return
    }

    fastify.log.info('Client connected to web', channel, bus.events.listenerCount(channel))
    return reply
      .status(200)
      .header('Content-Type', 'text/html; charset=utf-8')
      .send(files[2])
  })

  fastify.post('/:channel', {
    onRequest: channelsBlockedHandler,
    schema: {
      params: {
        type: 'object',
        properties: {
          channel: {
            type: 'string',
            minLength: 1,
            maxLength: 128,
            pattern: '^[a-zA-Z0-9-_]+$'
          }
        }
      },
      body: {
        type: 'object'
      }
    }
  }, async (req, reply) => {
    // Emit an event to the Redis bus
    await bus.emitEvent({
      channel: req.params.channel,
      payload: {
        ...req.headers,
        body: req.body,
        query: req.query,
        timestamp: Date.now()
      }
    })

    return reply.status(200).send()
  })

  // Resend payload via the event emitter
  fastify.post('/:channel/redeliver',
    {
      onRequest: channelsBlockedHandler,
      params: {
        type: 'object',
        properties: {
          channel: {
            type: 'string',
            minLength: 1,
            maxLength: 128,
            pattern: '^[a-zA-Z0-9-_]+$'
          }
        }
      },
      schema: {
        params: {
          type: 'object',
          properties: {
            channel: {
              type: 'string'
            }
          }
        },
        body: {
          type: 'object'
        }
      }
    }, async (req, reply) => {
    // Emit an event to the Redis bus
      await bus.emitEvent({
        channel: req.params.channel,
        payload: req.body
      })
      return reply.status(200)
    })

  const port = parseInt(process.env.PORT, 10) || 3000
  fastify.listen({ port, host: '0.0.0.0' }, (err, address) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    console.log(`Server listening at ${address}`)
  })
})()
