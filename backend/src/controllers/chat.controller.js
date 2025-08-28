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
  const members = Array.from(new Set([...memberIds.map(id => id.toString()), req.user._id.toString()]));
  const chat = await Chat.create({
    isGroup,
    name: isGroup ? name : '',
    members,
    admins: [req.user._id]
  });
  const populated = await Chat.findById(chat._id).populate('members', 'name avatarUrl');
  res.status(201).json(populated);
};

exports.addMembers = async (req, res) => {
  const { chatId } = req.params;
  const { memberIds } = req.body;
  const chat = await Chat.findByIdAndUpdate(chatId, { $addToSet: { members: { $each: memberIds } } }, { new: true })
    .populate('members', 'name avatarUrl');
  res.json(chat);
};
