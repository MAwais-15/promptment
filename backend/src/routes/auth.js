const express = require('express')
const router  = express.Router()
const {
  register, login, getMe, refreshToken,
  forgotPassword, resetPassword, changePassword,
} = require('../controllers/authController')
const { protect } = require('../middleware/auth')

router.post('/register',        register)
router.post('/login',           login)
router.post('/refresh',         refreshToken)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password',  resetPassword)
router.get( '/me',              protect, getMe)
router.put( '/change-password', protect, changePassword)

module.exports = router
