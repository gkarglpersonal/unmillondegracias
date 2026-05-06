import { useEffect, useState } from 'react';
import { Lock, UserCheck } from 'lucide-react';
import {
  subscribeAdminContributions,
  fetchMoreAdminContributions,
  markContributionPaid,
  unmarkContributionPaid,
  deleteContribution,
  updateContributionAmount,
  reassignContributionTripItem,
} from '../../firebase/contributions.js';
import { useTripItems } from '../../hooks/useTripItems.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { relativeTime } from '../../utils/formatDate.js';
import styles from './ContributionsList.module.css';

const FILTERS = [
  { id: 'all', label: 'Todas' },
  { id: 'pending', label: 'Pendientes' },
  { id: 'paid', label: 'Pagadas' },
  { id: 'unassigned', label: 'Sin asignar' },
];

const isUnassigned = (c) =>
  c.tripItemId === null ||
  c.tripItemId === undefined ||
  (typeof c.tripItemId === 'string' && c.tripItemId.trim() === '');

/**
 * Devuelve true si la contribución la eligió el donante en el formulario
 * (partida concreta, sin reasignación posterior). Esa "elección original"
 * se preserva para avisar al admin antes de sobrescribirla.
 *
 * Heurística: hay partida actual no nula y el campo `originalTripItemId`
 * NO existe en el doc. La función `reassignContributionTripItem` escribe
 * `originalTripItemId` solo la primera vez, así que su ausencia significa
 * "nadie ha tocado esto desde que se creó".
 */
