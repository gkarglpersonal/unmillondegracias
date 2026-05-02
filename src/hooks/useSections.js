import { useEffect, useState } from 'react';
import { subscribeSections } from '../firebase/sections.js';

/**
 * Suscripción en tiempo real a la colección `sections`. Devuelve las
 * secciones ordenadas por `order` ascendente.
 *
 * Devuelve `{ sections, loading, error }`. Sin timeout: la UI mantiene
 * `loading=true` hasta que Firestore responde. El error se expone para
 * que el consumer pueda mostrar feedback de conexión cuando lo lea.
 */
export function useSections() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = subscribeSections(
      (s) => {
        setSections(s);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => {
      try {
        unsub();
      } catch {}
    };
  }, []);

  return { sections, loading, error };
}
