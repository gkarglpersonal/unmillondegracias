import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  deleteDoc,
  increment,
  where,
} from 'firebase/firestore';
import { db } from './config.js';

const C_PRIVATE = 'contributions';
const C_PUBLIC = 'messageWall';
const C_TRIP = 'tripItems';
const C_CONFIG = 'config';

/**
 * Genera dos IDs de Firestore (cliente) para usarlos antes de cualquier
 * write. Esto permite:
 *  - Idempotencia ante reintentos: el llamador conserva los IDs y reintenta.
 *  - Referencia cruzada desde el primer write (sin updateDoc posterior).
 *  - Cleanup compensatorio preciso si algo falla a mitad del flujo.
 */
export function generateContributionIds() {
  return {
    contributionId: doc(collection(db, C_PRIVATE)).id,
    publicMessageId: doc(collection(db, C_PUBLIC)).id,
  };
}

/**
 * Crea contribution + messageWall usando IDs pre-generados.
 *
 * Diseño:
 *  - Acepta `contributionId` y `publicMessageId` como entrada obligatoria.
 *    Si el usuario pulsa submit dos veces o hay un retry tras fallo, los
 *    mismos IDs producen el mismo documento (setDoc es idempotente).
 *  - NO recibe `photoUrl`. La foto va a Storage primero (responsabilidad
 *    del llamador), aquí solo se guarda `photoStoragePath`. La URL
 *    pública se popula en `messageWall` solo al aprobar la foto desde
 *    moderación.
 *  - Orden de writes: primero `contributions` (privado), luego `messageWall`
 *    (público). Si fallara la segunda escritura, el llamador puede borrar
 *    la primera vía `deleteContributionById`.
 *
 * No es atómico cross-collection (limitación de Firestore en cliente),
 * pero la idempotencia + el cleanup compensatorio del llamador cierran
 * el agujero práctico.
 */
export async function createContribution({
  contributionId,
  publicMessageId,
  name,
  email,
  message = null,
  photoStoragePath = null,
  tripItemId = null,
  amount = null,
  amountPrivate = false,
}) {
  if (!contributionId || !publicMessageId) {
    throw new Error(
      'createContribution requiere contributionId y publicMessageId pre-generados. Usa generateContributionIds().'
    );
  }

  const normalizedAmount = amount && amount > 0 ? Number(amount) : null;

  // 1. Crear contributions doc (privado). Lleva ya FK al messageWall.
  await setDoc(doc(db, C_PRIVATE, contributionId), {
    name,
    email,
    message,
    photoStoragePath,
    tripItemId,
    amount: normalizedAmount,
    amountPrivate: normalizedAmount ? Boolean(amountPrivate) : false,
    paymentStatus: 'pending',
    publicMessageId,
    createdAt: serverTimestamp(),
    paidAt: null,
    adminNotes: '',
  });

  // 2. Crear messageWall doc (público). FK ya conocida desde el inicio.
  //    photoUrl es null al crear; se popula al aprobar la foto en
  //    moderación (PhotosModeration). Esto evita exponer fotos sin revisar.
  await setDoc(doc(db, C_PUBLIC, publicMessageId), {
    name,
    message,
    photoUrl: null,
    photoStoragePath,
    tripItemId,
    photoApproved: false,
    messageHidden: false,
    paid: false,
    createdAt: serverTimestamp(),
    contributionId,
  });

  return { contributionId, publicMessageId };
}

/**
 * Cleanup compensatorio: borra el doc de contributions.
 * No tira: el llamador ya está manejando un fallo previo y necesita
 * intentar limpiar recursos parciales.
 */
export async function deleteContributionById(contributionId) {
  if (!contributionId) return;
  try {
    await deleteDoc(doc(db, C_PRIVATE, contributionId));
  } catch (err) {
    console.warn('deleteContributionById:', contributionId, err?.code || err?.message);
  }
}

