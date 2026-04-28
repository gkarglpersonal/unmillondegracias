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
    return unsub;
  }, []);

  return { config, loading };
}
