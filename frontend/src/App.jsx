import AppRoutes from './routes';
import useNotifications from './hooks/useNotifications';
import { useEffect, useState } from 'react';

export default function App() {
  useNotifications();
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  return (
    <div className="h-full">
      {!online && (
        <div className="bg-yellow-500 text-black text-center py-2">You are offline</div>
      )}
      <AppRoutes />
    </div>
  );
}

