import { copy } from '../../content/copy.js';
import styles from './TripTransition.module.css';

export default function TripTransition() {
  return (
    <section className={`${styles.section} section`}>
      <p className="eyebrow">El nuevo capítulo</p>
      <p className={styles.statement}>{copy.trip.transition}</p>
    </section>
  );
}
