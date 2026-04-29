import { useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useTripItems } from '../../hooks/useTripItems.js';
import {
  createTripItem,
  updateTripItem,
  deleteTripItem,
  batchUpdateOrders,
} from '../../firebase/tripItems.js';
import { formatCurrency, percent } from '../../utils/formatCurrency.js';
import { CITY_OPTIONS, resolveItemCity } from '../../content/tripCities.js';
import styles from './TripItemsManager.module.css';

const blank = { name: '', description: '', targetAmount: '', order: 99, city: '' };

const UNASSIGNED = '__unassigned__';

export default function TripItemsManager() {
  const { items, loading } = useTripItems({ onlyActive: false });
  // editing puede ser: null | 'new' | itemId
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);

  // Agrupa items por ciudad respetando el orden de CITY_OPTIONS.
  const grouped = useMemo(() => {
    const groups = {};
    for (const city of CITY_OPTIONS) groups[city] = [];
    groups[UNASSIGNED] = [];
    for (const it of items) {
      const city = resolveItemCity(it);
      if (city && groups[city]) groups[city].push(it);
      else groups[UNASSIGNED].push(it);
    }
    const sortByOrder = (a, b) => (a.order || 99) - (b.order || 99);
    for (const k of Object.keys(groups)) groups[k].sort(sortByOrder);
    return groups;
  }, [items]);

  const startNew = () => {
    setEditing('new');
    setForm({ ...blank, order: items.length + 1 });
  };

  const startEdit = (it) => {
    setEditing(it.id);
    setForm({
      name: it.name,
      description: it.description,
      targetAmount: String(it.targetAmount),
      order: it.order,
      city: it.city || resolveItemCity(it) || '',
    });
  };

  const cancel = () => {
    setEditing(null);
    setForm(blank);
  };

  const save = async () => {
    if (!form.name.trim() || !form.targetAmount) return;

    // Si se cambió la ciudad de un item existente, lo mandamos al final
    // del nuevo grupo asignándole order = max(global) + 1.
    let nextOrder = Number(form.order) || 99;
    if (editing && editing !== 'new') {
      const original = items.find((it) => it.id === editing);
      const newCity = form.city || null;
      const oldCity = original?.city || resolveItemCity(original);
      if (original && newCity !== oldCity) {
        const maxOrder = items.reduce(
          (m, it) => Math.max(m, Number(it.order) || 0),
          0
        );
        nextOrder = maxOrder + 1;
      }
    }

    const data = {
      name: form.name.trim(),
      description: form.description.trim(),
      targetAmount: Number(form.targetAmount),
      order: nextOrder,
      city: form.city || null,
    };

    setBusy(true);
    try {
      if (editing === 'new') await createTripItem(data);
      else await updateTripItem(editing, data);
      cancel();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`¿Borrar la partida "${name}"? Esta acción no se puede deshacer.`)) return;
    setBusy(true);
    try {
      await deleteTripItem(id);
    } finally {
      setBusy(false);
    }
  };

  const handleToggleActive = async (it) => {
    setBusy(true);
    try {
      await updateTripItem(it.id, { active: !it.active });
    } finally {
      setBusy(false);
    }
  };

  // Reordena un grupo: reasigna los `order` actuales (su pool) en la
  // nueva secuencia. Esto evita colisionar con los `order` de otras ciudades.
  const handleReorder = async (cityKey, oldIndex, newIndex) => {
    const group = grouped[cityKey];
    if (!group || oldIndex === newIndex) return;
    const reordered = arrayMove(group, oldIndex, newIndex);
    const orderPool = group.map((it) => Number(it.order) || 99);
    const updates = reordered.map((it, i) => ({ id: it.id, order: orderPool[i] }));
    await batchUpdateOrders(updates);
  };

  const renderForm = (mode) => (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <h3 className={styles.formTitle}>
        {mode === 'new' ? 'Nueva partida' : 'Editar partida'}
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
      <label className={styles.field}>
        <span className={styles.label}>Ciudad / Sección</span>
        <select
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
        >
          <option value="">— Sin asignar —</option>
          {CITY_OPTIONS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
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
  );

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

      {editing === 'new' && renderForm('new')}

      {loading ? (
        <p className={styles.empty}>Cargando…</p>
      ) : items.length === 0 ? (
        <p className={styles.empty}>No hay partidas. Crea la primera.</p>
      ) : (
        <div className={styles.groups}>
          {[...CITY_OPTIONS, UNASSIGNED].map((cityKey) => {
            const group = grouped[cityKey];
            if (!group || group.length === 0) return null;
            const label =
              cityKey === UNASSIGNED ? 'Sin ciudad asignada' : cityKey;
            return (
              <CityGroup
                key={cityKey}
                cityKey={cityKey}
                label={label}
                items={group}
                editing={editing}
                busy={busy}
                onReorder={handleReorder}
                onEdit={startEdit}
                onCancelEdit={cancel}
                onToggleActive={handleToggleActive}
                onDelete={handleDelete}
                renderForm={renderForm}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

function CityGroup({
  cityKey,
  label,
  items,
  editing,
  busy,
  onReorder,
  onEdit,
  onCancelEdit,
  onToggleActive,
  onDelete,
  renderForm,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((it) => it.id === active.id);
    const newIndex = items.findIndex((it) => it.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(cityKey, oldIndex, newIndex);
  };

  return (
    <section className={styles.cityGroup}>
      <h3 className={styles.cityGroupTitle}>
        <span>{label}</span>
        <span className={styles.cityGroupCount}>{items.length}</span>
      </h3>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((it) => it.id)} strategy={verticalListSortingStrategy}>
          <ul className={styles.list}>
            {items.map((it) => (
              <SortableRow
                key={it.id}
                item={it}
                editing={editing}
                busy={busy}
                onEdit={onEdit}
                onCancelEdit={onCancelEdit}
                onToggleActive={onToggleActive}
                onDelete={onDelete}
                renderForm={renderForm}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </section>
  );
}

function SortableRow({
  item,
  editing,
  busy,
  onEdit,
  onCancelEdit,
  onToggleActive,
  onDelete,
  renderForm,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.92 : 1,
  };
  const isEditing = editing === item.id;

  return (
    <li ref={setNodeRef} style={style} className={styles.rowWrap}>
      <div className={`${styles.row} ${!item.active ? styles.rowInactive : ''} ${isDragging ? styles.rowDragging : ''}`}>
        <button
          type="button"
          className={styles.dragHandle}
          aria-label="Arrastrar para reordenar"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={18} aria-hidden="true" />
        </button>
        <div className={styles.rowMain}>
          <div className={styles.rowHead}>
            <span className={styles.order}>#{item.order}</span>
            <h4 className={styles.name}>{item.name}</h4>
            {item.city && <span className={styles.cityBadge}>{item.city}</span>}
            {!item.active && <span className={styles.inactiveBadge}>Inactiva</span>}
          </div>
          <p className={styles.description}>{item.description}</p>
          <div className={styles.progress}>
            <span>{formatCurrency(item.raisedAmount || 0)} / {formatCurrency(item.targetAmount)}</span>
            <span>·</span>
            <span>{percent(item.raisedAmount || 0, item.targetAmount)}%</span>
            <span>·</span>
            <span>{item.contributorCount || 0} {item.contributorCount === 1 ? 'persona' : 'personas'}</span>
          </div>
        </div>
        <div className={styles.actions}>
          {isEditing ? (
            <button type="button" className="btn-secondary" onClick={onCancelEdit} disabled={busy}>
              Cerrar
            </button>
          ) : (
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => onEdit(item)}>
              Editar
            </button>
          )}
          <button type="button" className="btn-secondary" disabled={busy} onClick={() => onToggleActive(item)}>
            {item.active ? 'Desactivar' : 'Activar'}
          </button>
          <button type="button" className={styles.deleteBtn} disabled={busy} onClick={() => onDelete(item.id, item.name)}>
            Borrar
          </button>
        </div>
      </div>

      {isEditing && <div className={styles.inlineForm}>{renderForm('edit')}</div>}
    </li>
  );
}
