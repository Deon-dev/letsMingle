import { useEffect, useState } from 'react';
import api from '../../api/axios';
import useStore from '../../store/useStore';
import Modal from '../ui/Modal';

export default function Sidebar() {
  const {
    chats,
    setChats,
    setActiveChat,
    activeChatId,
    onlineUsers,
    currentUser, // 👈 make sure your store has this
  } = useStore();

  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch chats on mount
  useEffect(() => {
    api.get('/api/chats').then(({ data }) => setChats(data));
  }, [setChats]);

  // Search users with debouncing
  useEffect(() => {
    const run = async () => {
      if (!q) return setResults([]);
      const { data } = await api.get('/api/users/search', { params: { q } });
      setResults(data);
    };
    const t = setTimeout(run, 300);
    return () => clearTimeout(t);
  }, [q]);

  // Start DM with a user from search results
  const startDM = async (userId) => {
    try {
      const { data } = await api.post('/api/chats', {
        isGroup: false,
        memberIds: [userId],
      });
      setChats((prev) => {
        if (prev.some((c) => c._id === data._id)) return prev;
        return [...prev, data];
      });
      setActiveChat(data._id);
      setQ('');
    } catch (e) {
      console.error('Error starting DM:', e);
    }
  };

  return (
    <div className="card h-full flex flex-col">
      {/* Search bar and new chat button */}
      <div className="p-3 border-b dark:border-gray-800 flex items-center gap-2">
        <input
          className="input flex-1"
          placeholder="Search users or chats..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-xl font-bold"
          onClick={() => setIsModalOpen(true)}
          title="New Chat or Group"
        >
          +
        </button>
      </div>

      {q ? (
        // Search results
        <div className="p-2 overflow-y-auto">
          {results.map((u) => (
            <button
              key={u._id}
              className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              onClick={() => startDM(u._id)}
            >
              <div className="flex items-center gap-2">
                <PresenceDot online={onlineUsers.has(u._id)} />
                <div>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        // Chat list with last message
        <div className="flex-1 overflow-y-auto">
          {chats.map((c) => (
            <button
              key={c._id}
              onClick={() => setActiveChat(c._id)}
              className={`w-full p-3 text-left border-b dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                activeChatId === c._id ? 'bg-gray-100 dark:bg-gray-800' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium line-clamp-1">
                  {c.isGroup
                    ? c.name
                    : currentUser
                      ? c.members?.find((m) => m._id !== currentUser._id)?.name
                      : 'Unknown'}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(c.updatedAt).toLocaleTimeString()}
                </div>
              </div>
              <div className="text-sm text-gray-500 line-clamp-1">
                {c.lastMessage?.text ||
                  (c.lastMessage?.imageUrl ? '📷 Image' : 'No messages')}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Modal for new chat or group chat */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateChat={(chatData) => {
          setChats((prev) => {
            if (prev.some((c) => c._id === chatData._id)) return prev;
            return [...prev, chatData];
          });
          setActiveChat(chatData._id);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}

function PresenceDot({ online }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${
        online ? 'bg-green-500' : 'bg-gray-400'
      }`}
    />
  );
}