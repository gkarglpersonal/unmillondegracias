import { relativeTime } from '../../utils/formatDate.js';
import styles from './MessageCard.module.css';

export default function MessageCard({ message }) {
  return (
    <article className={styles.card}>
      <p className={styles.text}>{message.message}</p>
      <footer className={styles.footer}>
        <span className={styles.name}>{message.name}</span>
        {message.createdAt && (
          <span className={styles.time}>{relativeTime(message.createdAt)}</span>
        )}
      </footer>
    </article>
  );
}
