const express  = require('express')
const router   = express.Router()
const { protect, authorize } = require('../middleware/auth')
const upload   = require('../middleware/upload')
const {
  createAssignment, getAssignments, getMyAssignments, getAssignment,
  applyForAssignment, acceptExecutor, startAssignment,
  submitWork, approveWork, rejectWork, getApplicants, deleteAssignment,
} = require('../controllers/assignmentController')

// Public (with optional auth for location filtering)
router.get('/',    protect, getAssignments)

// Student routes
router.post('/',
  protect, authorize('student'),
  upload.array('files', 5),
  createAssignment
)

router.get('/my', protect, getMyAssignments)

router.get('/:id',             protect, getAssignment)
router.get('/:id/applicants',  protect, authorize('student'), getApplicants)

router.post('/:id/apply',      protect, authorize('executor'),           applyForAssignment)
router.post('/:id/accept',     protect, authorize('student'),            acceptExecutor)
router.put( '/:id/start',      protect, authorize('executor'),           startAssignment)

router.post('/:id/submit',
  protect, authorize('executor'),
  upload.array('files', 5),
  submitWork
)

router.post('/:id/approve',    protect, authorize('student', 'admin'),   approveWork)
router.post('/:id/reject',     protect, authorize('student', 'admin'),   rejectWork)
router.delete('/:id',          protect,                                  deleteAssignment)

module.exports = router
