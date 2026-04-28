import { useEffect, useState } from 'react';
import ParticipationForm from './ParticipationForm.jsx';
import SuccessOverlay from './SuccessOverlay.jsx';
import styles from './FormModal.module.css';

/**
 * Modal fullscreen para el formulario en mobile.
 * Se cierra con el botón × en la esquina, o con tecla ESC.
 * El SuccessOverlay queda dentro del modal: el usuario debe cerrarlo manualmente
 * y luego puede cerrar el modal.
 */
export default function FormModal({ open, onClose, lockedTripItemId = null }) {
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape' && !success) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, success]);

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Formulario de participación"
    >
      <div className={styles.sheet}>
        <header className={styles.header}>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>

        <div className={styles.body}>
          <h2 className={styles.modalTitle}>Súmate al regalo</h2>
          <ParticipationForm
            variant="modal"
            lockedTripItemId={lockedTripItemId}
            onSuccess={(data) => setSuccess(data)}
          />
        </div>

        {success && (
          <SuccessOverlay
            data={success}
            onClose={() => {
              setSuccess(null);
              onClose();
            }}
          />
        )}
      </div>
    </div>
  );
}
