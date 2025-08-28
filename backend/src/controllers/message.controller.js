const Message = require('../models/Message');
const Chat = require('../models/Chat');

exports.listByChat = async (req, res) => {
  const { chatId } = req.params;
  const msgs = await Message.find({ chat: chatId })
    .populate('sender', 'name avatarUrl')
    .sort({ createdAt: 1 });
  res.json(msgs);
};

exports.send = async (req, res) => {
  const { chatId, text, imageUrl } = req.body;
  const msg = await Message.create({
    chat: chatId,
    sender: req.user._id,
    text: text || '',
    imageUrl: imageUrl || ''
  });
  await Chat.findByIdAndUpdate(chatId, { lastMessage: msg._id, updatedAt: new Date() });
  const populated = await Message.findById(msg._id).populate('sender', 'name avatarUrl');
  res.status(201).json(populated);
};

exports.markRead = async (req, res) => {
  const { chatId } = req.params;
  const { messageIds } = req.body; // array
  await Message.updateMany(
    { _id: { $in: messageIds }, chat: chatId, 'readBy.user': { $ne: req.user._id } },
    { $push: { readBy: { user: req.user._id, at: new Date() } } }
  );
  res.json({ ok: true });
};
