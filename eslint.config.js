const globals = require('globals')

module.exports = require('neostandard')({
  globals: { ...globals.jest },
  ignores: [
    'node_modules',
    'public',
  ]
})
