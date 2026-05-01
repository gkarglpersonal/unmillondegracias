import { useState } from 'react';
import Masonry from 'react-masonry-css';
import { useVisibleMessages } from '../../hooks/useVisibleMessages.js';
import MessageCard from './MessageCard.jsx';
import styles from './MessagesWall.module.css';

const breakpointCols = {
  default: 3,
  1024: 2,
  640: 1,
};

// Mostramos sólo unos pocos mensajes inicialmente para que el muro no
// bloquee el scroll en mobile y el visitante llegue a la galería de
// fotos. El resto aparece al pulsar "Ver todos los mensajes".
const INITIAL_VISIBLE = 3;

export default function MessagesWall() {
  const { items, loading } = useVisibleMessages();
  const [expanded, setExpanded] = useState(false);

  const visibleItems = expanded ? items : items.slice(0, INITIAL_VISIBLE);
  const hiddenCount = Math.max(0, items.length - INITIAL_VISIBLE);
  const hasMore = items.length > INITIAL_VISIBLE;

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
          Aún no hay mensajes. Si has compartido un recuerdo de MªÁngeles,
          aparecerá aquí en cuanto envíes el formulario.
        </p>
      ) : (
        <>
          <Masonry
            breakpointCols={breakpointCols}
            className={styles.masonry}
            columnClassName={styles.masonryColumn}
          >
            {visibleItems.map((m) => (
              <MessageCard key={m.id} message={m} />
            ))}
          </Masonry>

          {hasMore && (
            <div className={styles.expandRow}>
              <button
                type="button"
                className={styles.expandBtn}
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                aria-controls="muro"
              >
                {expanded
                  ? 'Ver menos'
                  : `Ver todos los mensajes (${items.length})`}
                <span aria-hidden="true" className={expanded ? styles.chevronUp : styles.chevronDown}>
                  ▾
                </span>
              </button>
              {!expanded && (
                <p className={styles.hint}>
                  Mostrando {INITIAL_VISIBLE} de {items.length}.{' '}
                  {hiddenCount === 1 ? 'Hay 1 más' : `Hay ${hiddenCount} más`} sin mostrar.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
