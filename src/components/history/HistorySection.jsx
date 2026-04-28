import { copy } from '../../content/copy.js';
import TimelineItem from './TimelineItem.jsx';
import styles from './HistorySection.module.css';

export default function HistorySection() {
  return (
    <section className={`${styles.section} section`} id="historia">
      <header className={styles.header}>
        <p className="eyebrow">Su trayectoria</p>
        <h2 className={styles.title}>Cuatro décadas en una sola vocación.</h2>
      </header>

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
    </section>
  );
}
