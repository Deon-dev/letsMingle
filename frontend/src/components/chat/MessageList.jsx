import { useEffect, useRef } from "react";
import useAuth from "../../hooks/useAuth";

export default function MessageList({ messages = [] }) {
  const { user } = useAuth();
  const bottomRef = useRef(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (!Array.isArray(messages)) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        No messages yet
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
      {messages.length === 0 ? (
        <p className="text-gray-400 text-sm text-center">No messages yet</p>
      ) : (
        messages.map((msg) => {
          const isOwn = msg.sender?._id === user?._id;

          return (
            <div
              key={msg._id}
              className={`flex items-end gap-2 ${
                isOwn ? "justify-end" : "justify-start"
              }`}
            >
              {/* Show avatar only for other users */}
              {!isOwn && (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold overflow-hidden">
                  {msg.sender?.avatarUrl ? (
                    <img
                      src={msg.sender.avatarUrl}
                      alt={msg.sender?.name || "User"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    msg.sender?.name?.[0]?.toUpperCase() || "?"
                  )}
                </div>
              )}

              <div
                className={`max-w-xs md:max-w-sm lg:max-w-md p-3 rounded-2xl shadow relative ${
                  isOwn
                    ? "bg-blue-500 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                }`}
              >
                {/* Sender name (only show for others) */}
                {!isOwn && (
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                    {msg.sender?.name || "Unknown"}
                  </p>
                )}

                {/* Text */}
                {msg.text && (
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                )}

                {/* Image */}
                {msg.imageUrl && (
                  <img
                    src={msg.imageUrl}
                    alt="attachment"
                    className="mt-2 rounded-lg max-h-60 object-cover"
                  />
                )}

                {/* Time */}
                {msg.createdAt && (
                  <p
                    className={`text-[10px] mt-1 ${
                      isOwn ? "text-blue-100" : "text-gray-400"
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>

              {/* Keep space on the right for my own avatar (optional) */}
              {isOwn && <div className="w-8 h-8" />}
            </div>
          );
        })
      )}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
}






