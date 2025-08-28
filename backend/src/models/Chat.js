const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  name: { type: String, default: '' },            // for group
  isGroup: { type: Boolean, default: false },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  avatarUrl: { type: String, default: '' }
}, { timestamps: true });

chatSchema.index({ name: 'text' });

module.exports = mongoose.model('Chat', chatSchema);
