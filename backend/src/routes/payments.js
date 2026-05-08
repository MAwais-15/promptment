const express = require('express')
const router  = express.Router()
const { protect, authorize } = require('../middleware/auth')
const {
  createEscrow, confirmPayment, releaseEscrow,
  getTransactions, getWallet, getCryptoAddress, withdrawToBank,
} = require('../controllers/paymentController')

router.post('/escrow',              protect, authorize('student'),           createEscrow)
router.post('/:id/confirm',         protect, authorize('admin'),             confirmPayment)
router.post('/:id/release',         protect, authorize('admin'),             releaseEscrow)
router.get( '/transactions',        protect,                                 getTransactions)
router.get( '/wallet',              protect,                                 getWallet)
router.get( '/crypto-address/:currency', protect,                           getCryptoAddress)
router.post('/withdraw',            protect, authorize('executor', 'student'), withdrawToBank)

module.exports = router
