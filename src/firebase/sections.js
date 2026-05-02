import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  getDocs,
  where,
} from 'firebase/firestore';
import { db } from './config.js';

const COL = 'sections';
const TRIP_ITEMS_COL = 'tripItems';

function makeListenerError(externalCallback) {
  return (err) => {
    if (err?.code !== 'permission-denied') {
      console.warn('sections listener:', err?.code || err?.message);
      if (typeof externalCallback === 'function') {
        externalCallback(err);
      }
    }
  };
}

export function subscribeSections(callback, errorCallback) {
  const q = query(collection(db, COL), orderBy('order', 'asc'));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    makeListenerError(errorCallback)
  );
}

export async function createSection({ name, order }) {
  const id = doc(collection(db, COL)).id;
  await setDoc(doc(db, COL, id), {
    name: name.trim(),
    order: Number(order),
    createdAt: serverTimestamp(),
  });
  return id;
}

/**
 * Siembra varias secciones en una sola operación atómica. Más robusto que
 * 6 setDoc paralelos: un único round trip con el mismo ID token, lo que
 * descarta races entre el token refresh y los writes individuales.
 */
export async function seedSections(names) {
  if (!names?.length) return;
  const batch = writeBatch(db);
  names.forEach((name, idx) => {
    const id = doc(collection(db, COL)).id;
    batch.set(doc(db, COL, id), {
      name: name.trim(),
      order: idx + 1,
      createdAt: serverTimestamp(),
    });
  });
  await batch.commit();
}

/**
 * Renombra la sección y propaga el cambio a todas las partidas cuyo
 * campo `city` coincide con el nombre antiguo. Atómico via writeBatch.
 */
export async function renameSection(id, oldName, newName) {
  const trimmed = newName.trim();
  if (!trimmed || trimmed === oldName) return;
  const batch = writeBatch(db);
  batch.update(doc(db, COL, id), { name: trimmed });
  if (oldName) {
    const itemsQuery = query(collection(db, TRIP_ITEMS_COL), where('city', '==', oldName));
    const snap = await getDocs(itemsQuery);
    for (const d of snap.docs) batch.update(d.ref, { city: trimmed });
  }
  await batch.commit();
}

/** Elimina la sección y borra todas las partidas asociadas. */
export async function deleteSectionAndItems(id, name) {
  const batch = writeBatch(db);
  batch.delete(doc(db, COL, id));
  if (name) {
    const itemsQuery = query(collection(db, TRIP_ITEMS_COL), where('city', '==', name));
    const snap = await getDocs(itemsQuery);
    for (const d of snap.docs) batch.delete(d.ref);
  }
  await batch.commit();
}

/** Elimina la sección moviendo sus partidas a "Sin asignar" (city = null). */
export async function deleteSectionMoveToUnassigned(id, name) {
  const batch = writeBatch(db);
  batch.delete(doc(db, COL, id));
  if (name) {
    const itemsQuery = query(collection(db, TRIP_ITEMS_COL), where('city', '==', name));
    const snap = await getDocs(itemsQuery);
    for (const d of snap.docs) batch.update(d.ref, { city: null });
  }
  await batch.commit();
}

/** Reasigna `order` de varias secciones en una sola operación atómica. */
export async function batchUpdateSectionOrders(updates) {
  if (!updates.length) return;
  const batch = writeBatch(db);
  for (const { id, order } of updates) {
    batch.update(doc(db, COL, id), { order: Number(order) });
  }
  await batch.commit();
}
