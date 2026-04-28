import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
  limit,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './config.js';

const COL = 'messageWall';

/**
 * Errores como `permission-denied` ocurren mientras Firestore aún no está
 * provisionado o las reglas no están desplegadas. Los silenciamos: la UI
 * fallback funciona con datos vacíos.
 */
function onListenerError(err) {
  if (err?.code !== 'permission-denied') {
    console.warn('messageWall listener:', err?.code || err?.message);
  }
}

/** Mensajes visibles en el muro (no ocultos por admin, con texto). */
export function subscribeVisibleMessages(callback) {
  const q = query(
    collection(db, COL),
    where('messageHidden', '==', false),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((m) => m.message && m.message.trim().length > 0)
      );
    },
    onListenerError
  );
}

/** Fotos aprobadas para la galería. */
export function subscribeApprovedPhotos(callback) {
  const q = query(
    collection(db, COL),
    where('photoApproved', '==', true),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((m) => m.photoUrl)
      );
    },
    onListenerError
  );
}

/** Feed de incorporaciones recientes (últimas N). */
export function subscribeRecentContributions(callback, n = 5) {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'), limit(n));
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    onListenerError
  );
}

/** Contribuidores (pagados) por partida — para mostrar nombres bajo el termómetro. */
export function subscribeContributorsByTripItem(tripItemId, callback) {
  const q = query(
    collection(db, COL),
    where('tripItemId', '==', tripItemId),
    where('paid', '==', true),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    onListenerError
  );
}

export async function fetchAllMessages() {
  const snap = await getDocs(query(collection(db, COL), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Admin: todos los mensajes (incluidos ocultos), para moderación. */
export function subscribeAllMessages(callback) {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onListenerError
  );
}

/** Admin: fotos pendientes de aprobación (subidas pero no aprobadas). */
export function subscribePendingPhotos(callback) {
  const q = query(
    collection(db, COL),
    where('photoApproved', '==', false),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((m) => m.photoUrl)
      );
    },
    onListenerError
  );
}

// Acciones admin
export const setMessageHidden = (id, hidden) =>
  updateDoc(doc(db, COL, id), { messageHidden: hidden });

export const setPhotoApproved = (id, approved) =>
  updateDoc(doc(db, COL, id), { photoApproved: approved });

export const deleteMessage = (id) => deleteDoc(doc(db, COL, id));
