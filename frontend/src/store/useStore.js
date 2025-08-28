import { create } from "zustand";

const useStore = create((set) => ({
  // --- Auth ---
  accessToken: null,
  setAccessToken: (token) => set({ accessToken: token }),

  // --- Presence (online/offline) ---
  presence: {},
  setPresence: (userId, online) =>
    set((state) => ({
      presence: { ...state.presence, [userId]: online },
    })),

  // --- Typing indicators ---
  typing: {},
  addTyping: (chatId, userId) =>
    set((state) => ({
      typing: {
        ...state.typing,
        [chatId]: [...(state.typing[chatId] || []), userId],
      },
    })),
  removeTyping: (chatId, userId) =>
    set((state) => ({
      typing: {
        ...state.typing,
        [chatId]: (state.typing[chatId] || []).filter((id) => id !== userId),
      },
    })),

  // --- Messages ---
  messages: {},
  addMessage: (chatId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: [...(state.messages[chatId] || []), message],
      },
    })),
}));

export default useStore;


