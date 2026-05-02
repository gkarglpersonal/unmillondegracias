import { useEffect, useState } from 'react';
import { subscribeTripItems } from '../firebase/tripItems.js';

/**
 * Listener a `tripItems`. Devuelve `{ items, loading, error }`.
 *
 * Sin timeout: la UI mantiene `loading=true` hasta que Firestore responde.
 * En redes lentas eso evita el "estado vacío" engañoso de antes (cuando el
 * timeout de 2 s forzaba loading=false y los termómetros aparecían vacíos
 * como si el regalo no hubiera empezado).
 */
export function useTripItems({ onlyActive = true } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = subscribeTripItems(
      (data) => {
        setItems(data);
        setError(null);
        setLoading(false);
      },
      {
        onlyActive,
        onError: (err) => {
          setError(err);
          setLoading(false);
        },
      }
    );
    return () => {
      try { unsub(); } catch { /* noop */ }
    };
  }, [onlyActive]);

  return { items, loading, error };
}
