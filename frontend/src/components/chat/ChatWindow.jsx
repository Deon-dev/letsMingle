import { useEffect } from 'react';
import api from '../../api/axios';
import useStore from '../../store/useStore';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import useSocket from '../../hooks/useSocket';

export default function ChatWindow() {
  const { activeChatId, messages, setMessages, user } = useStore();
  const socketRef = useSocket();


  useEffect(() => {
    if (!activeChatId) return;
    
    api.get(`/api/messages/${activeChatId}`)
      .then(({ data }) => {
        console.log('Messages loaded:', data.length); 
        setMessages(activeChatId, data);
      })
      .catch(error => {
        console.error('Failed to load messages:', error);
      });

    const socket = socketRef.current;
    if (socket) {
      console.log('Joining chat room:', activeChatId); 
      socket.emit('chat:join', { chatId: activeChatId });
      
      return () => {
        console.log('Leaving chat room:', activeChatId); 
        socket.emit('chat:leave', { chatId: activeChatId });
      };
    }
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

  if (!activeChatId) {
    return (
      <div className="h-full grid place-items-center text-gray-400">
        Select a chat to start messaging
      </div>
    );
  }

  return (
    <div className="h-full grid grid-rows-[auto_1fr_auto]">
      <Header />
      <MessageList />
      <MessageInput />
    </div>
  );
}

function Header() {
  const { activeChatId, chats, onlineUsers, user } = useStore();
  const chat = chats.find((c) => c._id === activeChatId);
  
  if (!chat) {
    return (
      <div className="p-3 border-b dark:border-gray-800">
        <div className="font-semibold">Loading...</div>
      </div>
    );
  }

  const members = chat.members || [];
  const otherMembers = members.filter(m => m._id !== user._id);
  const anyoneOnline = otherMembers.some((m) => onlineUsers.has(m._id));

  const chatName = chat.isGroup 
    ? chat.name 
    : otherMembers.map((m) => m.name).join(', ') || 'Unknown';

  return (
    <div className="p-3 border-b dark:border-gray-800 flex items-center justify-between">
      <div>
        <div className="font-semibold">{chatName}</div>
        <div className="text-xs text-gray-500">
          {chat.isGroup 
            ? `${members.length} members${anyoneOnline ? ' • Some online' : ''}` 
            : anyoneOnline ? 'Online' : 'Offline'
          }
        </div>
      </div>
    </div>
  );
}