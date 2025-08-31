import { useEffect, useRef } from "react";
import useAuth from "../../hooks/useAuth"; // ✅ fixed import

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
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
      {messages.length === 0 ? (
        <p className="text-gray-400 text-sm text-center">No messages yet</p>
      ) : (
        messages.map((msg) => {
          const isOwn = msg.sender?._id === user?._id;

          return (
            <div
              key={msg._id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs md:max-w-sm lg:max-w-md p-3 rounded-2xl shadow 
                ${isOwn ? "bg-blue-500 text-white" : "bg-white text-gray-800"}`}
              >
                {/* Sender name (only show for others) */}
                {!isOwn && (
                  <p className="text-xs font-semibold text-gray-600 mb-1">
                    {msg.sender?.name || "Unknown"}
                  </p>
                )}

                {/* Text */}
                {msg.text && (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
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
            </div>
          );
        })
      )}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
}




