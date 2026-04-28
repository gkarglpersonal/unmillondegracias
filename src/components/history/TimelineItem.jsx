import styles from './TimelineItem.module.css';

/**
 * Tarjeta de una época. Si no hay foto todavía, muestra una placeholder
 * con el nombre del periodo en tipografía grande sobre fondo cálido.
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
          <div className={styles.placeholder} aria-hidden="true">
            <span className={styles.placeholderLabel}>{period}</span>
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