/**
 * Cleanup compensatorio: borra el doc de messageWall.
 * No tira (mismo motivo que deleteContributionById).
 */
export async function deletePublicMessageById(publicMessageId) {
  if (!publicMessageId) return;
  try {
    await deleteDoc(doc(db, C_PUBLIC, publicMessageId));
  } catch (err) {
    console.warn('deletePublicMessageById:', publicMessageId, err?.code || err?.message);
  }
}

/* -------- Admin -------- */

export function subscribeAdminContributions(callback) {
  const q = query(collection(db, C_PRIVATE), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    (err) => {
      if (err?.code !== 'permission-denied') {
        console.warn('contributions listener:', err?.code || err?.message);
      }
    }
  );
}

export async function fetchPaidContributions() {
  const snap = await getDocs(
    query(collection(db, C_PRIVATE), where('paymentStatus', '==', 'paid'))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Marca una contribución como pagada.
 * Transacción: actualiza contribution, messageWall.paid, tripItem.raisedAmount + counters.
 */
export async function markContributionPaid(contributionId) {
  await runTransaction(db, async (tx) => {
    const cRef = doc(db, C_PRIVATE, contributionId);
    const cSnap = await tx.get(cRef);
    if (!cSnap.exists()) throw new Error('Contribución no encontrada.');
    const c = cSnap.data();
    if (c.paymentStatus === 'paid') return;

    tx.update(cRef, { paymentStatus: 'paid', paidAt: serverTimestamp() });

    if (c.publicMessageId) {
      tx.update(doc(db, C_PUBLIC, c.publicMessageId), { paid: true });
    }

    if (c.tripItemId && c.amount && c.amount > 0) {
      tx.update(doc(db, C_TRIP, c.tripItemId), {
        raisedAmount: increment(c.amount),
        contributorCount: increment(1),
      });
    }

    if (c.amount && c.amount > 0) {
      tx.set(
        doc(db, C_CONFIG, 'general'),
        {
          totalRaised: increment(c.amount),
          totalContributors: increment(1),
        },
        { merge: true }
      );
    } else {
      tx.set(
        doc(db, C_CONFIG, 'general'),
        { totalContributors: increment(1) },
        { merge: true }
      );
    }
  });
}

export async function unmarkContributionPaid(contributionId) {
  await runTransaction(db, async (tx) => {
    const cRef = doc(db, C_PRIVATE, contributionId);
    const cSnap = await tx.get(cRef);
    if (!cSnap.exists()) return;
    const c = cSnap.data();
    if (c.paymentStatus !== 'paid') return;

    tx.update(cRef, { paymentStatus: 'pending', paidAt: null });

    if (c.publicMessageId) {
      tx.update(doc(db, C_PUBLIC, c.publicMessageId), { paid: false });
    }

    if (c.tripItemId && c.amount && c.amount > 0) {
      tx.update(doc(db, C_TRIP, c.tripItemId), {
        raisedAmount: increment(-c.amount),
        contributorCount: increment(-1),
      });
    }

    if (c.amount && c.amount > 0) {
      tx.set(
        doc(db, C_CONFIG, 'general'),
        {
          totalRaised: increment(-c.amount),
          totalContributors: increment(-1),
        },
        { merge: true }
      );
    } else {
      tx.set(
        doc(db, C_CONFIG, 'general'),
        { totalContributors: increment(-1) },
        { merge: true }
      );
    }
  });
}

/** Aportación manual creada por admin (alguien le notificó por otro canal). */
export async function createManualContribution(data) {
  const id = doc(collection(db, C_PRIVATE)).id;
  await setDoc(doc(db, C_PRIVATE, id), {
    ...data,
    paymentStatus: data.paymentStatus || 'paid',
    createdAt: serverTimestamp(),
    paidAt: data.paymentStatus === 'paid' ? serverTimestamp() : null,
    isManual: true,
  });
  return id;
}

export const deleteContribution = (id) => deleteDoc(doc(db, C_PRIVATE, id));
