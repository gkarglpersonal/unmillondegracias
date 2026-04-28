import { useRecentContributions } from '../../hooks/useRecentContributions.js';
import { relativeTime } from '../../utils/formatDate.js';
import { copy } from '../../content/copy.js';
import styles from './RecentContributionsFeed.module.css';

/**
 * Feed con las últimas N incorporaciones. Siempre visible:
 *  - Si no hay datos todavía → invitación "Aún no hay contribuciones..."
 *  - Si hay datos → lista de nombres con tiempo relativo.
 */
export default function RecentContributionsFeed() {
  const { items, loading } = useRecentContributions(5);

  if (loading) return null;

  if (!items || items.length === 0) {
    return (
      <aside className={styles.feed} aria-label="Incorporaciones recientes">
        <p className={styles.empty}>
          <span className={styles.dot} aria-hidden="true" />
          {copy.recentFeed.empty}
        </p>
      </aside>
    );
  }

  return (
    <aside className={styles.feed} aria-label="Incorporaciones recientes">
      <ul className={styles.list}>
        {items.map((item, idx) => (
          <li
            key={item.id}
            className={styles.item}
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.name}>{item.name}</span>
            <span className={styles.time}>
              {item.createdAt ? `se ha sumado ${relativeTime(item.createdAt)}` : 'se ha sumado'}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
