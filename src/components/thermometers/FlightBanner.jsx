import { Plane } from 'lucide-react';
import { useFormModal } from '../form/FormProvider.jsx';
import HeartIcon from '../ui/HeartIcon.jsx';
import { formatCurrency } from '../../utils/formatCurrency.js';
import styles from './FlightBanner.module.css';

/**
 * Banner de vuelo entre ciudades. Click en "Regalar" abre el formulario
 * con la partida del vuelo preseleccionada.
 */
export default function FlightBanner({ label, item }) {
  const { openForm } = useFormModal();

  // Si la partida aún no ha cargado de Firestore, mostramos el banner
  // pero deshabilitamos el botón.
  const ready = !!item;

  return (
    <div className={styles.banner}>
      <Plane size={16} strokeWidth={1.75} className={styles.icon} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
      <span className={styles.dot} aria-hidden="true">·</span>
      <span className={styles.price}>
        {ready ? formatCurrency(item.targetAmount) : '—'}
      </span>

      <button
        type="button"
        className={`btn ${styles.cta}`}
        onClick={() => ready && openForm({ tripItemId: item.id })}
        disabled={!ready}
      >
        <HeartIcon size={14} className={styles.heartIcon} />
        Regalar
      </button>
    </div>
  );
}
