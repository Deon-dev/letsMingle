const Message = require('../models/Message');
const Chat = require('../models/Chat');

exports.listByChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    // ✅ Check membership
    const chat = await Chat.findById(chatId).select('members');
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    const isMember = chat.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ error: "You are not a member of this chat" });
    }

    const msgs = await Message.find({ chat: chatId })
      .populate('sender', '_id name avatarUrl')
      .sort({ createdAt: 1 });

    res.json(msgs);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

exports.send = async (req, res) => {
  try {
    const { chatId, text, imageUrl } = req.body;

    // ✅ Check membership
    const chat = await Chat.findById(chatId).select('members');
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    const isMember = chat.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ error: "You are not a member of this chat" });
    }

    const msg = await Message.create({
      chat: chatId,
      sender: req.user._id,
      text: text || '',
      imageUrl: imageUrl || ''
    });

    // update chat lastMessage + updatedAt
    chat.lastMessage = msg._id;
    chat.updatedAt = new Date();
    await chat.save();

    // repopulate so frontend gets sender details
    const populated = await Message.findById(msg._id)
      .populate('sender', '_id name avatarUrl');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${chatId}`).emit('message:new', { message: populated });

      // Notify all chat members (sidebar updates, unread counts, etc.)
      chat.members.forEach(memberId => {
        io.to(`user:${memberId.toString()}`).emit('chat:updated', {
          chatId,
          lastMessage: populated
        });
      });
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
};

exports.markRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { messageIds } = req.body;

    // ✅ Check membership
    const chat = await Chat.findById(chatId).select('members');
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    const isMember = chat.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ error: "You are not a member of this chat" });
    }

    await Message.updateMany(
      {
        _id: { $in: messageIds },
        chat: chatId,
        'readBy.user': { $ne: req.user._id }
      },
      {
        $push: { readBy: { user: req.user._id, at: new Date() } }
      }
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("Error marking messages read:", err);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
};

