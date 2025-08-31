import { useState, useEffect } from 'react';
import useStore from '../../store/useStore';
import useAuth from '../../hooks/useAuth';
import api from '../../api/axios';

export default function Sidebar() {
  const { user, chats, setChats, activeChatId, setActiveChatId, addChat } = useStore();
  const { logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGroup, setIsGroup] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Load chats on mount
  useEffect(() => {
    const loadChats = async () => {
      try {
        const { data } = await api.get('/api/chats');
        setChats(data);
      } catch (error) {
        console.error('Failed to load chats:', error);
      }
    };
    loadChats();
  }, [setChats]);

  // Search users
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data } = await api.get(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(data);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const startChat = async (selectedUser) => {
    setLoading(true);
    try {
      const existingChat = chats.find(
        (chat) =>
          !chat.isGroup &&
          chat.members.length === 2 &&
          chat.members.some((m) => m._id === selectedUser._id) &&
          chat.members.some((m) => m._id === user._id)
      );

      if (existingChat) {
        setActiveChatId(existingChat._id);
        setSearchQuery('');
        setSearchResults([]);
        setIsModalOpen(false);
        return;
      }

      const { data } = await api.post('/api/chats', {
        isGroup: false,
        memberIds: [selectedUser._id],
      });

      if (!chats.some((c) => c._id === data._id)) {
        addChat(data);
      }

      setActiveChatId(data._id);
      setSearchQuery('');
      setSearchResults([]);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to start chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const startGroupChat = async () => {
    if (selectedUsers.length < 2) {
      alert('Please select at least 2 users for a group chat.');
      return;
    }

    try {
      const { data } = await api.post('/api/chats', {
        isGroup: true,
        name: `Group with ${selectedUsers.map((u) => u.name).join(', ')}`,
        memberIds: selectedUsers.map((u) => u._id),
      });

      addChat(data);
      setActiveChatId(data._id);
      setSelectedUsers([]);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to create group chat:', error);
    }
  };

  const formatLastMessage = (chat) => {
    if (!chat.lastMessage) return 'No messages yet';
    const msg = chat.lastMessage;
    const text = typeof msg === 'string' ? '' : msg.text || '';
    const imageUrl = typeof msg === 'string' ? '' : msg.imageUrl || '';
    if (imageUrl && !text) return '📷 Image';
    if (text) return text;
    return 'No messages yet';
  };

  const formatTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const msgDate = new Date(date);
    const diffMs = now - msgDate;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return msgDate.toLocaleDateString();
  };

  const getChatName = (chat) => {
    if (chat.isGroup) return chat.name;
    const otherMember = chat.members.find((m) => m._id !== user._id);
    return otherMember?.name || 'Unknown';
  };

  const getChatAvatar = (chat) => {
    if (chat.isGroup) return chat.avatarUrl || '👥';
    const otherMember = chat.members.find((m) => m._id !== user._id);
    return otherMember?.avatarUrl || '👤';
  };

  const toggleUserSelection = (u) => {
    if (selectedUsers.some((su) => su._id === u._id)) {
      setSelectedUsers(selectedUsers.filter((su) => su._id !== u._id));
    } else {
      setSelectedUsers([...selectedUsers, u]);
    }
  };

  return (
    <div className="h-full bg-white dark:bg-gray-900 border-r dark:border-gray-800 flex flex-col relative">
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Messages</h1>
          <button
            onClick={logout}
            className="text-sm text-red-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Logout
          </button>
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div className="w-8 h-8 bg-brand-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{user?.name}</div>
            <div className="text-xs text-gray-500 truncate">{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No chats yet. Click the + button to start chatting!
          </div>
        ) : (
          chats.map((chat) => (
            <button
              key={chat._id}
              onClick={() => setActiveChatId(chat._id)}
              className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 border-b dark:border-gray-800 transition-colors ${
                activeChatId === chat._id ? 'bg-brand-50 dark:bg-brand-900/30 border-r-2 border-r-brand-500' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {typeof getChatAvatar(chat) === 'string' &&
                  getChatAvatar(chat).startsWith('http') ? (
                    <img
                      src={getChatAvatar(chat)}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getChatAvatar(chat)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-sm truncate">{getChatName(chat)}</h3>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatTime(chat.updatedAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{formatLastMessage(chat)}</p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Floating button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="absolute bottom-4 right-4 bg-brand-500 hover:bg-brand-600 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-2xl"
      >
        +
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-h-[80vh] flex flex-col">
            <h2 className="text-lg font-semibold mb-4">
              {isGroup ? 'Start Group Chat' : 'Start New Chat'}
            </h2>

            {/* Search */}
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Search users..."
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isSearching && (
                <div className="absolute right-3 top-2.5 w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto">
              {searchResults.map((u) => (
                <button
                  key={u._id}
                  onClick={() => (isGroup ? toggleUserSelection(u) : startChat(u))}
                  disabled={loading}
                  className={`w-full p-3 flex items-center gap-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-left mb-1 ${
                    selectedUsers.some((su) => su._id === u._id) ? 'bg-brand-100 dark:bg-brand-700' : ''
                  }`}
                >
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-semibold">
                    {u.avatarUrl ? (
                      <img
                        src={u.avatarUrl}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      u.name[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{u.name}</div>
                    <div className="text-xs text-gray-500 truncate">{u.email}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => setIsGroup(!isGroup)}
                className="text-sm text-brand-500 hover:underline"
              >
                {isGroup ? 'Switch to single chat' : 'Switch to group chat'}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-sm"
                >
                  Cancel
                </button>
                {isGroup && (
                  <button
                    onClick={startGroupChat}
                    className="px-4 py-2 rounded bg-brand-500 hover:bg-brand-600 text-white text-sm"
                  >
                    Create Group
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

