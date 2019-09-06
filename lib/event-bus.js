const Redis = require('ioredis')
const EventEmitter = require('events')

/**
 * This class extends the EventEmitter to act as a pub/sub message bus,
 * allowing payloads to be received by one instance of Smee and sent by
 * others. This allows Smee to be multi-instanced!
 */
module.exports = class EventBus {
  constructor () {
    this.events = new EventEmitter()

    // If Redis isn't enabled, don't try to connect
    if (!process.env.REDIS_URL) return

    this.opts = {
      connection: process.env.REDIS_URL,
      namespace: 'global'
    }

    // Need two Redis clients; one cannot subscribe and publish.
    this.sub = new Redis(this.opts.connection)
    this.pub = new Redis(this.opts.connection)

    // Subscribe to the Redis event channel
    this.sub.subscribe(this.opts.namespace)

    // When we get a message, parse it and
    // throw it over to the EventEmitter.
    this.sub.on('message', (_, message) => {
      const json = JSON.parse(message)
      return this.emitLocalEvent(json)
    })
  }

  /**
   * Emit an event to this machine's in-memory EventEmitter
   * @param {object} opts
   * @param {string} opts.channel - Channel name
   * @param {any} opts.payload
   */
  emitLocalEvent ({ channel, payload }) {
    return this.events.emit(channel, payload)
  }

  /**
   * Emit an event to the Redis bus, which will tell every subscriber about it
   * @param {object} opts
   * @param {string} opts.channel - Channel name
   * @param {any} opts.payload
   */
  async emitEvent (opts) {
    // Only emit local events if Redis isn't configured
    if (!process.env.REDIS_URL) {
      return this.emitLocalEvent(opts)
    } else {
      const message = JSON.stringify(opts)
      return this.pub.publish(this.opts.namespace, message)
    }
  }
}
