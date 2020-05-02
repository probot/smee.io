module.exports = async () => {
  // Set a timezone for consistent timestamps in CI
  process.env.TZ = 'UTC'
}
