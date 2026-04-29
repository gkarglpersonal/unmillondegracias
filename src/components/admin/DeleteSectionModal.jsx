import { useEffect } from 'react';
import styles from './DeleteSectionModal.module.css';

/**
 * Modal de confirmación al eliminar una sección. Tres acciones:
 *  - Eliminar sección y todas sus tarjetas (rojo)
 *  - Mover tarjetas a "Sin asignar" (neutro)
 *  - Cancelar
 */
export default function DeleteSectionModal({ section, itemCount, onCancel, onDeleteAll, onMoveToUnassigned, busy }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && !busy && onCancel();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [busy, onCancel]);

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" onClick={busy ? undefined : onCancel}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Eliminar "{section.name}"</h3>
        <p className={styles.body}>
          ¿Qué quieres hacer con las {itemCount}{' '}
          {itemCount === 1 ? 'tarjeta' : 'tarjetas'} de esta sección?
        </p>
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
