const Redis = require('ioredis')

/**
 * This class extends the EventEmitter to act as a pub/sub message bus,
 * allowing payloads to be received by one instance of Smee and sent by
 * others. This allows Smee to be multi-instanced!
 */
module.exports = class RedisBus {
  /**
   * @param {import('events').EventEmitter} events
   */
  constructor (events) {
    this.events = events

    // If Redis isn't enabled, don't try to connect
    if (!process.env.REDIS_URL) return

    this.opts = {
      connection: process.env.REDIS_URL,
      namespace: 'global'
    }

    // We disable the offline queue in tests to avoid open connections
    const redisOpts = { enableOfflineQueue: process.env.NODE_ENV !== 'test' }

    // Need two Redis clients; one cannot subscribe and publish.
    this.sub = new Redis(this.opts.connection, redisOpts)
    this.pub = new Redis(this.opts.connection, redisOpts)

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
   * Emit an even to this machine's in-memory EventEmitter
   */
  emitLocalEvent ({ channel, payload }) {
    return this.events.emit(channel, payload)
  }

  /**
   * Emit an event to the Redis bus, which will tell every subscriber about it
   * @param {string} channel - Channel name
   * @param {any} payload
   */
  emitRemoteEvent ({ channel, payload }) {
    // Only emit local events if Redis isn't configured
    if (!process.env.REDIS_URL) {
      this.emitLocalEvent({ channel, payload })
    } else {
      const message = JSON.stringify({ channel, payload })
      this.pub.publish(this.opts.namespace, message)
    }
  }
}