const wasUserChosen = (c) =>
  !isUnassigned(c) && !('originalTripItemId' in c);

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
  const [reassigningId, setReassigningId] = useState(null);
  const [reassignValue, setReassignValue] = useState('');
  const [reassignError, setReassignError] = useState(null);
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

  // Solo partidas activas para el dropdown de reasignación. Las archivadas
  // siguen visibles en la lista (al renderizar un nombre por id) pero no
  // se pueden elegir como destino para no resucitarlas accidentalmente.
  const activeTripItems = tripItems.filter((t) => t.active !== false);

  const filtered = items.filter((c) => {
    if (filter === 'all') return true;
    if (filter === 'unassigned') return isUnassigned(c);
    return c.paymentStatus === filter;
  });

  const filterCount = (id) => {
    if (id === 'all') return items.length;
    if (id === 'unassigned') return items.filter(isUnassigned).length;
    return items.filter((c) => c.paymentStatus === id).length;
  };

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
   * Borrado de la aportación económica. Mensaje y foto del donante se
   * conservan en el muro. Para las pagadas se exige una segunda
   * confirmación con el importe en el texto.
   */
  const handleDelete = async (c) => {
    const isPaid = c.paymentStatus === 'paid';
    const amountText = c.amount && c.amount > 0 ? formatCurrency(c.amount) : 'sin importe';

    const confirmText =
      'Vas a eliminar esta aportación económica. El mensaje y la foto de esta persona se conservan en el muro. Esta acción no se puede deshacer.\n\n¿Continuar?';

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
    // Cierra el panel de reasignación si estaba abierto.
    setReassigningId(null);
    setReassignValue('');
    setReassignError(null);
    setEditingId(c.id);
    setEditValue(c.amount && c.amount > 0 ? String(c.amount) : '');
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
    setEditError(null);
  };

  const startReassign = (c) => {
    // Cierra el otro panel inline si estaba abierto.
    setEditingId(null);
    setEditValue('');
    setEditError(null);
    // Valor inicial del select: '' representa "sin asignar".
    setReassigningId(c.id);
    setReassignValue(c.tripItemId || '');
    setReassignError(null);
  };

  const cancelReassign = () => {
    setReassigningId(null);
    setReassignValue('');
    setReassignError(null);
  };

  const saveReassign = async (c) => {
    setReassignError(null);
    const oldId = c.tripItemId || null;
    const newId = reassignValue === '' ? null : reassignValue;

    if (oldId === newId) {
      cancelReassign();
      return;
    }

    const oldLabel = tripItemName(oldId);
    const newLabel = tripItemName(newId);
    const isPaid = c.paymentStatus === 'paid';
    const amount = c.amount && c.amount > 0 ? Number(c.amount) : 0;

    // Confirmación reforzada cuando la elección original fue del donante
    // y aún no se había reasignado: aviso explícito para que Gerry no la
    // sobrescriba por error.
    if (wasUserChosen(c)) {
      const ok = confirm(
        `Esta aportación la eligió el donante (${oldLabel}). Si la cambias se guardará "${oldLabel}" como partida original. ¿Continuar?`
      );
      if (!ok) return;
    }

    let confirmText;
    if (isPaid && amount > 0) {
      confirmText = `Vas a reasignar de "${oldLabel}" a "${newLabel}". Como está pagada, ${formatCurrency(amount)} se moverán entre los termómetros (el de "${oldLabel}" baja, el de "${newLabel}" sube). El total recaudado no cambia. ¿Confirmas?`;
    } else {
      confirmText = `Vas a reasignar de "${oldLabel}" a "${newLabel}". Como la aportación está pendiente, los termómetros no se tocan todavía. ¿Confirmas?`;
    }
    if (!confirm(confirmText)) return;

    setBusyId(c.id);
    try {
      await reassignContributionTripItem(c.id, newId);
      cancelReassign();
    } catch (err) {
      console.error(err);
      const msg =
        err?.code === 'server-ack-timeout'
          ? 'No se ha confirmado la escritura en el servidor. Comprueba la conexión y reintenta.'
          : 'No se pudo reasignar la partida. Inténtalo de nuevo.';
      setReassignError(msg);
    } finally {
      setBusyId(null);
    }
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
              <span className={styles.count}>{filterCount(f.id)}</span>
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <p className={styles.empty}>Cargando…</p>
      ) : filtered.length === 0 ? (
        <p className={styles.empty}>
          {filter === 'all'
            ? 'No hay aportaciones.'
            : filter === 'unassigned'
              ? 'No hay aportaciones sin asignar.'
              : `No hay aportaciones en estado "${filter}".`}
        </p>
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
                  {wasUserChosen(c) && (
                    <span
                      className={styles.userChosenBadge}
                      title="Partida elegida por el donante en el formulario. Avisa antes de cambiarla."
                    >
                      <UserCheck size={12} aria-hidden="true" />
                      Elegida por el donante
                    </span>
                  )}
                  {'originalTripItemId' in c && (
                    <span
                      className={styles.reassignedHint}
                      title={`Reasignada manualmente. Original: ${tripItemName(c.originalTripItemId)}`}
                    >
                      Reasignada · original: {tripItemName(c.originalTripItemId)}
                    </span>
                  )}
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
                {reassigningId === c.id ? (
                  <div className={styles.editBox}>
                    <label className={styles.editLabel}>
                      Nueva partida
                      <select
                        className={styles.editSelect}
                        value={reassignValue}
                        onChange={(e) => setReassignValue(e.target.value)}
                        autoFocus
                      >
                        <option value="">Sin asignar · fondo general</option>
                        {activeTripItems.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    {wasUserChosen(c) && (
                      <p className={styles.editWarning}>
                        El donante eligió esta partida. Si la cambias se
                        guardará como partida original para poder revisarla
                        después.
                      </p>
                    )}
                    {reassignError && <p className={styles.editError}>{reassignError}</p>}
                    <div className={styles.editActions}>
                      <button
                        type="button"
                        className="btn"
                        disabled={busyId === c.id}
                        onClick={() => saveReassign(c)}
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={busyId === c.id}
                        onClick={cancelReassign}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : editingId === c.id ? (
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
                      <span className={styles.amount}>
                        {c.amount ? formatCurrency(c.amount) : '—'}
                      </span>
                    </div>
                    {c.amountPrivate && c.amount > 0 && (
                      <span
                        className={styles.privateBadge}
                        title="Privado: el donante prefiere que MªÁngeles no vea el importe"
                      >
                        <Lock size={12} aria-hidden="true" />
                        Importe privado
                      </span>
                    )}
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
                        className={styles.editBtn}
                        disabled={busyId === c.id}
                        onClick={() => startReassign(c)}
                      >
                        Cambiar partida
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
