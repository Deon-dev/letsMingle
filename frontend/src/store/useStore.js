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
      
      // Auth actions
      setUser: (user, token) => {
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
          typing: {}
        });
        localStorage.removeItem('accessToken');
      },

      // Chat actions
      setChats: (chats) => set({ chats }),
      
      addChat: (newChat) => set(state => {
        const chatExists = state.chats.some(chat => chat._id === newChat._id);
        if (chatExists) return state;
        return { chats: [newChat, ...state.chats] };
      }),

      updateChatLastMessage: (chatId, message) => set(state => ({
        chats: state.chats
          .map(chat => 
            chat._id === chatId 
              ? { ...chat, lastMessage: message, updatedAt: new Date() }
              : chat
          )
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)) // Sort by most recent
      })),
      
      setActiveChatId: (chatId) => set({ activeChatId: chatId }),
      
      // ✅ FIX: allow array OR updater function
      setMessages: (chatId, updater) => set(state => {
        const currentMessages = state.messages[chatId] || [];
        const newMessages = 
          typeof updater === "function" 
            ? updater(currentMessages) 
            : updater;

        return {
          messages: { ...state.messages, [chatId]: newMessages }
        };
      }),
      
      addMessage: (chatId, message) => set(state => {
        const currentMessages = state.messages[chatId] || [];
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
      })
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

