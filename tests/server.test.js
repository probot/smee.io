/**
 * @jest-environment node
 */

const createServer = require('../lib/server')
const request = require('supertest')
const EventSource = require('eventsource')
const Raven = require('raven')

describe('Sentry tests', () => {
  let app, server

  beforeEach(() => {
    app = createServer()
    server = app.listen(0, () => {})
    Raven.captureException = jest.fn()
  })

  it('Starts if SENTRY_DSN is not set', () => {
    expect(server).toBeTruthy()
  })

  it('reports errors to Sentry', async () => {
    process.env.SENTRY_DSN = 'https://user:pw@sentry.io/1234'

    // Pass a route that errors, just to test it
    app = createServer(a => a.get('/not/a/valid/url', () => { throw new Error('test') }))

    await request(app).get('/not/a/valid/url')
    expect(Raven.captureException).toHaveBeenCalled()
  })

  it('with an invalid SETRY_DSN', () => {
    process.env.SENTRY_DSN = 1234
    expect(createServer).toThrow('Invalid Sentry DSN: 1234')
  })

  afterEach(() => {
    server && server.close()
    delete process.env.SENTRY_DSN
  })
})

describe('server', () => {
  let app, server, events, url, channel

  beforeEach(done => {
    channel = '/fake-channel'
    app = createServer()

    server = app.listen(0, () => {
      url = `http://127.0.0.1:${server.address().port}${channel}`

      // Wait for event source to be ready
      events = new EventSource(url)
      events.addEventListener('ready', () => done())
    })
  })

  afterEach(() => {
    server && server.close()
    events && events.close()
  })

  describe('GET /', () => {
    it('returns the proper HTML', async () => {
      const res = await request(server).get('/')
      expect(res.status).toBe(200)
      expect(res.text).toMatchSnapshot()
    })
  })

  describe('GET /new', () => {
    it('redirects from /new to /TOKEN', async () => {
      const res = await request(server).get('/new')
      expect(res.status).toBe(307)
      expect(res.headers.location).toMatch(/^[\w-]+$/)
    })
  })

  describe('GET /:channel', () => {
    it('returns the proper HTML', async () => {
      const res = await request(server).get(channel)
      expect(res.status).toBe(200)
      expect(res.text).toMatchSnapshot()
    })

    it('returns a 403 for banned channels', async () => {
      const res = await request(server).get('/imbanned')
      expect(res.status).toBe(403)
    })
  })

  describe('events', () => {
    it('emits events', async done => {
      const payload = { payload: true }

      events.addEventListener('message', msg => {
        const data = JSON.parse(msg.data)
        expect(data.body).toEqual(payload)
        expect(data['x-foo']).toEqual('bar')

        // test is done if all of this gets called
        done()
      })

      await request(server).post(channel)
        .set('X-Foo', 'bar')
        .send(payload)
        .expect(200)
    })

    it('emits events when content-type is x-www-form-urlencoded', async done => {
      const payload = { payload: 'true' } // UrlEncoded are string:string

      events.addEventListener('message', msg => {
        const data = JSON.parse(msg.data)
        expect(data.body).toEqual(payload)

        // test is done if all of this gets called
        done()
      })

      await request(server).post(channel)
        .set('content-type', 'application/x-www-form-urlencoded')
        .send(payload)
        .expect(200)
    })

    it('POST /:channel/redeliver re-emits a payload', async done => {
      const payload = { payload: true }

      events.addEventListener('message', msg => {
        const data = JSON.parse(msg.data)
        expect(data).toEqual(payload)

        // test is done if all of this gets called
        done()
      })

      await request(server).post(channel + '/redeliver')
        .send(payload)
        .expect(200)
    })

    it('POST /:channel returns a 403 for banned channels', async () => {
      const res = await request(server).post('/imbanned')
      expect(res.status).toBe(403)
    })
  })
})
