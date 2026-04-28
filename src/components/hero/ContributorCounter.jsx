import { useConfig } from '../../hooks/useConfig.js';
import { copy } from '../../content/copy.js';
import { formatNumber } from '../../utils/formatCurrency.js';
import styles from './ContributorCounter.module.css';

export default function ContributorCounter() {
  const { config, loading } = useConfig();
  const count = config?.totalContributors ?? 0;

  if (loading || count === 0) return null;

  return (
    <p className={styles.counter} aria-live="polite">
      <span className={styles.number}>{formatNumber(count)}</span>
      <span className={styles.text}>
        {copy.hero.contributorCounter(count).replace(/^\d+\s*/, '')}
      </span>
    </p>
  );
}
