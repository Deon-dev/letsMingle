import { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import useStore from '../../store/useStore';
import useSocket from '../../hooks/useSocket';
import Picker from 'emoji-picker-react';

export default function MessageInput() {
  const { activeChatId, addMessage } = useStore();
  const socketRef = useSocket();
  const [text, setText] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const fileRef = useRef();

  useEffect(() => { setText(''); }, [activeChatId]);

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
      
      // Only send via REST API, not socket (socket will handle the broadcast)
      const { data } = await api.post('/api/messages', payload);
      
      // Don't add message manually here - let socket handle it to avoid duplicates
      // addMessage(activeChatId, data);
      
      // Clear input
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
    onType.timer = setTimeout(() => socketRef.current?.emit('stop_typing', { chatId: activeChatId }), 2000);
  };

  return (
    <div className="p-3 border-t dark:border-gray-800">
      <div className="flex items-end gap-2">
        <button 
          onClick={() => setShowPicker(v=>!v)} 
          className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          disabled={sending}
        >
          😊
        </button>
        <input 
          type="file" 
          accept="image/*" 
          ref={fileRef} 
          className="hidden" 
          onChange={()=>{}} 
        />
        <button 
          onClick={() => fileRef.current?.click()} 
          className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          disabled={sending}
        >
          📎
        </button>
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
        <button 
          onClick={send} 
          className="btn"
          disabled={sending || uploading || (!text.trim() && !fileRef.current?.files?.length)}
        >
          {uploading ? '📤' : sending ? '...' : 'Send'}
        </button>
      </div>
      {showPicker && (
        <div className="mt-2">
          <Picker onEmojiClick={(_, e) => setText(t => t + e.emoji)} />
        </div>
      )}
    </div>
  );
}