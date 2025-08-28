// ChatWindow.jsx
import { useEffect } from 'react';
import api from '../../api/axios';
import useStore from '../../store/useStore';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import useSocket from '../../hooks/useSocket';

export default function ChatWindow() {
  const { activeChatId, messages, setMessages, user } = useStore();
  const socketRef = useSocket();

  // Load messages when chat changes
  useEffect(() => {
    if (!activeChatId) return;
    api.get(`/api/messages/${activeChatId}`).then(({ data }) => setMessages(activeChatId, data));
    const socket = socketRef.current;
    socket?.emit('chat:join', { chatId: activeChatId });
    return () => socket?.emit('chat:leave', { chatId: activeChatId });
  }, [activeChatId, setMessages, socketRef]);

  // Mark messages as read
  useEffect(() => {
    if (!activeChatId || !user?._id) return;
    const msgs = messages[activeChatId] || [];
    if (!msgs.length) return;
    const unreadIds = msgs
      .filter((m) => !m.readBy?.some((r) => r.user === user._id))
      .map((m) => m._id);
    if (unreadIds.length) {
      api.post(`/api/messages/${activeChatId}/read`, { messageIds: unreadIds });
      socketRef.current?.emit('message:read', { chatId: activeChatId, messageIds: unreadIds });
    }
  }, [activeChatId, messages, user, socketRef]);

  return (
    <div className="h-full grid grid-rows-[auto_1fr_auto]">
      <Header />
      <MessageList />
      <MessageInput />
    </div>
  );
}

function Header() {
  const { activeChatId, chats, onlineUsers } = useStore();
  const chat = chats.find((c) => c._id === activeChatId);
  const members = chat?.members || [];
  const anyoneOnline = members.some((m) => onlineUsers.has(m._id));

  return (
    <div className="p-3 border-b dark:border-gray-800 flex items-center justify-between">
      {chat ? (
        <div>
          <div className="font-semibold">
            {chat.isGroup ? chat.name : members.map((m) => m.name).join(', ')}
          </div>
          <div className="text-xs text-gray-500">{anyoneOnline ? 'Online' : 'Offline'}</div>
        </div>
      ) : (
        <div className="font-semibold">No chat selected</div>
      )}
    </div>
  );
}
