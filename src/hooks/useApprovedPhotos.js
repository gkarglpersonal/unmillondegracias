import { useEffect, useState } from 'react';
import { subscribeApprovedPhotos } from '../firebase/messageWall.js';

/**
 * Listener a las fotos aprobadas (galería pública). Devuelve `{ items, loading, error }`.
 * Sin timeout: la galería mantiene "Cargando recuerdos…" hasta que
 * Firestore responde. Si el listener emite un error real (no
 * `permission-denied`), se expone para que el consumer pueda mostrar
 * feedback de conexión.
 */
export function useApprovedPhotos() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = subscribeApprovedPhotos(
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
