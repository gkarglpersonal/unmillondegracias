import { useConfig } from '../../hooks/useConfig.js';
import { useCampaignTarget } from '../../hooks/useCampaignTarget.js';
import { percent } from '../../utils/formatCurrency.js';
import styles from './HeroProgressBar.module.css';

/**
 * Barra global del hero. Muestra el porcentaje del objetivo total del viaje
 * que se ha cubierto con aportaciones marcadas como pagadas.
 *
 * El objetivo total ya no es un target fijo: se calcula en tiempo real
 * sumando los `targetAmount` de todas las partidas activas (ver
 * `useCampaignTarget`). Solo se muestra el porcentaje, nunca el importe.
 */
export default function HeroProgressBar() {
  const { config, loading: configLoading } = useConfig();
  const { target, loading: targetLoading } = useCampaignTarget();
  if (configLoading || targetLoading) return null;

  const totalRaised = config?.totalRaised ?? 0;
  const pct = percent(totalRaised, target);

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
