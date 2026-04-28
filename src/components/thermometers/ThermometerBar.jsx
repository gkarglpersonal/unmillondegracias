import { percent } from '../../utils/formatCurrency.js';
import styles from './ThermometerBar.module.css';

/**
 * Barra de progreso para una partida. Solo porcentaje, nunca importe absoluto.
 */
export default function ThermometerBar({ raised, target }) {
  const pct = percent(raised, target);
  return (
    <div className={styles.wrap} aria-label={`${pct}% recaudado`}>
      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
      <span className={styles.pct}>{pct}%</span>
    </div>
  );
}
