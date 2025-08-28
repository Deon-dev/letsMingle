import { useEffect, useState } from 'react';

export default function useNotifications() {
  const [permission, setPermission] = useState(Notification.permission);
  useEffect(() => {
    if (permission !== 'granted' && 'Notification' in window) {
      Notification.requestPermission().then(setPermission);
    }
  }, [permission]);
  return permission;
}
