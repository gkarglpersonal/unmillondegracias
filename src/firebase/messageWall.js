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
  writeBatch,
} from 'firebase/firestore';
import { db } from './config.js';

const COL = 'messageWall';

// Firestore limita un writeBatch a 500 ops; dejamos margen.
const BATCH_LIMIT = 450;

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

/**
 * Reasigna en lote el `tripItemId` de todos los mensajes que apuntan a
 * `oldId`, dejándolos en `newId` (o `null` para "fondo general").
 *
 * Devuelve el número de documentos actualizados. Trocea por debajo del
 * límite de batch de Firestore.
 *
 * Nota: la lógica de hard-delete de partidas vive en `tripItems.js`
 * (donde también se reasigna el mirror privado de `contributions`); este
 * helper queda expuesto para usos futuros desde admin.
 */
export async function reassignTripItem(oldId, newId = null) {
  if (!oldId) throw new Error('reassignTripItem: falta oldId.');
  const snap = await getDocs(query(collection(db, COL), where('tripItemId', '==', oldId)));
  const refs = snap.docs.map((d) => d.ref);
  for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
    const slice = refs.slice(i, i + BATCH_LIMIT);
    const batch = writeBatch(db);
    for (const ref of slice) batch.update(ref, { tripItemId: newId });
    await batch.commit();
  }
  return refs.length;
}
