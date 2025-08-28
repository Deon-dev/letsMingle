import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion'; // Ensure motion is imported
import useStore from '../../store/useStore';
import TypingIndicator from './TypingIndicator';

export default function MessageList() {
  const { activeChatId, messages, user, typing } = useStore();
  const listRef = useRef(null);
  const msgs = messages[activeChatId] || [];
  const typingSet = typing[activeChatId] || new Set();

  // Log to verify motion import
  console.log('MessageList.jsx loaded, motion:', typeof motion);

  useEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs.length, typingSet.size]);

  return (
    <div className="overflow-y-auto p-3 space-y-2" ref={listRef}>
      <AnimatePresence initial={false}>
        {msgs.map((m) => {
          const mine = m.sender?._id === user?._id || m.sender === user?._id;
          const readByCount = (m.readBy || []).length;
          return (
            <motion.div
              key={m._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`max-w-[75%] ${mine ? 'ml-auto' : ''}`}
            >
              <div className={`p-2 rounded-lg ${mine ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
                {m.imageUrl && <img src={import.meta.env.VITE_API_BASE + m.imageUrl} className="rounded mb-1 max-h-64" />}
                {m.text && <div className="whitespace-pre-wrap">{m.text}</div>}
              </div>
              <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-2">
                <span>{new Date(m.createdAt).toLocaleTimeString()}</span>
                {mine && <span>{readByCount > 1 ? '✓✓ Read' : '✓ Sent'}</span>}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {typingSet.size > 0 && <TypingIndicator names={[...typingSet].length + ' typing...'} />}
    </div>
  );
}
