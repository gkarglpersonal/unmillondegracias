import { copy } from '../../content/copy.js';
import styles from './SuccessOverlay.module.css';

/**
 * Overlay de éxito tras enviar el formulario. Se cierra manualmente
 * (no auto-dismiss) — el usuario debe leer y confirmar.
 *
 * Props:
 *  - data: { name, amount, hasMessage, hasPhoto, warning? }
 *      data.warning (opcional): string visible como aviso honesto cuando
 *      la contribución se ha guardado pero alguna notificación por email
 *      ha fallado. NO se mata el flujo: la submission es válida, el
 *      usuario solo ve un texto adicional discreto pero claro.
 *  - onClose: handler para el botón de cerrar.
 */
export default function SuccessOverlay({ data, onClose }) {
  const heading = data?.name ? `¡Gracias, ${data.name.split(' ')[0]}!` : copy.form.successTitle;
  const warning = data?.warning || null;

  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <div className={styles.card}>
        <div className={styles.iconWrap} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h3 className={styles.title}>{heading}</h3>
        <p className={styles.body}>{copy.form.successBody}</p>
        {warning && (
          <p className={styles.warning} role="alert">
            {warning}
          </p>
        )}
        <button type="button" className="btn" onClick={onClose}>
          {copy.form.successClose}
        </button>
      </div>
    </div>
  );
}
