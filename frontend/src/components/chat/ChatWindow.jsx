import { useEffect, useState } from "react";
import api from "../../api/axios";
import useStore from "../../store/useStore";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import useSocket from "../../hooks/useSocket";
import { MoreVertical } from "lucide-react";

export default function ChatWindow() {
  const { activeChatId, messages, setMessages, addMessage, user, typing } = useStore();
  const socketRef = useSocket();

  // Fetch messages when chat changes
  useEffect(() => {
    if (!activeChatId) return;

    api
      .get(`/api/messages/${activeChatId}`)
      .then(({ data }) => {
        setMessages(activeChatId, data);
      })
      .catch((error) => console.error("Failed to load messages:", error));

    const socket = socketRef.current;
    if (socket) {
      socket.emit("chat:join", { chatId: activeChatId });

      return () => {
        socket.emit("chat:leave", { chatId: activeChatId });
      };
    }
  }, [activeChatId, setMessages, socketRef]);

  // Listen for new messages in real-time
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !activeChatId) return;

    const handleNewMessage = ({ message }) => {
      if (message.chat === activeChatId || message.chat?._id === activeChatId) {
        addMessage(activeChatId, message);
      }
    };

    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [activeChatId, addMessage, socketRef]);

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
      socketRef.current?.emit("message:read", {
        chatId: activeChatId,
        messageIds: unreadIds,
      });
    }
  }, [activeChatId, messages, user, socketRef]);

  if (!activeChatId) {
    return (
      <div className="h-full grid place-items-center text-gray-400">
        Select a chat to start messaging
      </div>
    );
  }

  const typingUsers = typing[activeChatId]
    ? [...typing[activeChatId]].filter(id => id !== user?._id)
    : [];

  return (
    <div className="h-full grid grid-rows-[auto_1fr_auto]">
      <Header />
      <div className="relative">
        <MessageList messages={messages[activeChatId] || []} />
        {typingUsers.length > 0 && (
          <div className="absolute bottom-2 left-4 text-xs text-gray-500 italic">
            {typingUsers.length === 1
              ? "Typing..."
              : "Multiple people typing..."}
          </div>
        )}
      </div>
      <MessageInput />
    </div>
  );
}

function Header() {
  const { activeChatId, chats, onlineUsers, user } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const chat = chats.find((c) => c._id === activeChatId);

  useEffect(() => {
    setMenuOpen(false);
  }, [activeChatId]);

  if (!chat) {
    return (
      <div className="p-3 border-b dark:border-gray-800">
        <div className="font-semibold">Loading...</div>
      </div>
    );
  }

  const members = chat.members || [];
  const otherMembers = members.filter((m) => m._id !== user._id);
  const anyoneOnline = otherMembers.some((m) => onlineUsers.has(m._id));

  const chatName = chat.isGroup
    ? chat.name
    : otherMembers.map((m) => m.name).join(", ") || "Unknown";

  return (
    <div className="p-3 border-b dark:border-gray-800 flex items-center justify-between relative">
      <div>
        <div className="font-semibold">{chatName}</div>
        <div className="text-xs text-gray-500">
          {chat.isGroup
            ? `${members.length} members${anyoneOnline ? " • Some online" : ""}`
            : anyoneOnline
            ? "Online"
            : "Offline"}
        </div>
      </div>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <MoreVertical className="w-5 h-5" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg shadow-lg z-10">
            <button
              className="block w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-left"
              onClick={() => alert("Clear chat clicked")}
            >
              Clear Chat
            </button>
            <button
              className="block w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-left"
              onClick={() => alert("Block user clicked")}
            >
              Block User
            </button>
            <button
              className="block w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-left"
              onClick={() => alert("Report user clicked")}
            >
              Report User
            </button>
          </div>
        )}
      </div>
    </div>
  );
}








