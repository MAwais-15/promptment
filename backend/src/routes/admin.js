const express = require('express')
const router  = express.Router()
const { protect, authorize } = require('../middleware/auth')
const {
  getDashboardStats, getAllUsers, banUser, unbanUser,
  getAllAssignments, getPendingApprovals, approveAssignment,
  getPaymentDashboard, getActivityLogs, getCommissions, flagAssignment,
} = require('../controllers/adminController')

// All admin routes require admin role
router.use(protect, authorize('admin'))

router.get( '/stats',                    getDashboardStats)
router.get( '/users',                    getAllUsers)
router.put( '/users/:id/ban',            banUser)
router.put( '/users/:id/unban',          unbanUser)
router.get( '/assignments',              getAllAssignments)
router.get( '/approvals',                getPendingApprovals)
router.post('/assignments/:id/approve',  approveAssignment)
router.put( '/assignments/:id/flag',     flagAssignment)
router.get( '/payments',                 getPaymentDashboard)
router.get( '/commissions',              getCommissions)
router.get( '/logs',                     getActivityLogs)

module.exports = router
