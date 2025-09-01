import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useStore from '../store/useStore';

export default function useSocket() {
  const socketRef = useRef(null);
  const { 
    accessToken, 
    updateOnlineUsers, 
    setTyping, 
    addMessage, 
    updateChatLastMessage,
    addChat,
    setChats,
    incrementUnread
  } = useStore();

  useEffect(() => {
    if (!accessToken) return;

    socketRef.current = io(import.meta.env.VITE_API_BASE, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    socket.on('presence:update', ({ userId, online }) => {
      updateOnlineUsers(userId, online);
    });

    socket.on('typing', ({ chatId, userId }) => {
      setTyping(chatId, userId, true);
    });

    socket.on('stop_typing', ({ chatId, userId }) => {
      setTyping(chatId, userId, false);
    });

    socket.on('message:new', ({ message }) => {
      const activeChatId = useStore.getState().activeChatId;

      addMessage(message.chat, message);
      updateChatLastMessage(message.chat, message);

      if (activeChatId !== message.chat) {
        incrementUnread(message.chat); // 🔴 Add unread if not viewing
      }
    });

    socket.on('message:read', ({ chatId, userId, messageIds }) => {
      console.log('Messages read:', { chatId, userId, messageIds });
    });

    socket.on('chat:new', ({ chat }) => {
      console.log('New chat received:', chat);
      addChat(chat);
    });

    socket.on('chat:updated', ({ chat, chatId, lastMessage }) => {
      if (chat) {
        setChats(prevChats => {
          const existing = prevChats.find(c => c._id === chat._id);
          if (existing) {
            return prevChats.map(c => c._id === chat._id ? chat : c);
          } else {
            return [chat, ...prevChats];
          }
        });
      } else if (lastMessage) {
        updateChatLastMessage(chatId, lastMessage);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken, updateOnlineUsers, setTyping, addMessage, updateChatLastMessage, addChat, setChats, incrementUnread]);

  return socketRef;
}
