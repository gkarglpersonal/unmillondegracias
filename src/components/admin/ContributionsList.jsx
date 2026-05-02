import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import {
  subscribeAdminContributions,
  fetchMoreAdminContributions,
  markContributionPaid,
  unmarkContributionPaid,
  deleteContribution,
  updateContributionAmount,
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

const PAGE_SIZE = 50;

export default function ContributionsList() {
  const [items, setItems] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState('pending');
  const [busyId, setBusyId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editError, setEditError] = useState(null);
  const { items: tripItems } = useTripItems({ onlyActive: false });

  useEffect(() => {
    // Listener paginado: solo la primera página es reactiva. Páginas
    // posteriores se cargan con `fetchMoreAdminContributions` y no
    // actualizan ante cambios remotos hasta refrescar.
    const unsub = subscribeAdminContributions(
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

  const tripItemName = (id) => tripItems.find((t) => t.id === id)?.name || 'Sin preferencia · fondo general';

  const filtered = items.filter((c) => {
    if (filter === 'all') return true;
    return c.paymentStatus === filter;
  });

  const handleLoadMore = async () => {
    if (!hasMore || !lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const next = await fetchMoreAdminContributions(lastDoc, { pageSize: PAGE_SIZE });
      // Append: cada página viene ordenada desc y arranca tras el cursor,
      // así el orden global se preserva sin re-sort.
      setItems((prev) => [...prev, ...next.items]);
      setLastDoc(next.lastDoc);
      setHasMore(next.hasMore);
    } catch (err) {
      console.warn('fetchMoreAdminContributions:', err?.code || err?.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleMarkPaid = async (id) => {
    setBusyId(id);
    try { await markContributionPaid(id); } finally { setBusyId(null); }
  };

  const handleUnmarkPaid = async (id) => {
    if (!confirm('¿Revertir el estado de pagado? Se descontará del termómetro.')) return;
    setBusyId(id);
    try { await unmarkContributionPaid(id); } finally { setBusyId(null); }
  };

  /**
   * Borrado con confirmación reforzada para pagadas: enuncia consecuencias
   * y exige una segunda confirmación con el importe en el texto.
   *
   * Nota: el mensaje del muro se conserva si lo había (la aportación
   * económica se borra, pero el mensaje que la persona escribió para
   * Mariángeles permanece). La foto se borra siempre.
   */
  const handleDelete = async (c) => {
    const isPaid = c.paymentStatus === 'paid';
    const amountText = c.amount && c.amount > 0 ? formatCurrency(c.amount) : 'sin importe';
    const hasMessage =
      typeof c.message === 'string' && c.message.trim().length > 0;
    const messagePart = hasMessage
      ? 'El mensaje del muro se conserva; solo se borra la aportación económica y la foto (si la había).'
      : 'No hay mensaje vinculado, así que la entrada del muro también se elimina.';

    let confirmText;
    if (isPaid) {
      confirmText = `Vas a eliminar esta aportación de ${amountText}. Se descontará del termómetro y del contador general. ${messagePart} Esta acción no se puede deshacer.\n\n¿Continuar?`;
    } else {
      confirmText = `Vas a eliminar esta aportación pendiente. ${messagePart} Esta acción no se puede deshacer.\n\n¿Continuar?`;
    }

    if (!confirm(confirmText)) return;

    // Doble confirmación cuando ya estaba contada en el termómetro.
    if (isPaid) {
      const reinforced = confirm(
        `Confirmación final: vas a restar ${amountText} del termómetro y reducir el contador de donantes. ¿Seguro?`
      );
      if (!reinforced) return;
    }

    setBusyId(c.id);
    try {
      await deleteContribution(c.id);
    } catch (err) {
      console.error(err);
      alert('No se pudo borrar la aportación. Inténtalo de nuevo.');
    } finally {
      setBusyId(null);
    }
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditValue(c.amount && c.amount > 0 ? String(c.amount) : '');
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
    setEditError(null);
  };

  const saveEdit = async (c) => {
    setEditError(null);
    const trimmed = editValue.trim();
    const newAmount = trimmed === '' ? 0 : Number(trimmed);
    if (!Number.isFinite(newAmount) || newAmount < 0) {
      setEditError('Importe inválido. Rellena un número igual o mayor que 0.');
      return;
    }

    const oldAmount = c.amount && c.amount > 0 ? Number(c.amount) : 0;
    if (newAmount === oldAmount) {
      cancelEdit();
      return;
    }

    const delta = newAmount - oldAmount;
    const isPaid = c.paymentStatus === 'paid';
    const sign = delta > 0 ? '+' : '−';
    const absDelta = Math.abs(delta);

    let confirmText;
    if (isPaid) {
      confirmText = `Importe nuevo: ${formatCurrency(newAmount)} (antes ${formatCurrency(oldAmount)}). Se ${delta > 0 ? 'sumará' : 'descontará'} ${sign}${formatCurrency(absDelta)} al termómetro. ¿Confirmas?`;
    } else {
      confirmText = `Importe nuevo: ${formatCurrency(newAmount)} (antes ${formatCurrency(oldAmount)}). Como la aportación está pendiente, el termómetro no se toca todavía. ¿Confirmas?`;
    }
    if (!confirm(confirmText)) return;

    setBusyId(c.id);
    try {
      await updateContributionAmount(c.id, newAmount);
      cancelEdit();
    } catch (err) {
      console.error(err);
      setEditError('No se pudo actualizar el importe. Inténtalo de nuevo.');
    } finally {
      setBusyId(null);
    }
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
        <>
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
                {editingId === c.id ? (
                  <div className={styles.editBox}>
                    <label className={styles.editLabel}>
                      Nuevo importe (€)
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className={styles.editInput}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                      />
                    </label>
                    {editError && <p className={styles.editError}>{editError}</p>}
                    <div className={styles.editActions}>
                      <button
                        type="button"
                        className="btn"
                        disabled={busyId === c.id}
                        onClick={() => saveEdit(c)}
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={busyId === c.id}
                        onClick={cancelEdit}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.amountRow}>
                      {c.amountPrivate && c.amount > 0 && (
                        <span
                          className={styles.privateIcon}
                          title="Privado: el donante prefiere que MªÁngeles no vea el importe"
                          aria-label="Importe privado: oculto para MªÁngeles"
                        >
                          <Lock size={14} aria-hidden="true" />
                        </span>
                      )}
                      <span className={styles.amount}>
                        {c.amount ? formatCurrency(c.amount) : '—'}
                      </span>
                    </div>
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
                        className={styles.editBtn}
                        disabled={busyId === c.id}
                        onClick={() => startEdit(c)}
                      >
                        Editar importe
                      </button>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        disabled={busyId === c.id}
                        onClick={() => handleDelete(c)}
                        aria-label="Borrar aportación"
                      >
                        Borrar
                      </button>
                    </div>
                  </>
                )}
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
              {loadingMore ? 'Cargando más…' : 'Cargar más aportaciones'}
            </button>
          </div>
        ) : items.length > PAGE_SIZE ? (
          <p className={styles.empty} style={{ marginTop: '1rem' }}>
            No hay más aportaciones.
          </p>
        ) : null}
        </>
      )}
    </section>
  );
}
