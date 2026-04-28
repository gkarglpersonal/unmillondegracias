import { useEffect, useState } from 'react';
import {
  subscribeAllMessages,
  setMessageHidden,
  deleteMessage,
} from '../../firebase/messageWall.js';
import { relativeTime } from '../../utils/formatDate.js';
import styles from './ContributionsList.module.css';

export default function MessagesModeration() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const unsub = subscribeAllMessages((data) => {
      setItems(data);
      setLoading(false);
    });
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
      )}
    </section>
  );
}
