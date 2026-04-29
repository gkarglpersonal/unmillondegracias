import { copy } from '../../content/copy.js';
import TimelineItem from './TimelineItem.jsx';
import styles from './HistorySection.module.css';

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
          <TimelineItem
            key={era.period}
            index={idx}
            period={era.period}
            caption={era.caption}
          />
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
