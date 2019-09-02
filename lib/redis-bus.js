const Redis = require('ioredis')

module.exports = class RedisBus {
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
    this.sub.on('message', (_, message) => {
      const json = JSON.parse(message)
      return this.events.emit(json.channel, json.payload)
    })
  }

  /**
   * Emit an event to the Redis bus, which will tell every subscriber about it
   * @param {string} channel - Channel name
   * @param {any} payload
   */
  emit ({ channel, payload }) {
    this.pub.publish(this.opts.namespace, JSON.stringify({ channel, payload }))
  }
}
