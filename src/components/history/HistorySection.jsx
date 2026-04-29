import { copy } from '../../content/copy.js';
import TimelineItem from './TimelineItem.jsx';
import styles from './HistorySection.module.css';

/**
 * Cuando lleguen las fotos reales de Mariángeles, asignar `photoUrl` a
 * cada TimelineItem siguiendo este mapa por índice (0/1/2):
 *   idx 0 — Los primeros años   → /images/mariangeles-primeros-anos.jpg
 *   idx 1 — Los años intermedios → /images/mariangeles-anos-intermedios.jpg
 *   idx 2 — Los años recientes   → /images/mariangeles-anos-recientes.jpg
 * Mientras tanto, TimelineItem renderiza la placeholder beige con icono
 * de cámara.
 */
const ERA_PHOTO_FILENAMES = [
  'mariangeles-primeros-anos.jpg',
  'mariangeles-anos-intermedios.jpg',
  'mariangeles-anos-recientes.jpg',
];

export default function HistorySection() {
  return (
    <section className={`${styles.section} section`} id="historia">
      <header className={styles.header}>
        <p className="eyebrow">{copy.history.eyebrow}</p>
        <h2 className={styles.title}>{copy.history.title}</h2>
      </header>

      <div className={styles.prose}>
        {copy.history.past.map((p, i) => (
          <p key={`past-${i}`} className={styles.paragraph}>{p}</p>
        ))}
      </div>

      <div className={styles.timeline}>
        {copy.history.eras.map((era, idx) => (
          <div className={styles.timelineSlide} key={era.period}>
            {/* Sustituir la placeholder pasando photoUrl con el archivo
                ERA_PHOTO_FILENAMES[idx] subido a /public/images/. */}
            <TimelineItem
              index={idx}
              period={era.period}
              caption={era.caption}
              // photoUrl={`/images/${ERA_PHOTO_FILENAMES[idx]}`}
            />
          </div>
        ))}
      </div>

      <hr className={styles.divider} aria-hidden="true" />

      <div className={styles.prose}>
        {copy.history.future.map((p, i) => (
          <p key={`future-${i}`} className={styles.paragraph}>{p}</p>
        ))}
      </div>
    </section>
  );
}
