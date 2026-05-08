const express = require('express')
const router  = express.Router()
const { protect } = require('../middleware/auth')
const {
  getConversation, getMessages, sendMessage, markRead, getMyConversations,
} = require('../controllers/chatController')

router.get('/',                protect, getMyConversations)
router.get('/:assignmentId',   protect, getConversation)
router.get('/:id/messages',    protect, getMessages)
router.post('/:id/messages',   protect, sendMessage)
router.put('/:id/read',        protect, markRead)

module.exports = router
