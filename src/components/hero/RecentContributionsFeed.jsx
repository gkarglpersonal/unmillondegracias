import { useRecentContributions } from '../../hooks/useRecentContributions.js';
import { relativeTime } from '../../utils/formatDate.js';
import styles from './RecentContributionsFeed.module.css';

export default function RecentContributionsFeed() {
  const { items, loading, error } = useRecentContributions(5);

  if (loading || error) return null;
  if (!items || items.length === 0) return null;

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
