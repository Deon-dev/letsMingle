import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useStore from '../store/useStore';

export default function useSocket() {
  const { accessToken, setPresence, addMessage, removeTyping, addTyping } = useStore();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!accessToken) return;
    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token: accessToken }
    });
    socketRef.current = socket;

    // socket.on('presence:update', ({ userId, online }) => setPresence(userId, online));

    socket.on('message:new', ({ message }) => {
      addMessage(message.chat, message);

      // desktop notification (if granted)
      if (Notification.permission === 'granted') {
        new Notification((message.sender?.name || 'New message'), {
          body: message.text || 'Image',
          tag: message.chat
        });
      }
    });

    socket.on('typing', ({ chatId, userId }) => addTyping(chatId, userId));
    socket.on('stop_typing', ({ chatId, userId }) => removeTyping(chatId, userId));
    socket.on('message:read', () => {/* UI can update read receipts if stored */});

    return () => socket.disconnect();
  }, [accessToken, setPresence, addMessage, removeTyping, addTyping]);

  return socketRef;
}
