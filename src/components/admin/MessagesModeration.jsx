import { useEffect, useState } from 'react';
import {
  subscribeAdminMessages,
  fetchMoreAdminMessages,
  setMessageHidden,
  deleteMessage,
} from '../../firebase/messageWall.js';
import { relativeTime } from '../../utils/formatDate.js';
import styles from './ContributionsList.module.css';

const PAGE_SIZE = 50;

export default function MessagesModeration() {
  const [items, setItems] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    // El listener cubre la primera página (limit 50). Carga incremental
    // posterior vive fuera del listener: cambios en docs viejos no se
    // reflejarán hasta refrescar. Aceptable en moderación.
    const unsub = subscribeAdminMessages(
      ({ items: firstPage, lastDoc: cursor, hasMore: more }) => {
        setItems(firstPage);
        setLastDoc(cursor);
        setHasMore(more);
        setLoading(false);
      },
      { pageSize: PAGE_SIZE }
    );
    const t = setTimeout(() => setLoading(false), 2000);
    return () => {
      clearTimeout(t);
      try { unsub(); } catch { /* noop */ }
    };
  }, []);

  // Solo entradas que tengan mensaje (las que solo subieron foto, sin texto, no van aquí)
  const messages = items.filter((m) => m.message && m.message.trim().length > 0);

  const handleToggleHidden = async (id, currentlyHidden) => {
    setBusyId(id);
    try { await setMessageHidden(id, !currentlyHidden); } finally { setBusyId(null); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Borrar este mensaje? Esto solo afecta a la vista pública. La aportación privada sigue.')) return;
    setBusyId(id);
    try { await deleteMessage(id); } finally { setBusyId(null); }
  };

  const handleLoadMore = async () => {
    if (!hasMore || !lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const next = await fetchMoreAdminMessages(lastDoc, { pageSize: PAGE_SIZE });
      // Concatenamos respetando el orderBy desc original. Como cada página
      // viene ordenada por createdAt desc y la nueva empieza después del
      // último cursor, el simple append preserva el orden global.
      setItems((prev) => [...prev, ...next.items]);
      setLastDoc(next.lastDoc);
      setHasMore(next.hasMore);
    } catch (err) {
      console.warn('fetchMoreAdminMessages:', err?.code || err?.message);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h2 className={styles.heading}>Mensajes del muro ({messages.length})</h2>
      </header>

      {loading ? (
        <p className={styles.empty}>Cargando…</p>
      ) : messages.length === 0 ? (
        <p className={styles.empty}>Aún no hay mensajes en el muro.</p>
      ) : (
        <>
          <ul className={styles.list}>
            {messages.map((m) => (
              <li key={m.id} className={styles.row}>
                <div className={styles.rowMain}>
                  <div className={styles.rowHead}>
                    <span className={styles.name}>{m.name}</span>
                    {m.messageHidden && (
                      <span className={styles.status} style={{ background: 'rgba(178,90,71,0.14)', color: 'var(--color-error)' }}>
                        Oculto
                      </span>
                    )}
                    {m.paid && (
                      <span className={`${styles.status} ${styles.status_paid}`}>Con aportación</span>
                    )}
                  </div>
                  {m.createdAt && (
                    <div className={styles.rowMeta}>
                      <span>{relativeTime(m.createdAt)}</span>
                    </div>
                  )}
                  <p className={styles.messagePreview} style={{ fontStyle: 'normal', whiteSpace: 'pre-wrap' }}>
                    {m.message}
                  </p>
                </div>
                <div className={styles.rowSide}>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={busyId === m.id}
                      onClick={() => handleToggleHidden(m.id, m.messageHidden)}
                    >
                      {m.messageHidden ? 'Mostrar' : 'Ocultar'}
                    </button>
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      disabled={busyId === m.id}
                      onClick={() => handleDelete(m.id)}
                    >
                      Borrar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {hasMore ? (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn-secondary"
                disabled={loadingMore}
                onClick={handleLoadMore}
              >
                {loadingMore ? 'Cargando más…' : 'Cargar más mensajes'}
              </button>
            </div>
          ) : items.length > PAGE_SIZE ? (
            <p className={styles.empty} style={{ marginTop: '1rem' }}>
              Has llegado al final.
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
