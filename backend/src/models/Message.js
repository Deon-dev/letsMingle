const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

messageSchema.index({ text: 'text' });

module.exports = mongoose.model('Message', messageSchema);
