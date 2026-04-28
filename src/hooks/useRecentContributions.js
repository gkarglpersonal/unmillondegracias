import { useEffect, useState } from 'react';
import { subscribeRecentContributions } from '../firebase/messageWall.js';

export function useRecentContributions(n = 5) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = subscribeRecentContributions(
      (data) => {
        setItems(data);
        setLoading(false);
      },
      n
    );
    return () => {
      try { unsub(); } catch { /* noop */ }
    };
  }, [n]);

  // Si Firestore no está inicializado todavía, fallback silencioso.
  useEffect(() => {
    const t = setTimeout(() => {
      if (loading) setError(new Error('timeout'));
    }, 4000);
    return () => clearTimeout(t);
  }, [loading]);

  return { items, loading, error };
}
