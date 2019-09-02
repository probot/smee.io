// Get an array of banned channel names
const bannedChannels = process.env.BANNED_CHANNELS && process.env.BANNED_CHANNELS.split(',')

// Middleware to bail early if the channel is banned
module.exports = function channelIsBanned (req, res, next) {
  // Can't use the req.param here because the route hasn't been defined
  const channel = req.originalUrl.slice(1)
  if (channel && bannedChannels && bannedChannels.includes(channel)) {
    return res.status(403).send('Channel has been disabled due to too many connections.')
  }

  next()
}
