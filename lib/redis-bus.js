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
    this.opts = {
      connection: process.env.REDIS_URL || { host: 'localhost', port: 6379 },
      namespace: 'global'
    }

    // Need two Redis clients; one cannot subscribe and publish.
    this.sub = new Redis(this.opts.connection)
    this.pub = new Redis(this.opts.connection)

    // Subscribe to the Redis event channel
    this.sub.subscribe(this.opts.namespace)

    // When we get a message, parse it and
    // throw it over to the EventEmitter.
    this.sub.on('message', (_, message) => this.emitRemoteEvent(message))
  }

  /**
   * Emit an even to this machine's in-memory EventEmitter
   */
  emitLocalEvent (message) {
    const json = JSON.parse(message)
    return this.events.emit(json.channel, json.payload)
  }

  /**
   * Emit an event to the Redis bus, which will tell every subscriber about it
   * @param {string} channel - Channel name
   * @param {any} payload
   */
  emitRemoteEvent ({ channel, payload }) {
    const message = JSON.stringify({ channel, payload })
    if (process.env.NODE_ENV === 'test') {
      this.emitLocalEvent(message)
    } else {
      this.pub.publish(this.opts.namespace, message)
    }
  }
}
