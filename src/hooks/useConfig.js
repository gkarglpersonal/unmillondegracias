import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config.js';

export function useConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'config', 'general'),
      (snap) => {
        setConfig(snap.exists() ? snap.data() : null);
        setLoading(false);
      },
      (err) => {
        // Firestore puede no estar provisionado aún (sin DB / sin reglas).
        // Fallback silencioso: la UI gestiona config=null.
        if (err.code !== 'permission-denied') console.warn('useConfig:', err.code);
        setLoading(false);
      }
    );

    // Salvavidas: si el SDK lanza errores internos antes de invocar onError
    // (ocurre cuando el proyecto aún no tiene Firestore creado), tras 2 s
    // dejamos de bloquear la UI con el estado de carga.
    const timeout = setTimeout(() => setLoading(false), 2000);

    return () => {
      clearTimeout(timeout);
      unsub();
    };
  }, []);

  return { config, loading };
}
