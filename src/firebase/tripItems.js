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
} from 'firebase/firestore';
import { db } from './config.js';

const COL = 'tripItems';

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

export async function deleteTripItem(id) {
  await deleteDoc(doc(db, COL, id));
}
