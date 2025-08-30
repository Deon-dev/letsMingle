import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useStore from '../../store/useStore';
import TypingIndicator from './TypingIndicator';

export default function MessageList() {
  const { activeChatId, messages, user, typing, chats } = useStore();
  const listRef = useRef(null);
  const msgs = messages[activeChatId] || [];
  const typingSet = typing[activeChatId] || new Set();
  
  // Get current chat to check if it's a group chat
  const currentChat = chats.find(chat => chat._id === activeChatId);
  const isGroupChat = currentChat?.isGroup || false;

  useEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs.length, typingSet.size]);

  const shouldShowSenderName = (message, index) => {
    // Always show names in group chats (except for your own messages)
    if (!isGroupChat) return false;
    if (message.sender?._id === user?._id) return false;
    
    // Show name if it's the first message or if the previous message is from a different sender
    if (index === 0) return true;
    const prevMessage = msgs[index - 1];
    return prevMessage.sender?._id !== message.sender?._id;
  };

  const getMessageTime = (date) => {
    const now = new Date();
    const msgDate = new Date(date);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDateOnly = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());
    
    if (msgDateOnly.getTime() === today.getTime()) {
      return msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (msgDateOnly.getTime() === today.getTime() - 24 * 60 * 60 * 1000) {
      return 'Yesterday ' + msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return msgDate.toLocaleDateString() + ' ' + msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const getSenderColor = (senderId) => {
    const colors = [
      'text-red-600 dark:text-red-400',
      'text-blue-600 dark:text-blue-400', 
      'text-green-600 dark:text-green-400',
      'text-purple-600 dark:text-purple-400',
      'text-orange-600 dark:text-orange-400',
      'text-pink-600 dark:text-pink-400',
      'text-indigo-600 dark:text-indigo-400',
      'text-teal-600 dark:text-teal-400'
    ];
    
    let hash = 0;
    if (senderId) {
      for (let i = 0; i < senderId.length; i++) {
        hash = senderId.charCodeAt(i) + ((hash << 5) - hash);
      }
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Get consistent background color for different senders
  const getSenderBgColor = (senderId) => {
    const colors = [
      'bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500',
      'bg-blue-100 dark:bg-blue-900/20 border-l-4 border-blue-500',
      'bg-green-100 dark:bg-green-900/20 border-l-4 border-green-500',
      'bg-purple-100 dark:bg-purple-900/20 border-l-4 border-purple-500',
      'bg-orange-100 dark:bg-orange-900/20 border-l-4 border-orange-500',
      'bg-pink-100 dark:bg-pink-900/20 border-l-4 border-pink-500',
      'bg-indigo-100 dark:bg-indigo-900/20 border-l-4 border-indigo-500',
      'bg-teal-100 dark:bg-teal-900/20 border-l-4 border-teal-500'
    ];
    
    let hash = 0;
    if (senderId) {
      for (let i = 0; i < senderId.length; i++) {
        hash = senderId.charCodeAt(i) + ((hash << 5) - hash);
      }
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Get sender initials for avatar
  const getSenderInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="overflow-y-auto p-3 space-y-1" ref={listRef}>
      <AnimatePresence initial={false}>
        {msgs.map((m, index) => {
          const mine = m.sender?._id === user?._id || m.sender === user?._id;
          const readByCount = (m.readBy || []).length;
          const showSenderName = shouldShowSenderName(m, index);
          const senderName = m.sender?.name || 'Unknown';
          const senderColor = getSenderColor(m.sender?._id);
          const senderBgColor = getSenderBgColor(m.sender?._id);
          const senderInitials = getSenderInitials(senderName);
          
          return (
            <motion.div
              key={m._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${mine ? 'justify-end' : 'justify-start'} items-start gap-2`}
            >
              {/* Avatar for other users */}
              {!mine && (
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium mt-1 ${
                  isGroupChat ? senderBgColor.split(' ')[0] + ' ' + senderColor : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}>
                  {senderInitials}
                </div>
              )}

              <div className={`max-w-[75%] ${mine ? 'order-2' : 'order-1'}`}>
                {/* Sender name for group chats */}
                {showSenderName && (
                  <div className={`text-xs font-medium mb-1 px-2 ${senderColor}`}>
                    {senderName}
                  </div>
                )}
                
                {/* Message bubble */}
                <div className={`p-3 rounded-lg ${
                  mine 
                    ? 'bg-brand-500 text-white rounded-br-sm' 
                    : isGroupChat 
                      ? `${senderBgColor} text-gray-900 dark:text-gray-100 rounded-bl-sm`
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm'
                }`}>
                  {/* Sender name inside bubble for non-group chats */}
                  {!isGroupChat && !mine && (
                    <div className={`text-xs font-medium mb-2 ${senderColor}`}>
                      {senderName}
                    </div>
                  )}
                  
                  {/* Image */}
                  {m.imageUrl && (
                    <img 
                      src={import.meta.env.VITE_API_BASE + m.imageUrl} 
                      className="rounded mb-2 max-h-64 max-w-full object-cover" 
                      alt="Shared image"
                    />
                  )}
                  
                  {/* Text */}
                  {m.text && (
                    <div className="whitespace-pre-wrap break-words">
                      {m.text}
                    </div>
                  )}
                </div>
                
                {/* Message info */}
                <div className={`text-[10px] text-gray-500 mt-1 flex items-center gap-2 px-1 ${
                  mine ? 'justify-end' : 'justify-start'
                }`}>
                  <span>{getMessageTime(m.createdAt)}</span>
                  {mine && (
                    <span className="flex items-center gap-1">
                      {readByCount > 1 ? (
                        <span className="flex items-center gap-0.5">
                          <span>✓✓</span>
                          <span className="text-blue-500">Read</span>
                        </span>
                      ) : (
                        <span>✓ Sent</span>
                      )}
                    </span>
                  )}
                </div>
              </div>

              
              {mine && <div className="w-8 flex-shrink-0"></div>}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {typingSet.size > 0 && (
        <div className="flex justify-start">
          <div className="w-8 flex-shrink-0"></div>
          <TypingIndicator names={`${[...typingSet].length} user${[...typingSet].length > 1 ? 's' : ''} typing...`} />
        </div>
      )}
    </div>
  );
}