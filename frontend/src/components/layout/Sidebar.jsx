import { useState, useEffect } from 'react';
import useStore from '../../store/useStore';
import useAuth from '../../hooks/useAuth';
import api from '../../api/axios';
import GroupCreator from '../chat/GroupCreator';

export default function Sidebar() {
  const { user, chats, setChats, activeChatId, setActiveChatId, addChat, updateChatLastMessage } = useStore();
  const { logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showGroupCreator, setShowGroupCreator] = useState(false);

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
      // Check if chat already exists with this user (more thorough check)
      const existingChat = chats.find(chat => 
        !chat.isGroup && 
        chat.members.length === 2 &&
        chat.members.some(member => member._id === selectedUser._id) &&
        chat.members.some(member => member._id === user._id)
      );

      if (existingChat) {
        // Select existing chat
        setActiveChatId(existingChat._id);
        setSearchQuery('');
        setSearchResults([]);
        return;
      }

      // Create new chat
      const { data } = await api.post('/api/chats', {
        isGroup: false,
        memberIds: [selectedUser._id]
      });

      // Check if chat already exists in the list before adding
      const chatExists = chats.some(chat => chat._id === data._id);
      if (!chatExists) {
        addChat(data);
      }
      
      setActiveChatId(data._id);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Failed to start chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatLastMessage = (chat) => {
    if (!chat.lastMessage) return 'No messages yet';
    const msg = chat.lastMessage;
    
    // Handle both populated and non-populated lastMessage
    const text = typeof msg === 'string' ? '' : (msg.text || '');
    const imageUrl = typeof msg === 'string' ? '' : (msg.imageUrl || '');
    
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
    const otherMember = chat.members.find(m => m._id !== user._id);
    return otherMember?.name || 'Unknown';
  };

  const getChatAvatar = (chat) => {
    if (chat.isGroup) return chat.avatarUrl || '👥';
    const otherMember = chat.members.find(m => m._id !== user._id);
    return otherMember?.avatarUrl || '👤';
  };

  return (
    <>
      <div className="h-full bg-white dark:bg-gray-900 border-r dark:border-gray-800 flex flex-col">
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

        {/* Search and Actions */}
        <div className="p-4 border-b dark:border-gray-800 space-y-3">
          {/* Create Group Button */}
          <button
            onClick={() => setShowGroupCreator(true)}
            className="w-full py-2 px-3 bg-brand-500 text-white rounded-lg hover:opacity-90 text-sm font-medium flex items-center justify-center gap-2"
          >
            <span>👥</span>
            Create Group
          </button>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isSearching && (
              <div className="absolute right-3 top-2.5 w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 max-h-48 overflow-y-auto">
              {searchResults.map(user => (
                <button
                  key={user._id}
                  onClick={() => startChat(user)}
                  disabled={loading}
                  className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 border-b dark:border-gray-700 last:border-b-0 disabled:opacity-50"
                >
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      user.name[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{user.name}</div>
                    <div className="text-xs text-gray-500 truncate">{user.email}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No chats yet. Search for users or create a group to start chatting!
            </div>
          ) : (
            chats.map(chat => (
              <button
                key={chat._id}
                onClick={() => setActiveChatId(chat._id)}
                className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 border-b dark:border-gray-800 transition-colors ${
                  activeChatId === chat._id ? 'bg-brand-50 dark:bg-brand-900/30 border-r-2 border-r-brand-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {typeof getChatAvatar(chat) === 'string' && getChatAvatar(chat).startsWith('http') ? (
                      <img src={getChatAvatar(chat)} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      getChatAvatar(chat)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm truncate">{getChatName(chat)}</h3>
                        {chat.isGroup && (
                          <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                            {chat.members.length}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatTime(chat.updatedAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {formatLastMessage(chat)}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Group Creator Modal */}
      {showGroupCreator && (
        <GroupCreator
          onClose={() => setShowGroupCreator(false)}
          onGroupCreated={(group) => {
            console.log('Group created:', group);
            setShowGroupCreator(false);
          }}
        />
      )}
    </>
  );
}