import Redis from 'ioredis'
import { EventEmitter } from 'node:events'

/**
 * This class extends the EventEmitter to act as a pub/sub message bus,
 * allowing payloads to be received by one instance of Smee and sent by
 * others. This allows Smee to be multi-instanced!
 */
export default class EventBus extends EventEmitter {
  #namespace = ''

  #connection = ''

  /** @type {Redis} */
  #sub

  /** @type {Redis} */
  #pub

  #connected = false

  constructor ({ logger = console } = {}) {
    super()

    // If Redis isn't enabled, don't try to connect
    if (!process.env.REDIS_URL) {
      logger.warn('Redis not enabled; events will not be shared between instances')
      return
    }

    this.#namespace = process.env.REDIS_NAMESPACE || 'global'

    this.#connection = process.env.REDIS_URL || ''

    // Need two Redis clients; one cannot subscribe and publish.
    this.#sub = new Redis(this.#connection)
    this.#pub = new Redis(this.#connection)

    // Subscribe to the Redis event channel
    this.#sub.subscribe(this.#namespace)

    
    // When we get a message, parse it and
    // throw it over to the EventEmitter.
    this.#sub.on('message', (_, message) => {
      const channel = message.slice(0, message.indexOf(':'))
      if (this.listenerCount(channel)) {
        return super.emit(channel, message.slice(channel.length + 1))
      }
    })
    
    this.#connected = true
    logger.info(`Redis enabled; events will be shared between instances using '${this.#namespace}' as the namespace`)
  }

  /**
   * @param {string} channelId
   * @param {string} payload
   */
  async emit (channelId, payload) {
    return this.#connected
      ? this.#pub.publish(this.#namespace, channelId + ':' + JSON.stringify(payload)) !== 0
      : super.emit(channelId, payload)
  }
}
