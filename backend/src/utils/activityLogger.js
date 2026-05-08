const { ActivityLog } = require('../models/Notification')

exports.logActivity = async ({
  actor = null, actorName = 'System',
  action, target = '', targetId = null, targetModel = null,
  metadata = {}, ip = null, type = 'info',
}) => {
  try {
    await ActivityLog.create({
      actor, actorName, action, target,
      targetId, targetModel, metadata, ip, type,
    })
  } catch (err) {
    // never crash the app due to logging failure
    console.error('Activity log error:', err.message)
  }
}
