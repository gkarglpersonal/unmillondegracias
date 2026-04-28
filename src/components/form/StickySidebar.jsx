import { useState } from 'react';
import ParticipationForm from './ParticipationForm.jsx';
import SuccessOverlay from './SuccessOverlay.jsx';
import { useFormModal } from './FormProvider.jsx';
import styles from './StickySidebar.module.css';

/**
 * Sidebar derecho de desktop. Fondo alpine green con tarjeta blanca dentro.
 * Consume el contexto del FormProvider para preseleccionar partida cuando
 * alguien pulsa una tarjeta de termómetro en desktop.
 */
export default function StickySidebar() {
  const { sidebarLockedTripItemId } = useFormModal();
  const [success, setSuccess] = useState(null);

  return (
    <div className={styles.inner}>
      <ParticipationForm
        // Re-mount el form cuando cambia la partida bloqueada para que
        // useEffect del importe sugerido se dispare.
        key={sidebarLockedTripItemId || 'no-lock'}
        variant="sidebar"
        lockedTripItemId={sidebarLockedTripItemId}
        onSuccess={(data) => setSuccess(data)}
      />
      {success && (
        <SuccessOverlay data={success} onClose={() => setSuccess(null)} />
      )}
    </div>
  );
}
