import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function GroupCreator({ onClose, onGroupCreated }) {
  const [step, setStep] = useState(1); // 1: search users, 2: create group
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [creating, setCreating] = useState(false);

  // 🔎 Search users
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data } = await api.get(
          `/api/users/search?q=${encodeURIComponent(searchQuery)}`
        );
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

  const toggleUser = (user) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u._id === user._id);
      if (exists) {
        return prev.filter((u) => u._id !== user._id);
      } else {
        return [...prev, user];
      }
    });
  };

  const createGroup = async () => {
    if (!groupName.trim() || selectedUsers.length < 2) {
      alert('Please select at least 2 members for a group chat.');
      return;
    }

    setCreating(true);
    try {
      const { data } = await api.post('/api/chats', {
        isGroup: true,
        name: groupName.trim(),
        memberIds: selectedUsers.map((u) => u._id),
      });

      // Let Sidebar handle store updates
      onGroupCreated?.(data);
      onClose();
    } catch (error) {
      console.error('Failed to create group:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {step === 1 ? 'Add Members' : 'Create Group'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xl"
          >
            ×
          </button>
        </div>

        {step === 1 ? (
          <>
            {/* Search Input */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search users to add..."
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isSearching && (
                <div className="absolute right-3 top-2.5 w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="mb-4">
                <div className="text-sm font-medium mb-2">
                  Selected ({selectedUsers.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center gap-2 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-2 py-1 rounded-full text-sm"
                    >
                      <span>{user.name}</span>
                      <button
                        onClick={() => toggleUser(user)}
                        className="text-brand-500 hover:text-brand-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto mb-4">
              {searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((user) => {
                    const isSelected = selectedUsers.find(
                      (u) => u._id === user._id
                    );
                    return (
                      <button
                        key={user._id}
                        onClick={() => toggleUser(user)}
                        className={`w-full p-3 text-left rounded-lg flex items-center gap-3 transition-colors ${
                          isSelected
                            ? 'bg-brand-100 dark:bg-brand-900/30 border border-brand-300 dark:border-brand-700'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                        }`}
                      >
                        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-sm font-semibold">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt=""
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            user.name[0]?.toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {user.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {user.email}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="text-brand-500 text-lg">✓</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : searchQuery.trim() ? (
                <div className="text-center text-gray-500 text-sm py-8">
                  {isSearching ? 'Searching...' : 'No users found'}
                </div>
              ) : (
                <div className="text-center text-gray-500 text-sm py-8">
                  Search for users to add to the group
                </div>
              )}
            </div>

            {/* Next Button */}
            <button
              onClick={() => setStep(2)}
              disabled={selectedUsers.length < 2}
              className="w-full py-2 px-3 bg-brand-500 text-white rounded-lg hover:opacity-90 text-sm font-medium disabled:opacity-50"
            >
              Next ({selectedUsers.length} selected)
            </button>
          </>
        ) : (
          <>
            {/* Group Name Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Group Name
              </label>
              <input
                type="text"
                placeholder="Enter group name..."
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={50}
              />
            </div>

            {/* Members Summary */}
            <div className="mb-4">
              <div className="text-sm font-medium mb-2">
                Members ({selectedUsers.length})
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 max-h-32 overflow-y-auto">
                {selectedUsers.map((user) => (
                  <div key={user._id} className="flex items-center gap-2 py-1">
                    <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs font-semibold">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt=""
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        user.name[0]?.toUpperCase()
                      )}
                    </div>
                    <span className="text-sm">{user.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                disabled={creating}
              >
                Back
              </button>
              <button
                onClick={createGroup}
                disabled={!groupName.trim() || selectedUsers.length < 2 || creating}
                className="flex-1 py-2 px-3 bg-brand-500 text-white rounded-lg hover:opacity-90 text-sm font-medium disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
