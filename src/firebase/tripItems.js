import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
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
  const constraints = [orderBy('order', 'asc')];
  if (onlyActive) constraints.unshift(where('active', '==', true));
  const q = query(collection(db, COL), ...constraints);
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    onListenerError
  );
}

export async function fetchTripItems({ onlyActive = true } = {}) {
  const constraints = [orderBy('order', 'asc')];
  if (onlyActive) constraints.unshift(where('active', '==', true));
  const snap = await getDocs(query(collection(db, COL), ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
