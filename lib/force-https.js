'use strict'

const fastifyPlugin = require('fastify-plugin')

module.exports = fastifyPlugin(function (fastify, opts, next) {
  fastify.addHook('onRequest', function (req, reply, done) {
    if (req.protocol !== 'https') {
      if (req.method === 'GET' || req.method === 'HEAD') {
        reply.redirect(`https://${req.hostname}${req.url}`)
        return
      } else {
        reply.code(403).send('Please use HTTPS when submitting data to this server.')
        return
      }
    }
    done()
  })
  next()
})
