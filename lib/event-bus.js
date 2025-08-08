import Redis from 'ioredis'
import EventEmitter from 'events'

/**
 * This class extends the EventEmitter to act as a pub/sub message bus,
 * allowing payloads to be received by one instance of Smee and sent by
 * others. This allows Smee to be multi-instanced!
 */
export default class EventBus {
  constructor ({ logger = console } = {}) {
    if (!(this instanceof EventBus)) {
      return new EventBus()
    }
    this.events = new EventEmitter()

    // If Redis isn't enabled, don't try to connect
    if (!process.env.REDIS_URL) {
      logger.warn('Redis not enabled; events will not be shared between instances')
      return
    }

    this.opts = {
      connection: process.env.REDIS_URL,
      namespace: 'global'
    }

    // Need two Redis clients; one cannot subscribe and publish.
    this.sub = new Redis(this.opts.connection)
    this.pub = new Redis(this.opts.connection)

    // Subscribe to the Redis event channel
    this.sub.subscribe(this.opts.namespace)

    logger.info(`Redis enabled; events will be shared between instances using ${this.opts.namespace} as the namespace`)

    // When we get a message, parse it and
    // throw it over to the EventEmitter.
    this.sub.on('message', (_, message) => {
      const channel = message.slice(0, message.indexOf(':'))
      if (this.events.listenerCount(channel)) {
        return this.events.emit(channel, message.slice(channel.length + 1))
      }
    })
  }

  /**
 * Emit an event to this machine's in-memory EventEmitter
 * @param {object} opts
 * @param {string} opts.channel - Channel name
 * @param {any} opts.payload
 */
  emitLocalEvent (opts) {
    return this.events.emit(opts.channel, opts.payload)
  }

  /**
   * Emit an event to the Redis bus, which will tell every subscriber about it
   * @param {object} opts
   * @param {string} opts.channel - Channel name
   * @param {any} opts.payload
   */
  async emitEvent (opts) {
    if (process.env.REDIS_URL) {
      return this.pub.publish(this.opts.namespace, opts.channel + ':' + JSON.stringify(opts.payload))
    }
    // Only emit local events if Redis isn't configured
    return this.emitLocalEvent(opts)
  }
}
