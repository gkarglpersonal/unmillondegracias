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
  startAfter,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config.js';
import {
  movePhotoToApproved,
  movePhotoToPending,
  deletePhotoByPath,
  getStorageDownloadUrl,
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

/**
 * Admin: todos los mensajes (incluidos ocultos), para moderación.
 *
 * Legacy: emite un array plano. Sigue usándose desde ExportTools.jsx, que
 * necesita TODOS los mensajes para generar el PDF de entrega final, y por
 * tanto NO puede paginar. Para moderación con paginación usa
 * `subscribeAdminMessages` (Importante #13).
 */
export function subscribeAllMessages(callback) {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onListenerError
  );
}

/**
 * Admin: mensajes paginados con cursor, para moderación.
 *
 * El `onSnapshot` cubre solo la primera página (`limit(pageSize)`). El callback
 * recibe `{ items, lastDoc, hasMore }`:
 *   - `items`: array de docs ya hidratados.
 *   - `lastDoc`: último QueryDocumentSnapshot, para pasar a `fetchMoreAdminMessages`.
 *   - `hasMore`: true si la página llegó completa (puede haber más).
 *
 * Compromiso: la paginación NO es totalmente reactiva. Cambios en docs
 * "viejos" (más allá de la primera página, que el listener no observa) no
 * se reflejan hasta refrescar la página de admin. Aceptable para
 * moderación.
 *
 * Devuelve `unsubscribe` para limpieza.
 */
export function subscribeAdminMessages(callback, { pageSize = 50 } = {}) {
  const q = query(
    collection(db, COL),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
      const hasMore = snap.docs.length === pageSize;
      callback({ items, lastDoc, hasMore });
    },
    onListenerError
  );
}

/**
 * Carga la siguiente página de mensajes admin a partir del cursor.
 *
 * NO es reactivo: es un `getDocs` puntual. Devuelve la misma forma que
 * el callback paginado: `{ items, lastDoc, hasMore }`. Si `lastDoc` es
 * null/undefined, devuelve un resultado vacío sin tirar.
 */
export async function fetchMoreAdminMessages(lastDoc, { pageSize = 50 } = {}) {
  if (!lastDoc) {
    return { items: [], lastDoc: null, hasMore: false };
  }
  const q = query(
    collection(db, COL),
    orderBy('createdAt', 'desc'),
    startAfter(lastDoc),
    limit(pageSize)
  );
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const newLastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
  const hasMore = snap.docs.length === pageSize;
  return { items, lastDoc: newLastDoc, hasMore };
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
  const docRef = doc(db, COL, messageId);
  const snap = await getDoc(docRef);
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

  // Recovery: si el doc todavía dice photoApproved=false pero el path
  // ya está en approved/, es que un intento previo movió el blob pero
  // el updateDoc falló. Sincronizamos el doc sin re-mover.
  if (data.photoStoragePath.startsWith('photos/approved/')) {
    const publicUrl = await getStorageDownloadUrl(data.photoStoragePath);
    await updateDoc(docRef, {
      photoUrl: publicUrl,
      photoApproved: true,
    });
    return { newStoragePath: data.photoStoragePath, publicUrl };
  }

  // Defensa en profundidad: solo aprobamos fotos que provengan de
  // `photos/pending/`. Si por bug, migración inconsistente o
  // manipulación externa el doc apuntara a otra ruta, abortamos
  // antes de mover el blob para no exponer fotos no validadas.
  if (!data.photoStoragePath.startsWith('photos/pending/')) {
    throw new Error(
      `Foto en path inesperado: ${data.photoStoragePath}. Solo se aprueban fotos desde photos/pending/.`
    );
  }

  // Intento normal: mover el blob de pending/ a approved/.
  let moveResult;
  try {
    moveResult = await movePhotoToApproved(data.photoStoragePath);
  } catch (moveErr) {
    // Recovery extra: el move falló (ej: object-not-found en pending),
    // posiblemente porque un intento previo lo movió pero updateDoc
    // falló dejando el doc apuntando a pending/. Si el blob existe en
    // approved/ con el mismo nombre, asumimos que es ese mismo y
    // sincronizamos en lugar de fallar.
    const fileName = data.photoStoragePath.split('/').pop();
    const probablePath = `photos/approved/${fileName}`;
    try {
      const publicUrl = await getStorageDownloadUrl(probablePath);
      moveResult = { newStoragePath: probablePath, publicUrl };
      console.warn(
        'approvePhoto: blob ya estaba en approved/ tras un intento previo fallido. Sincronizando doc.',
        { messageId, probablePath }
      );
    } catch {
      // No está en approved/ tampoco: el error original es la causa real.
      throw moveErr;
    }
  }

  await updateDoc(docRef, {
    photoStoragePath: moveResult.newStoragePath,
    photoUrl: moveResult.publicUrl,
    photoApproved: true,
  });

  return moveResult;
}

