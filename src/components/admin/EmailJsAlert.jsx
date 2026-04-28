import { useEffect, useState } from 'react';
import { subscribeAdminContributions } from '../../firebase/contributions.js';
import styles from './EmailJsAlert.module.css';

const PENDING_THRESHOLD = 80;

/**
 * Aviso para el plan free de EmailJS (200 emails/mes; cada contribución
 * envía hasta 2 emails). Cuando hay más de 80 aportaciones pendientes,
 * el banner sugiere actualizar el plan para no perder notificaciones.
 *
 * Se autodesactiva cuando el número baja del umbral.
 */
export default function EmailJsAlert() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const unsub = subscribeAdminContributions((items) => {
      const count = items.filter((c) => c.paymentStatus === 'pending').length;
      setPendingCount(count);
    });
    return () => {
      try { unsub(); } catch { /* noop */ }
    };
  }, []);

  if (pendingCount <= PENDING_THRESHOLD) return null;

  return (
    <div className={styles.alert} role="alert">
      <span className={styles.icon} aria-hidden="true">⚠️</span>
      <p className={styles.text}>
        <strong>Atención:</strong> tienes más de 80 aportaciones registradas
        este mes. Revisa el límite de emails gratuitos en EmailJS (200/mes) y
        considera actualizar el plan en{' '}
        <a
          href="https://www.emailjs.com/pricing/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          emailjs.com/pricing
        </a>{' '}
        para no perder notificaciones.
      </p>
    </div>
  );
}
