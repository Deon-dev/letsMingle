import { create } from 'zustand';

const useStore = create((set) => ({
  user: null,
  accessToken: null,
  chats: [],
  messages: {},
  activeChatId: null,
  onlineUsers: new Set(),
  typing: {},

  // --- Auth state setters ---
  setUser: (user, accessToken = null) => set({ user, accessToken }),
  setAccessToken: (accessToken) => set({ accessToken }),

  // --- Chat state setters ---
  setChats: (chats) => set({ chats }),
  setMessages: (chatId, newMessages) =>
    set((state) => {
      const existingMessages = state.messages[chatId] || [];
      // Merge new messages, keeping only unique _ids
      const uniqueMessages = Array.from(
        new Map(
          [...existingMessages, ...(Array.isArray(newMessages) ? newMessages : [newMessages])]
            .map((msg) => [msg._id, msg])
        ).values()
      );
      return {
        messages: {
          ...state.messages,
          [chatId]: uniqueMessages,
        },
      };
    }),
  setActiveChat: (chatId) => set({ activeChatId: chatId }),
  setOnlineUsers: (users) => set({ onlineUsers: new Set(users) }),
  setTyping: (chatId, userId, isTyping) =>
    set((state) => {
      const typingSet = state.typing[chatId] || new Set();
      if (isTyping) typingSet.add(userId);
      else typingSet.delete(userId);

      return {
        typing: {
          ...state.typing,
          [chatId]: typingSet,
        },
      };
    }),
}));

export default useStore;

