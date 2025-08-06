const neostandard = require('neostandard')

module.exports = [
  ...neostandard({
    env: ['browser', 'es2022'],
    files: ['src/**/*.js', 'src/**/*.jsx', 'index.js', 'lib/**/*.js'],
  }),
  ...neostandard({
    env: ['jest'],
    files: ['test/**/*.js', 'test/**/*.jsx'],
    ignores: [
      'node_modules',
      'public',
    ]
  })
]
