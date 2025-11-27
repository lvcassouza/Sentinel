const express = require('express')
const auth = require('../middlewares/authMiddleware')
const { profile } = require('../controllers/userController')

const router = express.Router()

router.get('/profile', auth, profile)

module.exports = router