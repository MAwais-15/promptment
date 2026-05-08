const mongoose = require('mongoose')

// ─── Message Schema ──────────────────────────────────────
const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Conversation',
      required: true,
    },
    sender: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    content: {
      type:    String,
      default: '',
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    attachments: [
      {
        name:     String,
        url:      String,
        publicId: String,
        size:     Number,
        mimeType: String,
      },
    ],
    type: {
      type:    String,
      enum:    ['text', 'file', 'system', 'image'],
      default: 'text',
    },
    read:     { type: Boolean, default: false },
    readAt:   { type: Date,   default: null },
    deleted:  { type: Boolean, default: false },
  },
  { timestamps: true }
)

messageSchema.index({ conversation: 1, createdAt: -1 })
messageSchema.index({ sender: 1 })

// ─── Conversation Schema ─────────────────────────────────
const conversationSchema = new mongoose.Schema(
  {
    assignment: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Assignment',
      required: true,
      unique:   true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'User',
      },
    ],
    lastMessage: {
      content:   { type: String,  default: '' },
      sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      sentAt:    { type: Date,    default: null },
    },
    unreadCounts: {
      type:    Map,
      of:      Number,
      default: {},
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

conversationSchema.index({ assignment: 1 })
conversationSchema.index({ participants: 1 })

const Message      = mongoose.model('Message',      messageSchema)
const Conversation = mongoose.model('Conversation', conversationSchema)

module.exports = { Message, Conversation }
