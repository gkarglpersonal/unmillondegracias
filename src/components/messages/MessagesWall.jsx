import Masonry from 'react-masonry-css';
import { useVisibleMessages } from '../../hooks/useVisibleMessages.js';
import MessageCard from './MessageCard.jsx';
import styles from './MessagesWall.module.css';

const breakpointCols = {
  default: 3,
  1024: 2,
  640: 1,
};

export default function MessagesWall() {
  const { items, loading } = useVisibleMessages();

  return (
    <section className={`${styles.section} section`} id="muro">
      <header className={styles.header}>
        <p className="eyebrow">Mensajes</p>
        <h2 className={styles.title}>Lo que tenemos para decirle.</h2>
      </header>

      {loading && items.length === 0 ? (
        <p className={styles.empty}>Cargando mensajes…</p>
      ) : items.length === 0 ? (
        <p className={styles.empty}>
          Aún no hay mensajes. Si has compartido un recuerdo de Mariángeles,
          aparecerá aquí en cuanto envíes el formulario.
        </p>
      ) : (
        <Masonry
          breakpointCols={breakpointCols}
          className={styles.masonry}
          columnClassName={styles.masonryColumn}
        >
          {items.map((m) => (
            <MessageCard key={m.id} message={m} />
          ))}
        </Masonry>
      )}
    </section>
  );
}
