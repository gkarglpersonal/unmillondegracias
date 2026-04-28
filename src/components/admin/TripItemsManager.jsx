import { useState } from 'react';
import { useTripItems } from '../../hooks/useTripItems.js';
import { createTripItem, updateTripItem, deleteTripItem } from '../../firebase/tripItems.js';
import { formatCurrency, percent } from '../../utils/formatCurrency.js';
import styles from './TripItemsManager.module.css';

const blank = { name: '', description: '', targetAmount: '', order: 99 };

export default function TripItemsManager() {
  const { items, loading } = useTripItems({ onlyActive: false });
  const [editing, setEditing] = useState(null); // null | 'new' | itemId
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);

  const startNew = () => { setEditing('new'); setForm({ ...blank, order: items.length + 1 }); };
  const startEdit = (it) => {
    setEditing(it.id);
    setForm({
      name: it.name,
      description: it.description,
      targetAmount: String(it.targetAmount),
      order: it.order,
    });
  };
  const cancel = () => { setEditing(null); setForm(blank); };

  const save = async () => {
    if (!form.name.trim() || !form.targetAmount) return;
    const data = {
      name: form.name.trim(),
      description: form.description.trim(),
      targetAmount: Number(form.targetAmount),
      order: Number(form.order) || 99,
    };
    setBusy(true);
    try {
      if (editing === 'new') await createTripItem(data);
      else await updateTripItem(editing, data);
      cancel();
    } finally { setBusy(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`¿Borrar la partida "${name}"? Esta acción no se puede deshacer.`)) return;
    setBusy(true);
    try { await deleteTripItem(id); } finally { setBusy(false); }
  };

  const handleToggleActive = async (it) => {
    setBusy(true);
    try { await updateTripItem(it.id, { active: !it.active }); } finally { setBusy(false); }
  };

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h2 className={styles.heading}>Partidas del viaje ({items.length})</h2>
        {!editing && (
          <button type="button" className="btn" onClick={startNew}>
            + Nueva partida
          </button>
        )}
      </header>

      {editing && (
        <form
          className={styles.form}
          onSubmit={(e) => { e.preventDefault(); save(); }}
        >
          <h3 className={styles.formTitle}>
            {editing === 'new' ? 'Nueva partida' : 'Editar partida'}
          </h3>
          <label className={styles.field}>
            <span className={styles.label}>Nombre *</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Descripción</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <div className={styles.row2}>
            <label className={styles.field}>
              <span className={styles.label}>Importe objetivo (€) *</span>
              <input
                type="number"
                min="1"
                step="1"
                value={form.targetAmount}
                onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                required
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Orden</span>
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: e.target.value })}
              />
            </label>
          </div>
          <div className={styles.formActions}>
            <button type="button" className="btn-secondary" onClick={cancel} disabled={busy}>
              Cancelar
            </button>
            <button type="submit" className="btn" disabled={busy}>
              {busy ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className={styles.empty}>Cargando…</p>
      ) : items.length === 0 ? (
        <p className={styles.empty}>No hay partidas. Crea la primera.</p>
      ) : (
        <ul className={styles.list}>
          {items.map((it) => (
            <li key={it.id} className={`${styles.row} ${!it.active ? styles.rowInactive : ''}`}>
              <div className={styles.rowMain}>
                <div className={styles.rowHead}>
                  <span className={styles.order}>#{it.order}</span>
                  <h4 className={styles.name}>{it.name}</h4>
                  {!it.active && <span className={styles.inactiveBadge}>Inactiva</span>}
                </div>
                <p className={styles.description}>{it.description}</p>
                <div className={styles.progress}>
                  <span>{formatCurrency(it.raisedAmount || 0)} / {formatCurrency(it.targetAmount)}</span>
                  <span>·</span>
                  <span>{percent(it.raisedAmount || 0, it.targetAmount)}%</span>
                  <span>·</span>
                  <span>{it.contributorCount || 0} {it.contributorCount === 1 ? 'persona' : 'personas'}</span>
                </div>
              </div>
              <div className={styles.actions}>
                <button type="button" className="btn-secondary" disabled={busy} onClick={() => startEdit(it)}>
                  Editar
                </button>
                <button type="button" className="btn-secondary" disabled={busy} onClick={() => handleToggleActive(it)}>
                  {it.active ? 'Desactivar' : 'Activar'}
                </button>
                <button type="button" className={styles.deleteBtn} disabled={busy} onClick={() => handleDelete(it.id, it.name)}>
                  Borrar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
