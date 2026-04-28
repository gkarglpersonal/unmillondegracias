import { useEffect, useState } from 'react';
import { subscribeVisibleMessages } from '../firebase/messageWall.js';

export function useVisibleMessages() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeVisibleMessages((data) => {
      setItems(data);
      setLoading(false);
    });
    const t = setTimeout(() => setLoading(false), 2000);
    return () => {
      clearTimeout(t);
      try { unsub(); } catch { /* noop */ }
    };
  }, []);

  return { items, loading };
}
