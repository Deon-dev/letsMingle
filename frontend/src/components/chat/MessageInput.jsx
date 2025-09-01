import { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import useStore from '../../store/useStore';
import useSocket from '../../hooks/useSocket';
import Picker from 'emoji-picker-react';

export default function MessageInput() {
  const { activeChatId } = useStore();
  const socketRef = useSocket();
  const [text, setText] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const fileRef = useRef();

  // Reset input when switching chats
  useEffect(() => {
    setText('');
    setShowPicker(false);
  }, [activeChatId]);

  const send = async () => {
    if ((!text || !text.trim()) && !fileRef.current?.files?.length) return;
    if (sending) return; // Prevent double sends
    
    setSending(true);
    
    try {
      let imageUrl = '';
      if (fileRef.current?.files?.length) {
        setUploading(true);
        const fd = new FormData();
        fd.append('image', fileRef.current.files[0]);
        const { data } = await api.post('/api/messages/upload', fd, { 
          headers: { 'Content-Type': 'multipart/form-data' } 
        });
        imageUrl = data.imageUrl;
        setUploading(false);
        fileRef.current.value = '';
      }

      const payload = { chatId: activeChatId, text: text.trim(), imageUrl };
      
      // Only send via REST API — socket will broadcast the new message
      await api.post('/api/messages', payload);
      
      // Reset input
      setText('');
      setShowPicker(false);
      
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const onType = () => {
    socketRef.current?.emit('typing', { chatId: activeChatId });
    // stop-typing after 2s of no input
    if (onType.timer) clearTimeout(onType.timer);
    onType.timer = setTimeout(
      () => socketRef.current?.emit('stop_typing', { chatId: activeChatId }),
      2000
    );
  };

  return (
    <div className="p-3 border-t dark:border-gray-800">
      <div className="flex items-end gap-2">
        {/* Emoji picker toggle */}
        <button 
          onClick={() => setShowPicker(v => !v)} 
          className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          disabled={sending}
        >
          😊
        </button>

        {/* File upload */}
        <input 
          type="file" 
          accept="image/*" 
          ref={fileRef} 
          className="hidden" 
        />
        <button 
          onClick={() => fileRef.current?.click()} 
          className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          disabled={sending}
        >
          📎
        </button>

        {/* Text input */}
        <textarea
          className="flex-1 input h-10 resize-none"
          placeholder="Type a message"
          value={text}
          onChange={e => { setText(e.target.value); onType(); }}
          onKeyDown={e => { 
            if (e.key==='Enter' && !e.shiftKey) { 
              e.preventDefault(); 
              send(); 
            } 
          }}
          disabled={sending}
        />

        {/* Send button */}
        <button 
          onClick={send} 
          className="btn"
          disabled={sending || uploading || (!text.trim() && !fileRef.current?.files?.length)}
        >
          {uploading ? '📤' : sending ? '...' : 'Send'}
        </button>
      </div>

      {/* Emoji picker */}
      {showPicker && (
        <div className="mt-2">
          <Picker 
            onEmojiClick={(emojiData) => setText(t => t + emojiData.emoji)} 
          />
        </div>
      )}
    </div>
  );
}
