import { copy } from '../../content/copy.js';
import { useFormModal } from '../form/FormProvider.jsx';
import HeartIcon from '../ui/HeartIcon.jsx';
import styles from './FloatingCTA.module.css';

/**
 * Botón flotante para mobile (oculto en desktop, donde existe el sidebar).
 * Siempre visible. Click abre el modal del formulario.
 */
export default function FloatingCTA() {
  const { openForm } = useFormModal();

  return (
    <button
      type="button"
      onClick={() => openForm()}
      className={styles.fab}
      aria-label={copy.floatingCta.label}
    >
      <HeartIcon className={styles.icon} />
      <span className={styles.label}>{copy.floatingCta.label}</span>
    </button>
  );
}
