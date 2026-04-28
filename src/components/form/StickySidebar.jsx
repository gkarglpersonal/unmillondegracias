import { useState } from 'react';
import ParticipationForm from './ParticipationForm.jsx';
import SuccessOverlay from './SuccessOverlay.jsx';
import styles from './StickySidebar.module.css';

/**
 * Contenedor del sidebar derecho en desktop.
 * Fondo alpine green con gradiente vertical.
 * Tarjeta blanca interior con el formulario.
 * Botón submit honey (heredado de ParticipationForm via .btn-honey).
 */
export default function StickySidebar({ lockedTripItemId = null }) {
  const [success, setSuccess] = useState(null);

  return (
    <div className={styles.inner}>
      <ParticipationForm
        variant="sidebar"
        lockedTripItemId={lockedTripItemId}
        onSuccess={(data) => setSuccess(data)}
      />
      {success && (
        <SuccessOverlay data={success} onClose={() => setSuccess(null)} />
      )}
    </div>
  );
}
