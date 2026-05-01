import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  where,
} from 'firebase/firestore';
import { db } from './config.js';

const COL = 'tripItems';
const MESSAGE_WALL_COL = 'messageWall';
const CONTRIBUTIONS_COL = 'contributions';

// Firestore limita un writeBatch a 500 operaciones. Dejamos margen.
const BATCH_LIMIT = 450;

function onListenerError(err) {
  if (err?.code !== 'permission-denied') {
    console.warn('tripItems listener:', err?.code || err?.message);
  }
}

export function subscribeTripItems(callback, { onlyActive = true } = {}) {
  // Solo orderBy: Firestore lo auto-indexa. Si añadimos `where active==true`
  // junto con orderBy('order'), Firestore exige un índice compuesto que
  // no merece la pena declarar para 25 documentos. Filtramos en cliente.
  const q = query(collection(db, COL), orderBy('order', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(onlyActive ? items.filter((i) => i.active !== false) : items);
    },
    onListenerError
  );
}

export async function fetchTripItems({ onlyActive = true } = {}) {
  const snap = await getDocs(query(collection(db, COL), orderBy('order', 'asc')));
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return onlyActive ? items.filter((i) => i.active !== false) : items;
}

/**
 * Equivalente puntual a `fetchTripItems`, expuesto como `listTripItems`
 * por simetría con el contrato acordado: nombre más explícito y opción
 * `includeArchived` para distinguir UI pública vs admin.
 */
export async function listTripItems({ includeArchived = false } = {}) {
  return fetchTripItems({ onlyActive: !includeArchived });
}

export async function createTripItem(data) {
  const id = data.id || doc(collection(db, COL)).id;
  await setDoc(doc(db, COL, id), {
    name: data.name,
    description: data.description,
    targetAmount: Number(data.targetAmount),
    raisedAmount: 0,
    contributorCount: 0,
    order: Number(data.order || 99),
    city: data.city || null,
    active: true,
    createdAt: serverTimestamp(),
  });
  return id;
}

export async function updateTripItem(id, patch) {
  await updateDoc(doc(db, COL, id), patch);
}

/**
 * Soft delete: marca la partida como `active: false`.
 * La partida desaparece de la UI pública (filtrada por `active !== false`)
 * pero todas las contribuciones que la referencian siguen vinculadas: no
 * se rompe la integridad ni la UI de moderación. Idempotente.
 */
export async function archiveTripItem(id) {
  await updateDoc(doc(db, COL, id), { active: false });
}

/**
 * Reactiva una partida soft-deleted. Idempotente.
 */
export async function unarchiveTripItem(id) {
  await updateDoc(doc(db, COL, id), { active: true });
}

/**
 * Soft delete por defecto (alias semántico). Mantiene retro-compatibilidad
 * con los call sites antiguos: `deleteTripItem(id)` ya NO destruye datos,
 * solo archiva. Para borrado destructivo usa `hardDeleteTripItem`.
 */
export async function deleteTripItem(id) {
  return archiveTripItem(id);
}

/**
 * Hard delete con reasignación segura.
 *
 * Pasos:
 *  1. Si `reassignToNull` (por defecto), busca todos los `messageWall` y
 *     `contributions` que apuntan a la partida y los actualiza a
 *     `tripItemId: null` (queda como "fondo general"). Se hace en batches
 *     de hasta 450 escrituras para respetar el límite de Firestore.
 *  2. Borra el documento de la partida.
 *
 * Devuelve el número de documentos reasignados (suma de ambas colecciones)
 * para que la UI pueda mostrar feedback claro al admin.
 */
export async function hardDeleteTripItem(id, { reassignToNull = true } = {}) {
  if (!id) throw new Error('hardDeleteTripItem: falta el id de la partida.');

  let reassignedCount = 0;

  if (reassignToNull) {
    const [wallSnap, contribSnap] = await Promise.all([
      getDocs(query(collection(db, MESSAGE_WALL_COL), where('tripItemId', '==', id))),
      getDocs(query(collection(db, CONTRIBUTIONS_COL), where('tripItemId', '==', id))),
    ]);

    const refs = [
      ...wallSnap.docs.map((d) => d.ref),
      ...contribSnap.docs.map((d) => d.ref),
    ];

    // Trocea en batches por debajo del límite de Firestore.
    for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
      const slice = refs.slice(i, i + BATCH_LIMIT);
      const batch = writeBatch(db);
      for (const ref of slice) batch.update(ref, { tripItemId: null });
      await batch.commit();
    }

    reassignedCount = refs.length;
  }

  // Borrado del documento en una operación final, una vez que las
  // referencias ya no son huérfanas. Si esto fallara tras la reasignación,
  // las contribuciones simplemente quedarían en "fondo general", que es
  // un estado consistente y reversible manualmente.
  await deleteDoc(doc(db, COL, id));

  return { reassignedCount };
}

/**
 * Reasigna el campo `order` de varios items en una sola operación atómica.
 * `updates` es un array de { id, order }.
 */
export async function batchUpdateOrders(updates) {
  if (!updates.length) return;
  const batch = writeBatch(db);
  for (const { id, order } of updates) {
    batch.update(doc(db, COL, id), { order: Number(order) });
  }
  await batch.commit();
}
