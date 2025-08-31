const Message = require('../models/Message');
const Chat = require('../models/Chat');

exports.listByChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const msgs = await Message.find({ chat: chatId })
      .populate('sender', '_id name avatarUrl') // include _id so frontend can check mine/theirs
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

    const msg = await Message.create({
      chat: chatId,
      sender: req.user._id,
      text: text || '',
      imageUrl: imageUrl || ''
    });

    // update chat lastMessage + updatedAt
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: msg._id,
      updatedAt: new Date()
    });

    // repopulate so frontend gets sender details
    const populated = await Message.findById(msg._id)
      .populate('sender', '_id name avatarUrl');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${chatId}`).emit('message:new', { message: populated });

      // Also notify all chat members (for sidebar updates, unread, etc.)
      const chat = await Chat.findById(chatId).select('members');
      if (chat && chat.members) {
        chat.members.forEach(memberId => {
          io.to(`user:${memberId.toString()}`).emit('chat:updated', {
            chatId,
            lastMessage: populated
          });
        });
      }
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
    const { messageIds } = req.body; // array of ids

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
