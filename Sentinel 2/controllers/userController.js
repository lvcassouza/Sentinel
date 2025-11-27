const { findUserById } = require('../models/userModel')

const profile = async (req, res) => {
  try {
    const user = await findUserById(req.userId)
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' })
    res.json({ user })
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' })
  }
}

module.exports = { profile }