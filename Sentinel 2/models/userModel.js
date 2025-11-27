const { pool } = require('../config/db')

const createUser = async (name, email, passwordHash) => {
  const res = await pool.query(
    'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
    [name, email, passwordHash]
  )
  return res.rows[0]
}

const findUserByEmail = async (email) => {
  const res = await pool.query(
    'SELECT id, name, email, password FROM users WHERE email=$1',
    [email]
  )
  return res.rows[0] || null
}

const findUserById = async (id) => {
  const res = await pool.query(
    'SELECT id, name, email, created_at FROM users WHERE id=$1',
    [id]
  )
  return res.rows[0] || null
}

module.exports = { createUser, findUserByEmail, findUserById }