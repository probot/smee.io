'use strict'

module.exports = class KeepAlive {
  constructor (interval) {
    this.replies = new Set()
    this.delay = interval
    this.timer = setTimeout(this.ping.bind(this), interval)
  }

  ping () {
    for (let reply of this.replies) {
      reply?.ssePing()
    }
    this.timer.refresh()
  }

  start (reply) {
    this.replies.add(reply)
  }

  stop (reply) {
    this.replies.delete(reply)
  }
}
