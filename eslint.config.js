const globals = require('globals')

module.exports = require('neostandard')({
  noJsx: true,
  globals: { ...globals.jest },
  ignores: [
    'node_modules',
    'public',
  ]
})
