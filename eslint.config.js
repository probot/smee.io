import neostandard from 'neostandard'

export default [
  ...neostandard({
    env: ['browser', 'es2022'],
    ts: true,
    filesTs: ['src/**/*.ts', 'src/**/*.tsx'],
    files: ['src/**/*.js', 'index.js', 'lib/**/*.js'],
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