/**
 * Quita la aprobación de una foto: la devuelve físicamente a
 * `photos/pending/...` (donde solo el admin puede leerla) y limpia la
 * URL pública. Esto cierra el agujero de privacidad: tras desaprobar,
 * cualquier URL pública previamente cacheada o escrapeada deja de
 * resolver el blob.
 *
 * Pasos:
 *  1. Lee el doc para obtener `photoStoragePath` actual (típicamente
 *     bajo `photos/approved/`).
 *  2. Si no tiene path o ya está bajo `pending/`, solo actualiza los
 *     flags del doc (idempotente).
 *  3. Si está bajo `approved/`, llama a `movePhotoToPending` para
 *     copiar el blob a `pending/` y borrar el viejo. Si la copia
 *     falla, propaga y deja el estado intacto. Si solo falla el
 *     borrado del origen, `movePhotoToPending` lo tolera con warning
 *     (un duplicado privado es preferible a un blob aprobado
 *     accesible).
 *  4. Actualiza el doc con el nuevo path, `photoUrl: null` y
 *     `photoApproved: false`.
 *
 * Idempotente: aplicarlo dos veces no rompe nada — la segunda llamada
 * verá el path ya en `pending/` y solo refrescará los flags del doc.
 */
export async function unapprovePhoto(messageId) {
  const ref = doc(db, COL, messageId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error('Mensaje no encontrado.');
  }
  const data = snap.data();

  // Sin path o ya en pending: nada que mover físicamente, solo flags.
  if (
    !data.photoStoragePath ||
    data.photoStoragePath.startsWith('photos/pending/')
  ) {
    await updateDoc(ref, {
      photoApproved: false,
      photoUrl: null,
    });
    return { newStoragePath: data.photoStoragePath || null };
  }

  // Mover blob de vuelta a pending/. Si la copia falla, propagamos y
  // no tocamos Firestore: el estado queda igual que antes.
  const { newStoragePath } = await movePhotoToPending(data.photoStoragePath);

  await updateDoc(ref, {
    photoStoragePath: newStoragePath,
    photoApproved: false,
    photoUrl: null,
  });

  return { newStoragePath };
}

/**
 * Rechaza solo la foto y conserva el mensaje. Borra el blob de Storage
 * (si existe) y limpia los campos de foto en el doc, dejando el resto
 * de la entrada intacta — texto, nombre y aporte económico siguen
 * visibles en el muro.
 *
 * Pasos:
 *  1. Lee el doc.
 *  2. Si tiene `photoStoragePath`, borra el blob con `deletePhotoByPath`.
 *  3. Actualiza el doc con `photoStoragePath: null`, `photoUrl: null`,
 *     `photoApproved: false`.
 *
 * Idempotente: si la entrada ya está sin foto (sin path), solo aplica
 * el update de flags. No tira si el doc no existe (no-op).
 *
 * Diferencia con `rejectPhoto`: aquella borra el doc completo; esta
 * preserva el mensaje. Úsala cuando la foto sea inapropiada pero el
 * texto del aporte sí merezca seguir en el muro.
 */
export async function rejectPhotoKeepMessage(messageId) {
  const ref = doc(db, COL, messageId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();

  if (data.photoStoragePath) {
    await deletePhotoByPath(data.photoStoragePath);
  }
  await updateDoc(ref, {
    photoStoragePath: null,
    photoUrl: null,
    photoApproved: false,
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
