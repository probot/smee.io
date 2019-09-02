const Redis = require('ioredis')

class RedisBus {
  constructor () {
    this.opts = {
      connection: process.env.REDIS_URL || { host: 'localhost', port: 6379 },
      namespace: 'global'
    }

    // Need two Redis clients; one cannot subscribe and publish.
    this.sub = new Redis(this.opts.connection)
    this.pub = new Redis(this.opts.connection)

    // Subscribe to the Redis event channel
    this.sub.subscribe(this.opts.namespace)
  }

  /**
   * Listen for an event
   * @param {string} event - Event name
   * @param {function} func - Event handler
   */
  on (event, func) {
    this.sub.on('message', async (_, message) => {
      const json = JSON.parse(message)
      if (event === '*' || (json.event && json.event === event)) {
        return func(json)
      }
    })
  }

  /**
   * Emit to all clients
   * @param {string} event - Event name
   * @param {any} data
   */
  emit (event, data) {
    this.pub.publish(this.opts.namespace, JSON.stringify({ event, data }))
  }
}

module.exports = RedisBus
