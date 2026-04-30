import {
  collection,
  doc,
  getDoc,
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
import {
  movePhotoToApproved,
  deletePhotoByPath,
} from './storage.js';

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

/**
 * Admin: fotos pendientes de aprobación.
 *
 * Una entrada está "pendiente de foto" cuando tiene `photoStoragePath` y
 * todavía no está aprobada. `photoUrl` es null hasta que se aprueba
 * (entonces el blob se mueve a `photos/approved/` y se popula la URL
 * pública). Por eso el filtro va contra `photoStoragePath`, no contra
 * `photoUrl`.
 */
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
          .filter((m) => m.photoStoragePath)
      );
    },
    onListenerError
  );
}

// Acciones admin
export const setMessageHidden = (id, hidden) =>
  updateDoc(doc(db, COL, id), { messageHidden: hidden });

export const deleteMessage = (id) => deleteDoc(doc(db, COL, id));

/**
 * Aprueba la foto de una entrada del muro.
 *
 * Pasos:
 *  1. Lee el doc para conocer `photoStoragePath` (que debería estar en
 *     `photos/pending/...`).
 *  2. Mueve el blob a `photos/approved/...` (copia + borra origen) y
 *     obtiene la URL pública.
 *  3. Actualiza el doc en Firestore: `photoStoragePath` (nuevo path),
 *     `photoUrl` (URL pública) y `photoApproved: true`.
 *
 * Si algún paso falla, el doc no queda en estado inconsistente: solo
 * actualizamos Firestore tras un movimiento exitoso de Storage.
 *
 * Idempotente: si la foto ya está aprobada, devuelve el estado actual
 * sin hacer nada.
 */
export async function approvePhoto(messageId) {
  const ref = doc(db, COL, messageId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error('Mensaje no encontrado.');
  }
  const data = snap.data();

  if (data.photoApproved === true && data.photoUrl) {
    return { newStoragePath: data.photoStoragePath, publicUrl: data.photoUrl };
  }

  if (!data.photoStoragePath) {
    throw new Error('Esta entrada no tiene foto para aprobar.');
  }

  const { newStoragePath, publicUrl } = await movePhotoToApproved(
    data.photoStoragePath
  );

  await updateDoc(ref, {
    photoStoragePath: newStoragePath,
    photoUrl: publicUrl,
    photoApproved: true,
  });

  return { newStoragePath, publicUrl };
}

/**
 * Quita la aprobación de una foto: vuelve a marcarla pendiente y limpia
 * la URL pública. NO mueve el blob de vuelta a `pending/` automáticamente
 * — la foto queda físicamente en `photos/approved/` pero deja de
 * enlazarse desde la galería. Si después se rechaza, `rejectPhoto`
 * borra el blob.
 */
export async function unapprovePhoto(messageId) {
  await updateDoc(doc(db, COL, messageId), {
    photoApproved: false,
    photoUrl: null,
  });
}

/**
 * Rechaza una entrada con foto: borra el blob de Storage y elimina el
 * doc del muro. La decisión de moderación es por entrada completa
 * (igual que el comportamiento previo del botón "Rechazar").
 */
export async function rejectPhoto(messageId) {
  const ref = doc(db, COL, messageId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();

  if (data.photoStoragePath) {
    await deletePhotoByPath(data.photoStoragePath);
  }
  await deleteDoc(ref);
}

/**
 * Compatibilidad: algunos llamadores antiguos usaban
 * `setPhotoApproved(id, bool)`. Lo mantenemos exportado y delegamos a
 * approve/unapprove según el flag, garantizando que la aprobación
 * siempre pasa por el flujo de mover blob.
 */
export async function setPhotoApproved(id, approved) {
  if (approved) return approvePhoto(id);
  return unapprovePhoto(id);
}

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
