const jwt = require('jsonwebtoken')

const auth = (req, res, next) => {
  const header = req.headers['authorization'] || ''
  const parts = header.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Token ausente' })
  const token = parts[1]
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = payload.sub
    next()
  } catch (e) {
    res.status(401).json({ error: 'Token inválido' })
  }
}

module.exports = auth