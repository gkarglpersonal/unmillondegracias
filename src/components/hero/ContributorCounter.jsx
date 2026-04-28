import { useConfig } from '../../hooks/useConfig.js';
import { copy } from '../../content/copy.js';
import { formatNumber } from '../../utils/formatCurrency.js';
import styles from './ContributorCounter.module.css';

/**
 * Contador de contribuidores. Siempre visible:
 *  - Si nadie se ha sumado todavía → invitación "Sé el primero en sumarte."
 *  - Si hay 1+ contribuidores → número grande en honey + texto descriptivo.
 *
 * Mientras carga datos por primera vez, el hook tiene un timeout de 2 s
 * para evitar bloquear el render.
 */
export default function ContributorCounter() {
  const { config, loading } = useConfig();
  if (loading) return null;

  const count = config?.totalContributors ?? 0;

  if (count === 0) {
    return (
      <p className={`${styles.counter} ${styles.empty}`} aria-live="polite">
        <span className={styles.emptyText}>{copy.hero.contributorCounter(0)}</span>
      </p>
    );
  }

  const fullText = copy.hero.contributorCounter(count);
  const textWithoutLeadingNumber = fullText.replace(/^\d+\s*/, '');

  return (
    <p className={styles.counter} aria-live="polite">
      <span className={styles.number}>{formatNumber(count)}</span>
      <span className={styles.text}>{textWithoutLeadingNumber}</span>
    </p>
  );
}
