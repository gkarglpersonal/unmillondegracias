import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config.js';
import styles from './DeleteSectionModal.module.css';

/**
 * Modal de confirmación al eliminar una sección. Tres acciones:
 *  - Eliminar sección y todas sus tarjetas (rojo)
 *  - Mover tarjetas a "Sin asignar" (neutro)
 *  - Cancelar
 *
 * Antes de mostrar las acciones, consulta `messageWall` para detectar si
 * alguna de las partidas de la sección tiene aportaciones reales (mensajes
 * o aportaciones del muro vinculados). Si las hay, se enseña un aviso
 * explícito: si el admin elige "Eliminar sección y todas sus tarjetas",
 * esas aportaciones quedarán huérfanas (con `tripItemId` apuntando a un doc
 * inexistente) y la UI pública las tratará como fondo general.
 *
 * La consulta usa `in` con hasta 30 IDs por chunk (límite de Firestore).
 * Si falla, el modal sigue siendo usable: se muestra un fallback honesto y
 * el botón destructivo no se bloquea — el admin sigue al mando.
 */
export default function DeleteSectionModal({
  section,
  sectionItems = [],
  onCancel,
  onDeleteAll,
  onMoveToUnassigned,
  busy,
}) {
  // null = cargando, number = listo, 'error' = la query falló
  const [affectedItemsCount, setAffectedItemsCount] = useState(null);
  const [affectedContributions, setAffectedContributions] = useState(0);

  const itemCount = sectionItems.length;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && !busy && onCancel();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [busy, onCancel]);

  useEffect(() => {
    let cancelled = false;
    if (sectionItems.length === 0) {
      setAffectedItemsCount(0);
      setAffectedContributions(0);
      return undefined;
    }
    const ids = sectionItems.map((it) => it.id);

    (async () => {
      try {
        // Firestore admite hasta 30 valores en una `in` query. Para
        // secciones reales (≤ 10 partidas) basta un único chunk.
        const chunks = [];
        for (let i = 0; i < ids.length; i += 30) chunks.push(ids.slice(i, i + 30));

        let total = 0;
        const itemMatches = new Set();
        for (const chunk of chunks) {
          const q = query(
            collection(db, 'messageWall'),
            where('tripItemId', 'in', chunk)
          );
          const snap = await getDocs(q);
          total += snap.size;
          snap.docs.forEach((d) => {
            const tid = d.data().tripItemId;
            if (tid) itemMatches.add(tid);
          });
        }
        if (cancelled) return;
        setAffectedContributions(total);
        setAffectedItemsCount(itemMatches.size);
      } catch (err) {
        if (cancelled) return;
        console.warn('DeleteSectionModal contributions count:', err);
        setAffectedItemsCount('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sectionItems]);

  const renderWarning = () => {
    if (affectedItemsCount === null) {
      return (
        <p className={styles.checking}>
          Calculando aportaciones vinculadas a esta sección…
        </p>
      );
    }
    if (affectedItemsCount === 'error') {
      return (
        <p className={styles.checking}>
          No hemos podido verificar si hay aportaciones vinculadas. Revísalo
          antes de continuar.
        </p>
      );
    }
    if (affectedItemsCount === 0) {
      return (
        <p className={styles.note}>
          Ninguna de las partidas de esta sección tiene aportaciones
          registradas, así que eliminarla no afectará al termómetro ni al
          muro.
        </p>
      );
    }
    const partidasTxt =
      affectedItemsCount === 1 ? '1 partida' : `${affectedItemsCount} partidas`;
    const aportacionesTxt =
      affectedContributions === 1
        ? '1 aportación'
        : `${affectedContributions} aportaciones`;
    return (
      <p className={styles.warning} role="alert">
        <strong>Atención:</strong> {partidasTxt} de esta sección{' '}
        {affectedItemsCount === 1 ? 'tiene' : 'tienen'} aportaciones reales
        ({aportacionesTxt} en el muro). Si las eliminas, esas aportaciones
        quedarán sin partida asignada y aparecerán como fondo general en el
        admin. Si prefieres conservar la trazabilidad, usa{' '}
        <strong>Mover tarjetas a Sin asignar</strong>.
      </p>
    );
  };

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      onClick={busy ? undefined : onCancel}
    >
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Eliminar &laquo;{section.name}&raquo;</h3>
        <p className={styles.body}>
          ¿Qué quieres hacer con las {itemCount}{' '}
          {itemCount === 1 ? 'tarjeta' : 'tarjetas'} de esta sección?
        </p>
        {renderWarning()}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btnCancel}
            onClick={onCancel}
            disabled={busy}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.btnNeutral}
            onClick={onMoveToUnassigned}
            disabled={busy}
          >
            Mover tarjetas a Sin asignar
          </button>
          <button
            type="button"
            className={styles.btnDanger}
            onClick={onDeleteAll}
            disabled={busy}
          >
            Eliminar sección y todas sus tarjetas
          </button>
        </div>
      </div>
    </div>
  );
}
