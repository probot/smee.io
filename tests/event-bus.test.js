const EventBus = require('../lib/event-bus')

describe('EventBus', () => {
  describe('#emitEvent', () => {
    it('emits an event to locally without Redis', async () => {
      const bus = new EventBus()
      bus.events = { emit: jest.fn() }

      await bus.emitEvent({
        channel: 'some-channel',
        payload: { foo: true }
      })

      expect(bus.events.emit).toHaveBeenCalled()
      expect(bus.events.emit).toHaveBeenCalledWith('some-channel', { foo: true })
    })

    it('emits an event to Redis', async () => {
      process.env.REDIS_URL = 'redis://localhost:6379'

      // Have to redefine so that it registers the Redis connections
      const bus = new EventBus()

      const pubSpy = jest.spyOn(bus.pub, 'publish')

      await bus.emitEvent({
        channel: 'some-channel',
        payload: { foo: true }
      })

      // Ensure that it published the event to Redis
      expect(pubSpy).toHaveBeenCalled()
      expect(pubSpy.mock.calls[0]).toMatchSnapshot()

      // Disconnect and cleanup
      await bus.sub.quit()
      await bus.pub.quit()
      delete process.env.REDIS_URL
    })

    it('receives an event and emits it locally', async () => {
      process.env.REDIS_URL = 'redis://localhost:6379'

      // Have to redefine so that it registers the Redis connections
      const bus = new EventBus()
      bus.events = { emit: jest.fn() }

      // Emit the event to the subscriber
      bus.sub.emit(
        'message',
        null,
        JSON.stringify({ channel: 'example', payload: { foo: true } })
      )

      expect(bus.events.emit).toHaveBeenCalled()
      expect(bus.events.emit.mock.calls[0][0]).toBe('example')
      expect(bus.events.emit.mock.calls[0][1]).toEqual({ foo: true })

      // Disconnect and cleanup
      await bus.sub.quit()
      await bus.pub.quit()
      delete process.env.REDIS_URL
    })
  })
})
