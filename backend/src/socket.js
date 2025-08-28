const { Server } = require('socket.io');
const { verifyAccess } = require('./utils/jwt');
const Chat = require('./models/Chat');
const Message = require('./models/Message');

// Track online users: userId -> Set(socketIds)
const online = new Map();

function addOnline(userId, socketId) {
  const set = online.get(userId) || new Set();
  set.add(socketId);
  online.set(userId, set);
}
function removeOnline(userId, socketId) {
  const set = online.get(userId);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) online.delete(userId);
}

module.exports = function createIO(server, corsOrigin) {
  const io = new Server(server, {
    cors: { origin: corsOrigin, credentials: true }
  });

  // Auth middleware for sockets
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token'));
      const payload = verifyAccess(token);
      socket.user = { id: payload.id };
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    addOnline(userId, socket.id);

    // Join personal room for direct events
    socket.join(`user:${userId}`);

    // Broadcast presence
    io.emit('presence:update', { userId, online: true });

    // Join all chat rooms the user is in (optional optimization)
    // const userChats = await Chat.find({ members: userId }).select('_id');
    // userChats.forEach(c => socket.join(`chat:${c._id}`));

    // join/leave specific chat
    socket.on('chat:join', ({ chatId }) => {
      socket.join(`chat:${chatId}`);
    });
    socket.on('chat:leave', ({ chatId }) => {
      socket.leave(`chat:${chatId}`);
    });

    // typing indicators
    socket.on('typing', ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit('typing', { chatId, userId });
    });
    socket.on('stop_typing', ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit('stop_typing', { chatId, userId });
    });

    // send message (optional alternative to REST)
    socket.on('message:send', async ({ chatId, text, imageUrl }) => {
      const msg = await Message.create({ chat: chatId, sender: userId, text: text || '', imageUrl: imageUrl || '' });
      await Chat.findByIdAndUpdate(chatId, { lastMessage: msg._id, updatedAt: new Date() });

      const populated = await Message.findById(msg._id).populate('sender', 'name avatarUrl');
      io.to(`chat:${chatId}`).emit('message:new', { message: populated });
      // Also notify all members personally (for notifications/unread)
      const chat = await Chat.findById(chatId).select('members');
      chat.members.forEach(m => {
        io.to(`user:${m.toString()}`).emit('chat:updated', { chatId, lastMessage: populated });
      });
    });

    // read receipts
    socket.on('message:read', async ({ chatId, messageIds }) => {
      await Message.updateMany(
        { _id: { $in: messageIds }, chat: chatId, 'readBy.user': { $ne: userId } },
        { $push: { readBy: { user: userId, at: new Date() } } }
      );
      socket.to(`chat:${chatId}`).emit('message:read', { chatId, userId, messageIds });
    });

    socket.on('disconnect', () => {
      removeOnline(userId, socket.id);
      if (!online.has(userId)) {
        io.emit('presence:update', { userId, online: false });
      }
    });
  });

  return io;
};
