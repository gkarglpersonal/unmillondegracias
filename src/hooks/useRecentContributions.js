import { useEffect, useState } from 'react';
import { subscribeRecentContributions } from '../firebase/messageWall.js';

/**
 * Listener al feed de contribuciones recientes.
 * Si Firestore no responde en 2 s (DB no provisionada o sin datos),
 * marca loading como false para que la UI muestre el estado vacío.
 */
export function useRecentContributions(n = 5) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeRecentContributions((data) => {
      setItems(data);
      setLoading(false);
    }, n);

    const timeout = setTimeout(() => setLoading(false), 2000);

    return () => {
      clearTimeout(timeout);
      try { unsub(); } catch { /* noop */ }
    };
  }, [n]);

  return { items, loading };
}
