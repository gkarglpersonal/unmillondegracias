import { useEffect, useState } from 'react';
import { subscribeRecentContributions } from '../firebase/messageWall.js';

/**
 * Listener al feed de contribuciones recientes. Devuelve `{ items, loading, error }`.
 *
 * Sin timeout: si Firestore tarda en responder, la UI sigue mostrando
 * "Cargando…" en lugar de saltar a un falso "vacío" tras 2 segundos. Si
 * el listener emite un error real (no `permission-denied`), se expone
 * para que el consumer pueda mostrar feedback de "conexión perdida".
 */
export function useRecentContributions(n = 5) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = subscribeRecentContributions(
      (data) => {
        setItems(data);
        setError(null);
        setLoading(false);
      },
      n,
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      try { unsub(); } catch { /* noop */ }
    };
  }, [n]);

  return { items, loading, error };
}
