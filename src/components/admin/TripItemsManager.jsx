import { useEffect, useMemo, useRef, useState } from 'react';
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
import { GripVertical, Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronRight, Archive, RotateCcw } from 'lucide-react';
import { useTripItems } from '../../hooks/useTripItems.js';
import { useSections } from '../../hooks/useSections.js';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth.jsx';
import { auth, db } from '../../firebase/config.js';
import {
  createTripItem,
  updateTripItem,
  archiveTripItem,
  unarchiveTripItem,
  hardDeleteTripItem,
  batchUpdateOrders,
} from '../../firebase/tripItems.js';
import {
  createSection,
  renameSection,
  deleteSectionAndItems,
  deleteSectionMoveToUnassigned,
  batchUpdateSectionOrders,
  seedSections,
} from '../../firebase/sections.js';
import { formatCurrency, percent } from '../../utils/formatCurrency.js';
import { CITY_OPTIONS } from '../../content/tripCities.js';
import DeleteSectionModal from './DeleteSectionModal.jsx';
import UnassignedSidebar from './UnassignedSidebar.jsx';
import styles from './TripItemsManager.module.css';

const blank = { name: '', description: '', targetAmount: '', order: 99, city: '' };

export default function TripItemsManager() {
  const { items } = useTripItems({ onlyActive: false });
  const { sections, loading: sectionsLoading } = useSections();
  const { user } = useAuth();

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Estado de gestión de secciones
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [activeDragId, setActiveDragId] = useState(null);

  // Sección colapsable de archivadas
  const [archivedOpen, setArchivedOpen] = useState(false);

  // Modal de eliminación permanente (hard delete) de partidas
  const [hardDeleteTarget, setHardDeleteTarget] = useState(null);

  const reportError = async (label, err) => {
    const u = auth.currentUser;
    console.error(`[admin partidas] ${label}:`, err);
    console.error('[admin partidas] auth state:', {
      uid: u?.uid,
      email: u?.email,
      emailVerified: u?.emailVerified,
    });
    // Loguea los claims reales del ID token. Las reglas evalúan
    // request.auth.token.email — que viene de aquí, no de currentUser.email.
    if (u) {
      try {
        const result = await u.getIdTokenResult();
        console.error('[admin partidas] token claims:', result.claims);
        console.error('[admin partidas] token issued at:', result.issuedAtTime);
      } catch (e) {
        console.error('[admin partidas] no se pudieron leer claims del token:', e);
      }
    }
    const code = err?.code || err?.message || 'fallo desconocido';
    const who = u?.email
      ? `email Firebase = ${u.email}`
      : 'sin sesión Firebase';
    setErrorMsg(`${label}: ${code} (${who})`);
  };

  // Antes de cualquier escritura, fuerza un refresh del token de auth
  // para evitar timing en el que Firestore aún no ha visto la sesión.
  const ensureFreshToken = async () => {
    const u = auth.currentUser;
    if (!u) throw new Error('No hay sesión Firebase activa');
    await u.getIdToken(true);
  };

  // Bootstrap: si la colección sections está vacía, sembrar con CITY_OPTIONS.
  // Espera a que `user` (de useAuth) esté listo y el token refrescado.
  const seededRef = useRef(false);
  useEffect(() => {
    if (!user) return;
    if (sectionsLoading || seededRef.current) return;
    if (sections.length > 0) return;
    if (items.length === 0) return;
    seededRef.current = true;
    (async () => {
      try {
        await ensureFreshToken();
        await seedSections(CITY_OPTIONS);
      } catch (err) {
        seededRef.current = false;
        reportError('Sembrar secciones automático', err);
      }
    })();
  }, [user, sectionsLoading, sections.length, items.length]);

  const seedSectionsManually = async () => {
    setErrorMsg(null);
    setBusy(true);
    try {
      await ensureFreshToken();
      await seedSections(CITY_OPTIONS);
    } catch (err) {
      reportError('Sembrar secciones', err);
    } finally {
      setBusy(false);
    }
  };

  // Particionamos: activos (UI principal) vs archivados (sección aparte).
  const activeItems = useMemo(() => items.filter((it) => it.active !== false), [items]);
  const archivedItems = useMemo(() => items.filter((it) => it.active === false), [items]);

  // Items activos agrupados por nombre de sección + bucket "Sin asignar"
  const itemsBySection = useMemo(() => {
    const map = {};
    for (const s of sections) map[s.name] = [];
    map.__unassigned__ = [];
    const sectionNames = new Set(sections.map((s) => s.name));
    for (const it of activeItems) {
      if (it.city && sectionNames.has(it.city)) map[it.city].push(it);
      else map.__unassigned__.push(it);
    }
    const sortByOrder = (a, b) => (a.order || 99) - (b.order || 99);
    for (const k of Object.keys(map)) map[k].sort(sortByOrder);
    return map;
  }, [sections, activeItems]);

  // ---------- Edición de partidas ----------
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
      city: it.city || '',
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm(blank);
  };

  const saveItem = async () => {
    if (!form.name.trim() || !form.targetAmount) return;

    let nextOrder = Number(form.order) || 99;
    if (editing && editing !== 'new') {
      const original = items.find((it) => it.id === editing);
      const newCity = form.city || null;
      const oldCity = original?.city || null;
      if (original && newCity !== oldCity) {
        const maxOrder = items.reduce((m, it) => Math.max(m, Number(it.order) || 0), 0);
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
      cancelEdit();
    } finally {
      setBusy(false);
    }
  };

  // Acción primaria: archivar (soft delete). La partida desaparece de la
  // UI pública y de la lista activa de admin, pero las contribuciones
  // que la referencian siguen vinculadas — nada se rompe.
  const archiveItem = async (id, name) => {
    if (!confirm(`¿Archivar la partida "${name}"?\n\nDejará de aparecer en la web pública. Las aportaciones vinculadas se mantienen intactas. Puedes reactivarla cuando quieras.`)) return;
    setErrorMsg(null);
    setBusy(true);
    try {
      await archiveTripItem(id);
    } catch (err) {
      reportError('Archivar partida', err);
    } finally {
      setBusy(false);
    }
  };

  const unarchiveItem = async (id) => {
    setErrorMsg(null);
    setBusy(true);
    try {
      await unarchiveTripItem(id);
    } catch (err) {
      reportError('Reactivar partida', err);
    } finally {
      setBusy(false);
    }
  };

  // Acción destructiva: abre modal de confirmación con conteo de
  // contribuciones que serían reasignadas a "fondo general".
  const startHardDelete = (item) => {
    setHardDeleteTarget(item);
  };

  const confirmHardDelete = async () => {
    if (!hardDeleteTarget) return;
    setErrorMsg(null);
    setBusy(true);
    try {
      await hardDeleteTripItem(hardDeleteTarget.id, { reassignToNull: true });
      setHardDeleteTarget(null);
    } catch (err) {
      reportError('Eliminar partida permanentemente', err);
    } finally {
      setBusy(false);
    }
  };

  // ---------- Reorder de items dentro de una sección ----------
  const handleReorderItems = async (cityKey, oldIndex, newIndex) => {
    const group = itemsBySection[cityKey];
    if (!group || oldIndex === newIndex) return;
    const reordered = arrayMove(group, oldIndex, newIndex);
    const orderPool = group.map((it) => Number(it.order) || 99);
    const updates = reordered.map((it, i) => ({ id: it.id, order: orderPool[i] }));
    await batchUpdateOrders(updates);
  };

  // ---------- Gestión de secciones ----------
  const handleAddSection = async () => {
    setErrorMsg(null);
    setBusy(true);
    try {
      const maxOrder = sections.reduce((m, s) => Math.max(m, Number(s.order) || 0), 0);
      const baseName = 'Nueva sección';
      let n = 1;
      let name = baseName;
      const existing = new Set(sections.map((s) => s.name));
      while (existing.has(name)) {
        n += 1;
        name = `${baseName} ${n}`;
      }
      const id = await createSection({ name, order: maxOrder + 1 });
      setRenamingId(id);
      setRenameValue(name);
    } catch (err) {
      reportError('Crear sección', err);
    } finally {
      setBusy(false);
    }
  };

  const startRename = (section) => {
    setRenamingId(section.id);
    setRenameValue(section.name);
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue('');
  };

  const saveRename = async (section) => {
    const next = renameValue.trim();
    if (!next || next === section.name) {
      cancelRename();
      return;
    }
    setErrorMsg(null);
    setBusy(true);
    try {
      await renameSection(section.id, section.name, next);
      cancelRename();
    } catch (err) {
      reportError('Renombrar sección', err);
    } finally {
      setBusy(false);
    }
  };

  const startDeleteSection = (section) => {
    setPendingDelete(section);
  };

  const handleDeleteAll = async () => {
    if (!pendingDelete) return;
    setErrorMsg(null);
    setBusy(true);
    try {
      await deleteSectionAndItems(pendingDelete.id, pendingDelete.name);
      setPendingDelete(null);
    } catch (err) {
      reportError('Eliminar sección', err);
    } finally {
      setBusy(false);
    }
  };

  const handleMoveToUnassigned = async () => {
    if (!pendingDelete) return;
    setErrorMsg(null);
    setBusy(true);
    try {
      await deleteSectionMoveToUnassigned(pendingDelete.id, pendingDelete.name);
      setPendingDelete(null);
    } catch (err) {
      reportError('Mover items a Sin asignar', err);
    } finally {
      setBusy(false);
    }
  };

  // ---------- Drag handlers (top level) ----------
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const isSectionId = (id) => sections.some((s) => s.id === id);
  const isItemId = (id) => items.some((it) => it.id === id);

  const handleDragStart = (event) => {
    setActiveDragId(event.active.id);
  };

  const handleDragCancel = () => setActiveDragId(null);

  const handleDragEnd = async (event) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;

    // Reorder de SECCIONES
    if (isSectionId(active.id)) {
      if (active.id === over.id || !isSectionId(over.id)) return;
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      const reordered = arrayMove(sections, oldIndex, newIndex);
      const orderPool = sections.map((s) => Number(s.order) || 99);
      const updates = reordered.map((s, i) => ({ id: s.id, order: orderPool[i] }));
      await batchUpdateSectionOrders(updates);
      return;
    }

    // Reorder de ITEMS dentro de la misma sección
    if (isItemId(active.id) && isItemId(over.id)) {
      const activeItem = items.find((it) => it.id === active.id);
      const overItem = items.find((it) => it.id === over.id);
      if (!activeItem || !overItem) return;
      const activeKey = activeItem.city || '__unassigned__';
      const overKey = overItem.city || '__unassigned__';
      if (activeKey !== overKey) return; // cross-section por DnD se maneja con el dropdown
      const group = itemsBySection[activeKey];
      const oldIndex = group.findIndex((it) => it.id === active.id);
      const newIndex = group.findIndex((it) => it.id === over.id);
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
      const reordered = arrayMove(group, oldIndex, newIndex);
      const orderPool = group.map((it) => Number(it.order) || 99);
      const updates = reordered.map((it, i) => ({ id: it.id, order: orderPool[i] }));
      await batchUpdateOrders(updates);
    }
  };

  const sectionBeingDragged = activeDragId && isSectionId(activeDragId) ? activeDragId : null;

  // ---------- Form renderer ----------
  const renderForm = (mode) => (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        saveItem();
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
          {sections.map((s) => (
            <option key={s.id} value={s.name}>{s.name}</option>
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
        <button type="button" className="btn-secondary" onClick={cancelEdit} disabled={busy}>
          Cancelar
        </button>
        <button type="submit" className="btn" disabled={busy}>
          {busy ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  );

  // Si el item en edición está en "Sin asignar" (no hay fila inline donde
  // mostrar el form), renderizamos el formulario en la parte superior.
  const editingItem =
    editing && editing !== 'new' ? items.find((it) => it.id === editing) : null;
  const sectionNamesSet = new Set(sections.map((s) => s.name));
  const editingIsUnassigned =
    editingItem && (!editingItem.city || !sectionNamesSet.has(editingItem.city));

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h2 className={styles.heading}>Partidas del viaje ({items.length})</h2>
        <div className={styles.headerActions}>
          {!editing && (
            <button type="button" className="btn-secondary" onClick={handleAddSection} disabled={busy}>
              <Plus size={14} aria-hidden="true" /> Nueva sección
            </button>
          )}
          {!editing && (
            <button type="button" className="btn" onClick={startNew}>
              + Nueva partida
            </button>
          )}
        </div>
      </header>

      {errorMsg && (
        <div className={styles.errorBanner} role="alert">
          <span>⚠️ {errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)} aria-label="Cerrar">×</button>
        </div>
      )}

      {editing === 'new' && renderForm('new')}
      {editingIsUnassigned && renderForm('edit')}

      {sections.length === 0 ? (
        <div className={styles.empty}>
          <p>
            {sectionsLoading
              ? 'Cargando secciones…'
              : 'No hay secciones. Crea la primera o siembra las 6 ciudades por defecto.'}
          </p>
          {!sectionsLoading && (
            <button
              type="button"
              className="btn-secondary"
              onClick={seedSectionsManually}
              disabled={busy}
              style={{ marginTop: '12px' }}
            >
              {busy ? 'Sembrando…' : 'Sembrar secciones iniciales'}
            </button>
          )}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className={styles.groups}>
              {sections.map((section) => (
                <SortableSectionBlock
                  key={section.id}
                  section={section}
                  items={itemsBySection[section.name] || []}
                  collapsed={Boolean(sectionBeingDragged) && sectionBeingDragged !== section.id}
                  busy={busy}
                  editing={editing}
                  renamingId={renamingId}
                  renameValue={renameValue}
                  setRenameValue={setRenameValue}
                  onStartRename={startRename}
                  onCancelRename={cancelRename}
                  onSaveRename={saveRename}
                  onDeleteSection={startDeleteSection}
                  onReorderItems={handleReorderItems}
                  onEdit={startEdit}
                  onCancelEdit={cancelEdit}
                  onArchive={archiveItem}
                  renderForm={renderForm}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <UnassignedSidebar
        items={itemsBySection.__unassigned__ || []}
        onAssign={(it) => startEdit(it)}
      />

      {archivedItems.length > 0 && (
        <section className={styles.archivedPanel}>
          <button
            type="button"
            className={styles.archivedHeader}
            onClick={() => setArchivedOpen((v) => !v)}
            aria-expanded={archivedOpen}
          >
            {archivedOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <Archive size={16} aria-hidden="true" />
            <span>Partidas archivadas</span>
            <span className={styles.archivedCount}>{archivedItems.length}</span>
          </button>

          {archivedOpen && (
            <ul className={styles.archivedList}>
              {archivedItems.map((it) => (
                <li key={it.id} className={styles.archivedRow}>
                  <div className={styles.archivedMain}>
                    <h4 className={styles.archivedName}>{it.name}</h4>
                    <p className={styles.archivedMeta}>
                      {it.city || 'Sin asignar'}
                      <span> · </span>
                      {formatCurrency(it.raisedAmount || 0)} / {formatCurrency(it.targetAmount)}
                      <span> · </span>
                      {it.contributorCount || 0}{' '}
                      {it.contributorCount === 1 ? 'persona' : 'personas'}
                    </p>
                  </div>
                  <div className={styles.archivedActions}>
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={busy}
                      onClick={() => unarchiveItem(it.id)}
                    >
                      <RotateCcw size={14} aria-hidden="true" /> Reactivar
                    </button>
                    <button
                      type="button"
                      className={styles.dangerBtn}
                      disabled={busy}
                      onClick={() => startHardDelete(it)}
                    >
                      <Trash2 size={14} aria-hidden="true" /> Eliminar permanentemente
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {pendingDelete && (
        <DeleteSectionModal
          section={pendingDelete}
          itemCount={(itemsBySection[pendingDelete.name] || []).length}
          busy={busy}
          onCancel={() => setPendingDelete(null)}
          onDeleteAll={handleDeleteAll}
          onMoveToUnassigned={handleMoveToUnassigned}
        />
      )}

      {hardDeleteTarget && (
        <HardDeleteItemModal
          item={hardDeleteTarget}
          busy={busy}
          onCancel={() => setHardDeleteTarget(null)}
          onConfirm={confirmHardDelete}
        />
      )}
    </section>
  );
}

// ============================================================
// Sortable section block
// ============================================================
function SortableSectionBlock({
  section,
  items,
  collapsed,
  busy,
  editing,
  renamingId,
  renameValue,
  setRenameValue,
  onStartRename,
  onCancelRename,
  onSaveRename,
  onDeleteSection,
  onReorderItems,
  onEdit,
  onCancelEdit,
  onArchive,
  renderForm,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 'auto',
    opacity: isDragging ? 0.95 : 1,
  };
  const isRenaming = renamingId === section.id;

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={`${styles.cityGroup} ${isDragging ? styles.cityGroupDragging : ''} ${collapsed ? styles.cityGroupCollapsed : ''}`}
    >
      <header className={styles.cityGroupHeader}>
        <button
          type="button"
          className={styles.sectionDragHandle}
          aria-label="Arrastrar sección"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={18} aria-hidden="true" />
        </button>

        {isRenaming ? (
          <form
            className={styles.renameForm}
            onSubmit={(e) => {
              e.preventDefault();
              onSaveRename(section);
            }}
          >
            <input
              type="text"
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className={styles.renameInput}
            />
            <button type="submit" className={styles.iconBtn} aria-label="Guardar" disabled={busy}>
              <Check size={16} />
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Cancelar"
              onClick={onCancelRename}
              disabled={busy}
            >
              <X size={16} />
            </button>
          </form>
        ) : (
          <h3 className={styles.cityGroupTitle}>
            <span>{section.name}</span>
            <span className={styles.cityGroupCount}>{items.length}</span>
          </h3>
        )}

        {!isRenaming && (
          <div className={styles.sectionActions}>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Renombrar sección"
              onClick={() => onStartRename(section)}
              disabled={busy}
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              className={styles.iconBtnDanger}
              aria-label="Eliminar sección"
              onClick={() => onDeleteSection(section)}
              disabled={busy}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </header>

      {!collapsed && (
        <SectionItemsContext
          cityKey={section.name}
          items={items}
          editing={editing}
          busy={busy}
          onReorderItems={onReorderItems}
          onEdit={onEdit}
          onCancelEdit={onCancelEdit}
          onArchive={onArchive}
          renderForm={renderForm}
        />
      )}
    </section>
  );
}

// ============================================================
// Sortable items within a section
// ============================================================
function SectionItemsContext({
  items,
  editing,
  busy,
  onEdit,
  onCancelEdit,
  onArchive,
  renderForm,
}) {
  // El ordering de items vive bajo el DnDContext de arriba: aquí solo
  // declaramos un SortableContext anidado para que dnd-kit conozca este
  // pool de ids como ordenable.
  return (
    <SortableContext items={items.map((it) => it.id)} strategy={verticalListSortingStrategy}>
      <ul className={styles.list}>
        {items.length === 0 && (
          <li className={styles.emptyRow}>Esta sección está vacía.</li>
        )}
        {items.map((it) => (
          <SortableRow
            key={it.id}
            item={it}
            editing={editing}
            busy={busy}
            onEdit={onEdit}
            onCancelEdit={onCancelEdit}
            onArchive={onArchive}
            renderForm={renderForm}
          />
        ))}
      </ul>
    </SortableContext>
  );
}

// ============================================================
// Item row (existente)
// ============================================================
function SortableRow({ item, editing, busy, onEdit, onCancelEdit, onArchive, renderForm }) {
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
      <div className={`${styles.row} ${isDragging ? styles.rowDragging : ''}`}>
        <button
          type="button"
          className={styles.dragHandle}
          aria-label="Arrastrar para reordenar"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} aria-hidden="true" />
        </button>
        <div className={styles.rowMain}>
          <div className={styles.rowHead}>
            <span className={styles.order}>#{item.order}</span>
            <h4 className={styles.name}>{item.name}</h4>
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
          <button
            type="button"
            className={styles.archiveBtn}
            disabled={busy}
            onClick={() => onArchive(item.id, item.name)}
            title="Archivar: deja de mostrarse en la web pública pero conserva las aportaciones."
          >
            <Archive size={14} aria-hidden="true" /> Archivar
          </button>
        </div>
      </div>

      {isEditing && <div className={styles.inlineForm}>{renderForm('edit')}</div>}
    </li>
  );
}

// ============================================================
// Modal de eliminación permanente de partida
// ============================================================
function HardDeleteItemModal({ item, busy, onCancel, onConfirm }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && !busy && onCancel();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [busy, onCancel]);

  // Conteo real consultando messageWall (mirror público que se reasignará al
  // fondo general). El field item.contributorCount es aproximado (solo se
  // incrementa al marcar pagada), no sirve como verdad para una decisión
  // destructiva. null = cargando, number = listo, 'error' = falló.
  const [realCount, setRealCount] = useState(null);
  const fallbackCount = item.contributorCount || 0;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(
          query(collection(db, 'messageWall'), where('tripItemId', '==', item.id))
        );
        if (!cancelled) setRealCount(snap.size);
      } catch (err) {
        console.warn('HardDeleteItemModal count query failed', err?.code || err);
        if (!cancelled) setRealCount('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [item.id]);

  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true" onClick={busy ? undefined : onCancel}>
      <div className={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>Eliminar permanentemente &laquo;{item.name}&raquo;</h3>
        <p className={styles.modalBody}>
          Esta acción borra la partida de la base de datos y no se puede deshacer.
          {realCount === null ? (
            <> Calculando aportaciones vinculadas&hellip;</>
          ) : realCount === 'error' ? (
            <>
              {' '}No hemos podido verificar el conteo en este momento; aparecen registradas aproximadamente <strong>{fallbackCount}</strong>{' '}
              {fallbackCount === 1 ? 'aportación' : 'aportaciones'}. Si continúas, se reasignarán al fondo general antes de borrar.
            </>
          ) : realCount > 0 ? (
            <>
              {' '}Hay <strong>{realCount}</strong>{' '}
              {realCount === 1 ? 'persona vinculada' : 'personas vinculadas'} a esta partida. Sus aportaciones se reasignarán al fondo general (sin partida específica) antes de borrar.
            </>
          ) : (
            <> No hay aportaciones vinculadas, así que no se reasignará nada.</>
          )}
        </p>
        <p className={styles.modalHint}>
          Si solo quieres ocultarla de la web pública, usa <strong>Archivar</strong>: es reversible y conserva los datos.
        </p>
        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.modalBtnCancel}
            onClick={onCancel}
            disabled={busy}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.modalBtnDanger}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Eliminando…' : 'Eliminar permanentemente'}
          </button>
        </div>
      </div>
    </div>
  );
}
