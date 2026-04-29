import { useConfig } from '../../hooks/useConfig.js';
import { percent } from '../../utils/formatCurrency.js';
import styles from './HeroProgressBar.module.css';

/**
 * Barra global del hero. Muestra el porcentaje del coste total del viaje
 * que se ha cubierto con aportaciones marcadas como pagadas.
 */
export default function HeroProgressBar() {
  const { config, loading } = useConfig();
  if (loading) return null;

  const totalRaised = config?.totalRaised ?? 0;
  const totalCost = config?.totalTripCost ?? 10500;
  const pct = percent(totalRaised, totalCost);

  return (
    <div className={styles.wrap}>
      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${pct}% del viaje financiado`}
      >
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
      <p className={styles.caption}>
        <span className={styles.captionPct}>{pct}%</span> del viaje financiado
      </p>
    </div>
  );
}
