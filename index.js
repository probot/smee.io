require('dotenv').config()

const app = require('./lib/server')()
const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log('Listening at http://localhost:' + port)
})
