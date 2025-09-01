import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      // Auth state
      user: null,
      accessToken: null,
      
      // Chat state
      chats: [],
      activeChatId: null,
      messages: {}, // { chatId: [messages] }
      onlineUsers: new Map(),
      typing: {}, // { chatId: Set(userIds) }
      unreadCounts: {}, // { chatId: number }
      
      // Auth actions
      setUser: (user, token) => {
        const prevUser = get().user;
        if (!prevUser || prevUser._id !== user?._id) {
          set({
            chats: [],
            activeChatId: null,
            messages: {},
            onlineUsers: new Map(),
            typing: {},
            unreadCounts: {}
          });
        }

        set({ user, accessToken: token });
        if (token) {
          localStorage.setItem('accessToken', token);
        } else {
          localStorage.removeItem('accessToken');
        }
      },
      
      setAccessToken: (token) => {
        set({ accessToken: token });
        if (token) {
          localStorage.setItem('accessToken', token);
        } else {
          localStorage.removeItem('accessToken');
        }
      },
      
      getAccessToken: () => get().accessToken,
      
      clearAuth: () => {
        set({ 
          user: null, 
          accessToken: null,
          chats: [],
          activeChatId: null,
          messages: {},
          onlineUsers: new Map(),
          typing: {},
          unreadCounts: {}
        });
        localStorage.removeItem('accessToken');
      },

      // Chat actions
      setChats: (chatsOrUpdater) => {
        if (typeof chatsOrUpdater === 'function') {
          set(state => ({ chats: chatsOrUpdater(state.chats) }));
        } else {
          set({ chats: chatsOrUpdater });
        }
      },
      
      addChat: (newChat) => set(state => {
        const chatExists = state.chats.some(chat => chat._id === newChat._id);
        if (chatExists) return state;
        return { chats: [newChat, ...state.chats] };
      }),

      updateChat: (chatId, updatedChat) => set(state => ({
        chats: state.chats.map(chat => 
          chat._id === chatId ? { ...chat, ...updatedChat } : chat
        )
      })),

      updateChatLastMessage: (chatId, message) => set(state => ({
        chats: state.chats.map(chat => 
          chat._id === chatId 
            ? { ...chat, lastMessage: message, updatedAt: new Date() }
            : chat
        ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      })),
      
      setActiveChatId: (chatId) => {
        set({ activeChatId: chatId });
        get().clearUnread(chatId); // 🔴 Clear unread on open
      },
      
      setMessages: (chatId, messageList) => set(state => ({
        messages: { ...state.messages, [chatId]: messageList }
      })),
      
      addMessage: (chatId, message) => set(state => {
        const currentMessages = state.messages[chatId] || [];
        if (!Array.isArray(currentMessages)) return state;

        const messageExists = currentMessages.some(msg => msg._id === message._id);
        if (messageExists) return state;
        
        return {
          messages: {
            ...state.messages,
            [chatId]: [...currentMessages, message]
          }
        };
      }),
      
      updateOnlineUsers: (userId, online) => set(state => {
        const newOnlineUsers = new Map(state.onlineUsers);
        if (online) {
          newOnlineUsers.set(userId, true);
        } else {
          newOnlineUsers.delete(userId);
        }
        return { onlineUsers: newOnlineUsers };
      }),
      
      setTyping: (chatId, userId, isTyping) => set(state => {
        const newTyping = { ...state.typing };
        if (!newTyping[chatId]) newTyping[chatId] = new Set();
        
        if (isTyping) {
          newTyping[chatId].add(userId);
        } else {
          newTyping[chatId].delete(userId);
          if (newTyping[chatId].size === 0) {
            delete newTyping[chatId];
          }
        }
        return { typing: newTyping };
      }),

      // 🔴 Unread counters
      incrementUnread: (chatId) => set(state => ({
        unreadCounts: {
          ...state.unreadCounts,
          [chatId]: (state.unreadCounts[chatId] || 0) + 1
        }
      })),

      clearUnread: (chatId) => set(state => {
        const newUnread = { ...state.unreadCounts };
        delete newUnread[chatId];
        return { unreadCounts: newUnread };
      }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        accessToken: state.accessToken 
      }),
    }
  )
);

export default useStore;


