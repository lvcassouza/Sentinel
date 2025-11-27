const { pool } = require('../config/db')

const createRefreshToken = async (userId, tokenHash, expiresAt) => {
  const res = await pool.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3) RETURNING id, user_id, token_hash, expires_at, created_at, revoked_at',
    [userId, tokenHash, expiresAt]
  )
  return res.rows[0]
}

const findRefreshTokenByHash = async (tokenHash) => {
  const res = await pool.query(
    'SELECT id, user_id, token_hash, expires_at, revoked_at FROM refresh_tokens WHERE token_hash=$1',
    [tokenHash]
  )
  return res.rows[0] || null
}

const revokeRefreshToken = async (tokenHash) => {
  await pool.query('UPDATE refresh_tokens SET revoked_at=NOW() WHERE token_hash=$1', [tokenHash])
}

module.exports = { createRefreshToken, findRefreshTokenByHash, revokeRefreshToken }