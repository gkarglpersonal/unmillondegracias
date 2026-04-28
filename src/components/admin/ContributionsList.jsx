import { useEffect, useState } from 'react';
import {
  subscribeAdminContributions,
  markContributionPaid,
  unmarkContributionPaid,
  deleteContribution,
} from '../../firebase/contributions.js';
import { useTripItems } from '../../hooks/useTripItems.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { relativeTime } from '../../utils/formatDate.js';
import styles from './ContributionsList.module.css';

const FILTERS = [
  { id: 'all', label: 'Todas' },
  { id: 'pending', label: 'Pendientes' },
  { id: 'paid', label: 'Pagadas' },
];

export default function ContributionsList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [busyId, setBusyId] = useState(null);
  const { items: tripItems } = useTripItems({ onlyActive: false });

  useEffect(() => {
    const unsub = subscribeAdminContributions((data) => {
      setItems(data);
      setLoading(false);
    });
    const t = setTimeout(() => setLoading(false), 2000);
    return () => {
      clearTimeout(t);
      try { unsub(); } catch { /* noop */ }
    };
  }, []);

  const tripItemName = (id) => tripItems.find((t) => t.id === id)?.name || 'Sin preferencia · fondo general';

  const filtered = items.filter((c) => {
    if (filter === 'all') return true;
    return c.paymentStatus === filter;
  });

  const handleMarkPaid = async (id) => {
    setBusyId(id);
    try { await markContributionPaid(id); } finally { setBusyId(null); }
  };

  const handleUnmarkPaid = async (id) => {
    if (!confirm('¿Revertir el estado de pagado? Se descontará del termómetro.')) return;
    setBusyId(id);
    try { await unmarkContributionPaid(id); } finally { setBusyId(null); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Borrar esta aportación? Esta acción no se puede deshacer.')) return;
    setBusyId(id);
    try { await deleteContribution(id); } finally { setBusyId(null); }
  };

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h2 className={styles.heading}>Aportaciones</h2>
        <div className={styles.filters}>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`${styles.filterBtn} ${filter === f.id ? styles.filterActive : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
              <span className={styles.count}>
                {f.id === 'all' ? items.length : items.filter((c) => c.paymentStatus === f.id).length}
              </span>
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <p className={styles.empty}>Cargando…</p>
      ) : filtered.length === 0 ? (
        <p className={styles.empty}>No hay aportaciones {filter !== 'all' ? `en estado "${filter}"` : ''}.</p>
      ) : (
        <ul className={styles.list}>
          {filtered.map((c) => (
            <li key={c.id} className={styles.row}>
              <div className={styles.rowMain}>
                <div className={styles.rowHead}>
                  <span className={styles.name}>{c.name}</span>
                  <span className={`${styles.status} ${styles[`status_${c.paymentStatus}`] || ''}`}>
                    {c.paymentStatus === 'paid' ? 'Pagada' : c.paymentStatus === 'pending' ? 'Pendiente' : c.paymentStatus}
                  </span>
                  {c.isManual && <span className={styles.manualBadge}>Manual</span>}
                </div>
                <div className={styles.rowMeta}>
                  <span>{c.email}</span>
                  <span>·</span>
                  <span>{tripItemName(c.tripItemId)}</span>
                  {c.createdAt && (
                    <>
                      <span>·</span>
                      <span>{relativeTime(c.createdAt)}</span>
                    </>
                  )}
                </div>
                {c.message && (
                  <p className={styles.messagePreview}>"{c.message.slice(0, 140)}{c.message.length > 140 ? '…' : ''}"</p>
                )}
              </div>
              <div className={styles.rowSide}>
                <span className={styles.amount}>
                  {c.amount ? formatCurrency(c.amount) : '—'}
                </span>
                <div className={styles.actions}>
                  {c.paymentStatus === 'pending' && c.amount > 0 && (
                    <button
                      type="button"
                      className="btn"
                      disabled={busyId === c.id}
                      onClick={() => handleMarkPaid(c.id)}
                    >
                      Marcar pagada
                    </button>
                  )}
                  {c.paymentStatus === 'paid' && (
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={busyId === c.id}
                      onClick={() => handleUnmarkPaid(c.id)}
                    >
                      Revertir
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    disabled={busyId === c.id}
                    onClick={() => handleDelete(c.id)}
                    aria-label="Borrar aportación"
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
