import { useEffect, useState } from 'react';
import { subscribeSections } from '../firebase/sections.js';

/**
 * Suscripción en tiempo real a la colección `sections`. Devuelve las
 * secciones ordenadas por `order` ascendente.
 */
export function useSections() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeSections((s) => {
      setSections(s);
      setLoading(false);
    });
    const t = setTimeout(() => setLoading(false), 2000);
    return () => {
      clearTimeout(t);
      try {
        unsub();
      } catch {}
    };
  }, []);

  return { sections, loading };
}
