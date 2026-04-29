import { Camera } from 'lucide-react';
import styles from './TimelineItem.module.css';

/**
 * Tarjeta de una época. Si no hay foto todavía, muestra una placeholder
 * con icono de cámara y leyenda "Foto de Mariángeles · pendiente".
 *
 * Cuando llegue la foto definitiva, basta con pasar `photoUrl` y la
 * placeholder desaparece.
 */
export default function TimelineItem({ index, period, caption, photoUrl }) {
  return (
    <article
      className={styles.item}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className={styles.imageWrap}>
        {photoUrl ? (
          <img src={photoUrl} alt={period} className={styles.image} loading="lazy" />
        ) : (
          <div className={styles.placeholder} aria-label={`Foto de ${period} pendiente`}>
            <Camera size={32} strokeWidth={1.6} className={styles.placeholderIcon} aria-hidden="true" />
            <span className={styles.placeholderText}>Foto de Mariángeles · pendiente</span>
          </div>
        )}
      </div>
      <div className={styles.body}>
        <p className={styles.period}>{period}</p>
        <p className={styles.caption}>{caption}</p>
      </div>
    </article>
  );
}
