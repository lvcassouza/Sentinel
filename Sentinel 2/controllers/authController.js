const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { createUser, findUserByEmail } = require('../models/userModel')
const { createRefreshToken, findRefreshTokenByHash, revokeRefreshToken } = require('../models/tokenModel')

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) return res.status(400).json({ error: 'Dados inválidos' })
    const existing = await findUserByEmail(email)
    if (existing) return res.status(409).json({ error: 'Email já registrado' })
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)
    const user = await createUser(name, email, hash)
    res.status(201).json({ user })
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Dados inválidos' })
    const user = await findUserByEmail(email)
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' })
    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(401).json({ error: 'Credenciais inválidas' })
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' })
    const refreshToken = crypto.randomBytes(48).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await createRefreshToken(user.id, tokenHash, expiresAt)
    res.json({ token, refreshToken })
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' })
  }
}

module.exports = { register, login }
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token ausente' })
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
    const stored = await findRefreshTokenByHash(tokenHash)
    if (!stored) return res.status(401).json({ error: 'Refresh token inválido' })
    if (stored.revoked_at) return res.status(401).json({ error: 'Refresh token revogado' })
    if (new Date(stored.expires_at).getTime() < Date.now()) return res.status(401).json({ error: 'Refresh token expirado' })
    const accessToken = jwt.sign({ sub: stored.user_id }, process.env.JWT_SECRET, { expiresIn: '15m' })
    const newRefresh = crypto.randomBytes(48).toString('hex')
    const newHash = crypto.createHash('sha256').update(newRefresh).digest('hex')
    const newExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await revokeRefreshToken(tokenHash)
    await createRefreshToken(stored.user_id, newHash, newExpires)
    res.json({ token: accessToken, refreshToken: newRefresh })
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' })
  }
}

module.exports.refresh = refresh
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token ausente' })
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
    const stored = await findRefreshTokenByHash(tokenHash)
    if (!stored) return res.status(200).json({ revoked: true })
    await revokeRefreshToken(tokenHash)
    res.status(200).json({ revoked: true })
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' })
  }
}

module.exports.logout = logout