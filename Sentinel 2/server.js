require('dotenv').config()
const express = require('express')
const { initDb } = require('./config/db')

const app = express()

app.use(express.json())

app.use('/auth', require('./routes/authRoutes'))
app.use('/user', require('./routes/userRoutes'))

const swaggerUi = require('swagger-ui-express')
const { spec } = require('./config/swagger')
app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec))

const port = process.env.PORT || 3000

if (process.env.NODE_ENV !== 'test') {
  initDb()
    .then(() => {
      app.listen(port, () => {})
    })
    .catch(() => {
      process.exit(1)
    })
}

module.exports = app