const sse = require('connect-sse')()
const express = require('express')
const crypto = require('crypto')
const bodyParser = require('body-parser')
const EventEmitter = require('events')
const path = require('path')
const Raven = require('raven')

const RedisBus = require('./redis-bus')
const KeepAlive = require('./keep-alive')

// Tiny logger to prevent logs in tests
const log = process.env.NODE_ENV === 'test' ? _ => _ : console.log

// Get an array of banned channel names
const bannedChannels = process.env.BANNED_CHANNELS && process.env.BANNED_CHANNELS.split(',')

// Middleware to bail early if the channel is banned
function channelIsBanned (req, res, next) {
  // Can't use the req.param here because the route hasn't been defined
  const channel = req.originalUrl.slice(1)
  if (channel && bannedChannels && bannedChannels.includes(channel)) {
    return res.status(403).send('Channel has been disabled due to too many connections.')
  }

  next()
}

module.exports = (testRoute) => {
  const events = new EventEmitter()
  const app = express()
  const pubFolder = path.join(__dirname, '..', 'public')
  const bus = new RedisBus(events)

  // Used for testing route error handling
  if (testRoute) testRoute(app)

  app.use(channelIsBanned)

  if (process.env.SENTRY_DSN) {
    Raven.config(process.env.SENTRY_DSN).install()
    app.use(Raven.requestHandler())
  }

  if (process.env.FORCE_HTTPS) {
    app.use(require('helmet')())
    app.use(require('express-sslify').HTTPS({ trustProtoHeader: true }))
  }

  app.use(bodyParser.json())
  app.use('/public', express.static(pubFolder))

  app.get('/', (req, res) => {
    res.sendFile(path.join(pubFolder, 'index.html'))
  })

  app.get('/new', (req, res) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol
    const host = req.headers['x-forwarded-host'] || req.get('host')
    const channel = crypto
      .randomBytes(12)
      .toString('base64')
      .replace(/[+/=]+/g, '')

    res.redirect(307, `${protocol}://${host}/${channel}`)
  })

  app.get('/:channel', (req, res, next) => {
    const { channel } = req.params

    if (req.accepts('html')) {
      log('Client connected to web', channel, events.listenerCount(channel))
      res.sendFile(path.join(pubFolder, 'webhooks.html'))
    } else {
      next()
    }
  }, sse, (req, res) => {
    const { channel } = req.params

    function send (data) {
      res.json(data)
      keepAlive.reset()
    }

    function close () {
      events.removeListener(channel, send)
      keepAlive.stop()
      log('Client disconnected', channel, events.listenerCount(channel))
    }

    // Setup interval to ping every 30 seconds to keep the connection alive
    const keepAlive = new KeepAlive(() => res.json({}, 'ping'), 30 * 1000)
    keepAlive.start()

    // Allow CORS
    res.setHeader('Access-Control-Allow-Origin', '*')

    // Listen for events on this channel
    events.on(channel, send)

    // Clean up when the client disconnects
    res.on('close', close)

    res.json({}, 'ready')

    log('Client connected to sse', channel, events.listenerCount(channel))
  })

  app.post('/:channel', (req, res) => {
    // We got an event, tell Redis about it
    bus.emitRemoteEvent({
      channel: req.params.channel,
      payload: {
        ...req.headers,
        body: req.body,
        query: req.query,
        timestamp: Date.now()
      }
    })

    res.status(200).end()
  })

  // Resend payload via the event emitter
  app.post('/:channel/redeliver', (req, res) => {
    bus.emitRemoteEvent({
      channel: req.params.channel,
      payload: req.body
    })
    res.status(200).end()
  })

  if (process.env.SENTRY_DSN) {
    app.use(Raven.errorHandler())
  }

  return app
}
