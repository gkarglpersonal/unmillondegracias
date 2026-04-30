import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
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
 * Crea una contribución completa: doc privado + doc público.
 * Se hace como dos writes (no transacción cross-collection en cliente),
 * pero el doc público referencia al privado vía contributionId.
 */
export async function createContribution({
  name,
  email,
  message = null,
  photoUrl = null,
  photoStoragePath = null,
  tripItemId = null,
  amount = null,
  amountPrivate = false,
}) {
  // 1. Crear messageWall doc
  const publicRef = await addDoc(collection(db, C_PUBLIC), {
    name,
    message,
    photoUrl,
    photoStoragePath,
    tripItemId,
    photoApproved: false,
    messageHidden: false,
    paid: false,
    createdAt: serverTimestamp(),
    contributionId: null,
  });

  const normalizedAmount = amount && amount > 0 ? Number(amount) : null;

  // 2. Crear contributions doc, con FK al publicId
  const privateRef = await addDoc(collection(db, C_PRIVATE), {
    name,
    email,
    message,
    photoStoragePath,
    tripItemId,
    amount: normalizedAmount,
    amountPrivate: normalizedAmount ? Boolean(amountPrivate) : false,
    paymentStatus: 'pending',
    publicMessageId: publicRef.id,
    createdAt: serverTimestamp(),
    paidAt: null,
    adminNotes: '',
  });

  // 3. Update messageWall con FK reverso
  await updateDoc(publicRef, { contributionId: privateRef.id });

  return { contributionId: privateRef.id, publicMessageId: publicRef.id };
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
