import { useEffect, useState } from 'react';
import { subscribeVisibleMessages } from '../firebase/messageWall.js';

/**
 * Listener al muro de mensajes visibles. Devuelve `{ items, loading, error }`.
 * Sin timeout: la UI mantiene "Cargando…" hasta que Firestore responde por
 * primera vez. El error se expone para que el consumer pueda decidir si
 * mostrar feedback de conexión o seguir con datos vacíos.
 */
export function useVisibleMessages() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = subscribeVisibleMessages(
      (data) => {
        setItems(data);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => {
      try { unsub(); } catch { /* noop */ }
    };
  }, []);

  return { items, loading, error };
}
