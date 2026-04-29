import { useConfig } from '../../hooks/useConfig.js';
import { copy } from '../../content/copy.js';
import { formatNumber } from '../../utils/formatCurrency.js';
import styles from './ContributorCounter.module.css';

/**
 * Contador de contribuidores en el hero. Diseño protagonista:
 *  - Número grande en Fraunces honey
 *  - Línea descriptiva debajo en Inter
 *  - Si nadie se ha sumado, muestra invitación destacada
 */
export default function ContributorCounter() {
  const { config, loading } = useConfig();
  if (loading) return null;

  const count = config?.totalContributors ?? 0;

  if (count === 0) {
    return (
      <div className={styles.wrap} aria-live="polite">
        <p className={styles.emptyText}>{copy.hero.contributorCounter(0)}</p>
      </div>
    );
  }

  return (
    <div className={styles.wrap} aria-live="polite">
      <span className={styles.number}>{formatNumber(count)}</span>
      <span className={styles.label}>
        {count === 1 ? 'persona ya se ha sumado' : 'personas ya se han sumado'}
      </span>
    </div>
  );
}
