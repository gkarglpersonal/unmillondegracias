import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config.js';

/**
 * Listener al documento `config/general` (totales, hero copy editable).
 *
 * Devuelve `{ config, loading, error }`. La UI mantiene `loading=true` hasta
 * que Firestore responde por primera vez (data o error). Antes había un
 * timeout de 2 s que forzaba `loading=false` aunque no hubiera respuesta;
 * en redes lentas el usuario veía un estado "vacío" como si la web
 * estuviese sin contenido. Ahora, mientras se espera, la UI muestra
 * "Cargando…" hasta que llegue algo.
 *
 * `permission-denied` se silencia (caso reglas no desplegadas todavía); el
 * resto se expone en `error` para que la UI pueda mostrar "Conexión
 * perdida" cuando lo lea.
 */
export function useConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'config', 'general'),
      (snap) => {
        if (snap.exists()) {
          setConfig(snap.data());
        } else {
          setConfig(null);
          console.warn(
            'useConfig: config/general no existe en Firestore. ' +
              'Si eres admin, entra a /admin para auto-crearlo, o ejecuta el seed script.'
          );
        }
        setError(null);
        setLoading(false);
      },
      (err) => {
        // Firestore puede no estar provisionado aún (sin DB / sin reglas).
        // Fallback silencioso: la UI gestiona config=null y error=null.
        if (err.code !== 'permission-denied') {
          console.warn('useConfig:', err.code);
          setError(err);
        }
        setLoading(false);
      }
    );

    return () => {
      try { unsub(); } catch { /* noop */ }
    };
  }, []);

  return { config, loading, error };
}
