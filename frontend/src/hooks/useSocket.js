import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useStore from '../store/useStore';

export default function useSocket() {
  const socketRef = useRef(null);
  const { accessToken, updateOnlineUsers, setTyping, addMessage, updateChatLastMessage } = useStore();

  useEffect(() => {
    if (!accessToken) return;

    // Connect to socket
    socketRef.current = io(import.meta.env.VITE_API_BASE, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    // Set up event listeners
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
      // Add message regardless of active chat (for notifications)
      addMessage(message.chat, message);
    });

    socket.on('message:read', ({ chatId, userId, messageIds }) => {
      // Handle read receipts if needed
      console.log('Messages read:', { chatId, userId, messageIds });
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken, updateOnlineUsers, setTyping, addMessage, updateChatLastMessage]);

  return socketRef;
}