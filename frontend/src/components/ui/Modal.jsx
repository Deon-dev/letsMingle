import { useState, useEffect } from 'react';
import api from '../../api/axios';
import useStore from '../../store/useStore';

export default function Modal({ isOpen, onClose, onCreateChat }) {
  const { user } = useStore(); // Get current user for group chat creation
  const [mode, setMode] = useState('select'); // 'select', 'dm', or 'group'
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null); // For DM
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]); // For group chat
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Search users for DM or group chat
  useEffect(() => {
    const run = async () => {
      if (!searchQuery) {
        setSearchResults([]);
        return;
      }
      try {
        const { data } = await api.get('/api/users/search', { params: { q: searchQuery } });
        setSearchResults(data);
      } catch (e) {
        setError(`Failed to search users: ${e.message}`);
        console.error('Error searching users:', e);
      }
    };
    const t = setTimeout(run, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Handle selecting/deselecting group members
  const toggleGroupMember = (user) => {
    setSelectedGroupMembers((prev) =>
      prev.some((u) => u._id === user._id)
        ? prev.filter((u) => u._id !== user._id)
        : [...prev, user]
    );
  };

  // Handle creating a chat (DM or group)
  const handleCreate = async () => {
    console.log('handleCreate called, mode:', mode);
    if (isLoading) {
      console.log('Aborted: isLoading is true');
      return;
    }
    setError('');
    setIsLoading(true);

    console.log('Current user:', user);
    const payload = mode === 'dm' && selectedUser
      ? { isGroup: false, memberIds: [selectedUser._id] }
      : mode === 'group' && groupName
      ? { isGroup: true, name: groupName, memberIds: user?._id ? [user._id, ...selectedGroupMembers.map((u) => u._id)] : [] }
      : null;
    console.log('Payload:', payload);

    try {
      if (!payload) {
        setError('Please provide a group name or select a user.');
        console.log('Aborted: Invalid payload');
        return;
      }
      if (mode === 'group' && !user?._id) {
        setError('User not authenticated. Please log in.');
        console.log('Aborted: User not authenticated');
        return;
      }
      if (mode === 'group' && selectedGroupMembers.length === 0) {
        setError('Please select at least one member for the group chat.');
        console.log('Aborted: No group members selected');
        return;
      }
      const { data } = await api.post('/api/chats', payload);
      console.log('API response:', data);
      onCreateChat(data);
      onClose(); // Close the modal
      setGroupName('');
      setSelectedUser(null);
      setSelectedGroupMembers([]);
      setSearchQuery('');
      setMode('select');
    } catch (e) {
      const errorMessage = e.response
        ? `Failed to create chat: ${e.response.status} ${e.response.data?.message || e.message}`
        : `Failed to create chat: ${e.message}`;
      setError(errorMessage);
      console.error('Error creating chat:', {
        message: e.message,
        status: e.response?.status,
        data: e.response?.data,
        stack: e.stack,
      });
    } finally {
      setIsLoading(false);
      console.log('isLoading set to false');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
        {mode === 'select' ? (
          <>
            <h2 className="text-lg font-semibold mb-4">New Chat</h2>
            <div className="flex flex-col gap-2">
              <button
                className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => setMode('dm')}
              >
                New Direct Message
              </button>
              <button
                className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => setMode('group')}
              >
                New Group Chat
              </button>
              <button
                className="p-2 bg-gray-300 dark:bg-gray-600 text-black dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </>
        ) : mode === 'dm' ? (
          <>
            <h2 className="text-lg font-semibold mb-4">New Direct Message</h2>
            <input
              className="input w-full mb-4"
              placeholder="Search for a user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="max-h-48 overflow-y-auto mb-4">
              {searchResults.map((user) => (
                <button
                  key={user._id}
                  className={`w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded ${
                    selectedUser?._id === user._id ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                className={`p-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex-1 ${
                  isLoading || !selectedUser ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handleCreate}
                disabled={!selectedUser || isLoading}
              >
                {isLoading ? 'Starting...' : 'Start Chat'}
              </button>
              <button
                className="p-2 bg-gray-300 dark:bg-gray-600 text-black dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-500 flex-1"
                onClick={() => setMode('select')}
              >
                Back
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-4">New Group Chat</h2>
            <input
              className="input w-full mb-4"
              placeholder="Enter group name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <input
              className="input w-full mb-4"
              placeholder="Search for members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="max-h-48 overflow-y-auto mb-4">
              {searchResults.map((user) => (
                <button
                  key={user._id}
                  className={`w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded ${
                    selectedGroupMembers.some((u) => u._id === user._id) ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                  onClick={() => toggleGroupMember(user)}
                >
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </button>
              ))}
            </div>
            {selectedGroupMembers.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium">Selected Members:</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedGroupMembers.map((user) => (
                    <div
                      key={user._id}
                      className="bg-blue-100 dark:bg-blue-700 text-sm px-2 py-1 rounded"
                    >
                      {user.name}
                      <button
                        className="ml-2 text-red-500"
                        onClick={() => toggleGroupMember(user)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <button
                className={`p-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex-1 ${
                  isLoading || !groupName || selectedGroupMembers.length === 0
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
                onClick={handleCreate}
                disabled={!groupName || selectedGroupMembers.length === 0 || isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Group'}
              </button>
              <button
                className="p-2 bg-gray-300 dark:bg-gray-600 text-black dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-500 flex-1"
                onClick={() => setMode('select')}
              >
                Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}