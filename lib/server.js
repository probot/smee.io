import { randomBytes } from 'node:crypto'
import { join } from 'node:path'
import { readFileSync } from 'node:fs'
import Fastify from 'fastify'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import fastifyCors from '@fastify/cors'
import fastifyHelmet from '@fastify/helmet'
import forceHttps from './force-https.js'

import EventBus from './event-bus.js'
import KeepAlive from './keep-alive.js'

let Sentry

if (process.env.SENTRY_DSN) {
  Sentry = await import('@sentry/node')
  // Ensure to call this before requiring any other modules!
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    // Adds request headers and IP for users, for more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#sendDefaultPii
    sendDefaultPii: true,
  })
}

const isProd = process.env.NODE_ENV === 'production'
const __dirname = new URL('.', import.meta.url).pathname

const [
  faviconIco,
  faviconPng,
  indexHtml,
  webhooksHtml,
  mainMinCss,
  mainMinJs,
  mainMinJsGz,
  mainMinCssGz,
] = [
  'favicon.ico',
  'favicon.png',
  'index.html',
  'webhooks.html',
  'main.min.css',
  'main.min.js',
  ...(isProd ? ['main.min.js.gz', 'main.min.css.gz'] : [])
].map(file => readFileSync(join(__dirname, '..', 'public', file)))

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

  // Set favicon.ico because browsers request it by default
  // This is a workaround to avoid 404 errors because it could
  // match the /:channel route.

  fastify.get('/favicon.ico', {
  }, (req, reply) => {
    reply

      .header('Cache-Control', 'max-age=86400')
      .header('Content-Type', 'image/png')
      .status(200)
      .send(faviconIco)
  })

  fastify.get('/public/favicon.png', {
    schema: {
      hide: true
    }
  }, (req, reply) => {
    reply
      .header('Cache-Control', 'max-age=86400')
      .header('Content-Type', 'image/png')
      .status(200)
      .send(faviconPng)
  })

  fastify.get('/public/main.min.css', {
    schema: {
      hide: true
    }
  }, isProd
    ? (req, reply) => {
        if (req.headers['accept-encoding'] && req.headers['accept-encoding'].includes('gzip')) {
          reply
            .header('Content-Encoding', 'gzip')
            .header('Content-Type', 'text/css; charset=utf-8')
            .status(200)
            .send(mainMinCssGz)
        } else {
          reply
            .header('Content-Type', 'text/css; charset=utf-8')
            .status(200)
            .send(mainMinCss)
        }
      }
    : (req, reply) => {
        reply
          .header('Content-Type', 'text/css; charset=utf-8')
          .status(200)
          .send(mainMinCss)
      })

  fastify.get('/public/main.min.js', {
    schema: {
      hide: true
    }
  }, isProd
    ? (req, reply) => {
        if (req.headers['accept-encoding'] && req.headers['accept-encoding'].includes('gzip')) {
          reply
            .header('Content-Encoding', 'gzip')
            .header('Content-Type', 'text/javascript; charset=utf-8')
            .status(200)
            .send(mainMinJsGz)
        } else {
          reply
            .header('Content-Type', 'text/javascript; charset=utf-8')
            .status(200)
            .send(mainMinJs)
        }
      }
    : (req, reply) => {
        reply
          .header('Content-Type', 'text/javascript; charset=utf-8')
          .status(200)
          .send(mainMinJs)
      })

  fastify.get('/', {
    schema: {
      hide: true
    }
  }, (req, reply) => {
    reply
      .header('Content-Type', 'text/html; charset=utf-8')
      .status(200)
      .send(indexHtml)
  })

  fastify.get('/new', (req, reply) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol
    const host = req.headers['x-forwarded-host'] || req.headers.host
    const channel = randomBytes(12).toString('base64url')

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
  }, (req, reply) => {
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
      .send(webhooksHtml)
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
      return reply.status(200).send()
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
