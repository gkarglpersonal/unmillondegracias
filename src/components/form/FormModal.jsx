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
  // Bloquea ESC y × mientras el submit está en vuelo: cerrar a mitad
  // perdería `attemptStateRef` del form y un retry posterior generaría
  // IDs nuevos → contribución duplicada. Simétrico al guard por `success`.
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape' && !success && !submitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, success, submitting]);

  if (!open) return null;

  // Guarda explícita en el handler del botón × por si el `disabled` se
  // ignora (programáticamente, foco anidado, etc.).
  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

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
            onClick={handleClose}
            aria-label="Cerrar"
            disabled={submitting}
            aria-disabled={submitting}
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
            onSubmittingChange={setSubmitting}
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
