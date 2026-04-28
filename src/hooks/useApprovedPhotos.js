import { useEffect, useState } from 'react';
import { subscribeApprovedPhotos } from '../firebase/messageWall.js';

export function useApprovedPhotos() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeApprovedPhotos((data) => {
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
