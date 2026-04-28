import { useEffect } from 'react';
import { relativeTime } from '../../utils/formatDate.js';
import styles from './PhotoLightbox.module.css';

/**
 * Lightbox simple: foto grande centrada, nombre y fecha al pie, click en
 * fondo o ESC cierra. Sin navegación entre fotos por simplicidad.
 */
export default function PhotoLightbox({ photo, onClose }) {
  useEffect(() => {
    if (!photo) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [photo, onClose]);

  if (!photo) return null;

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label={`Foto de ${photo.name}`}
      onClick={onClose}
    >
      <button
        type="button"
        className={styles.closeBtn}
        aria-label="Cerrar"
        onClick={onClose}
      >
        ×
      </button>

      <figure
        className={styles.figure}
        onClick={(e) => e.stopPropagation()}
      >
        <img src={photo.photoUrl} alt={`Foto compartida por ${photo.name}`} className={styles.img} />
        <figcaption className={styles.caption}>
          <span className={styles.captionName}>{photo.name}</span>
          {photo.createdAt && (
            <span className={styles.captionTime}>{relativeTime(photo.createdAt)}</span>
          )}
        </figcaption>
      </figure>
    </div>
  );
}
