const Chat = require('../models/Chat');
const Message = require('../models/Message');

exports.listChats = async (req, res) => {
  const chats = await Chat.find({ members: req.user._id })
    .populate('members', 'name avatarUrl')
    .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'name avatarUrl' } })
    .sort({ updatedAt: -1 });
  res.json(chats);
};

exports.createChat = async (req, res) => {
  const { isGroup, name, memberIds } = req.body;

  // Always include the current user
  const members = Array.from(new Set([
    ...memberIds.map(id => id.toString()),
    req.user._id.toString()
  ]));

  // If it's a 1-to-1 chat, check if it already exists
  if (!isGroup) {
    const existing = await Chat.findOne({
      isGroup: false,
      members: { $all: members, $size: 2 }
    })
      .populate('members', 'name avatarUrl')
      .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'name avatarUrl' } });

    if (existing) {
      return res.json(existing);
    }
  }

  const chat = await Chat.create({
    isGroup,
    name: isGroup ? name : '',
    members,
    admins: [req.user._id]
  });

  const populated = await Chat.findById(chat._id)
    .populate('members', 'name avatarUrl');

  // Notify all members via socket
  const io = req.app.get('io');
  if (io) {
    members.forEach(memberId => {
      io.to(`user:${memberId}`).emit('chat:new', { chat: populated });
    });
  }

  res.status(201).json(populated);
};

exports.addMembers = async (req, res) => {
  const { chatId } = req.params;
  const { memberIds } = req.body;

  const chat = await Chat.findById(chatId);
  if (!chat) return res.status(404).json({ error: "Chat not found" });

  // Only admins can add members
  if (!chat.admins.includes(req.user._id)) {
    return res.status(403).json({ error: "Only admins can add members" });
  }

  chat.members = [...new Set([...chat.members.map(id => id.toString()), ...memberIds])];
  await chat.save();

  const updated = await Chat.findById(chatId)
    .populate('members', 'name avatarUrl');

  // Notify all members
  const io = req.app.get('io');
  if (io) {
    updated.members.forEach(member => {
      io.to(`user:${member._id.toString()}`).emit('chat:updated', { chat: updated });
    });
  }

  res.json(updated);
};
