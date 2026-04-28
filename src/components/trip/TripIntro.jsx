import { copy } from '../../content/copy.js';
import styles from './TripIntro.module.css';

export default function TripIntro() {
  return (
    <section className={`${styles.section} section`} id="el-viaje">
      <header className={styles.header}>
        <p className="eyebrow">El viaje</p>
        <h2 className={styles.title}>Argentina. Dos personas. Dos o tres semanas.</h2>
        <p className={styles.lead}>{copy.trip.intro}</p>
      </header>

      <div className={styles.steps}>
        <h3 className={styles.stepsTitle}>Cómo funciona</h3>
        <ol className={styles.stepsList}>
          {copy.trip.howItWorks.map((step, idx) => (
            <li key={idx} className={styles.step}>
              <span className={styles.stepNum}>{String(idx + 1).padStart(2, '0')}</span>
              <span className={styles.stepText}>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <p className={styles.privacy}>{copy.trip.privacyNote}</p>
    </section>
  );
}
