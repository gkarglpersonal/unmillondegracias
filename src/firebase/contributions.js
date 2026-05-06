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
  limit,
  startAfter,
  waitForPendingWrites,
} from 'firebase/firestore';
import { db } from './config.js';

/**
 * Espera a que todas las escrituras pendientes en cache local se confirmen
 * en el servidor, con timeout. Imprescindible antes de declarar éxito al
 * usuario: Firestore tiene persistencia offline activa y `setDoc` resuelve
 * la promise en cuanto el dato está en cache local, NO cuando el servidor
 * confirma. Si la red está caída, la contribución queda solo en local y
 * puede perderse si el usuario cierra la pestaña antes de reconectar.
 *
 * Si el timeout se agota, lanza un Error con `code: 'server-ack-timeout'`
 * para que el llamador lo distinga de un error de validación o
 * permission-denied y muestre copy específico (comprobar conexión).
 */
const SERVER_ACK_TIMEOUT_MS = 15000;
async function awaitServerAck() {
  await Promise.race([
    waitForPendingWrites(db),
    new Promise((_, reject) =>
      setTimeout(() => {
        const err = new Error(
          'Tiempo de espera agotado al confirmar la escritura en el servidor.'
        );
        err.code = 'server-ack-timeout';
        reject(err);
      }, SERVER_ACK_TIMEOUT_MS)
    ),
  ]);
}

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

  // 3. Confirmar ack del servidor antes de declarar éxito. Sin esto, una
  //    red mala puede dejar las escrituras solo en cache local, perdiéndose
  //    si el usuario cierra la pestaña antes de reconectar (aunque el
  //    formulario habría mostrado "guardado" engañosamente).
  await awaitServerAck();

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

function onAdminListenerError(err) {
  if (err?.code !== 'permission-denied') {
    console.warn('contributions listener:', err?.code || err?.message);
  }
}

/**
 * Admin: contribuciones para listas/exportación.
 *
 * Firma compatible:
 *  - `subscribeAdminContributions(callback)` (legacy): emite array plano con
 *    todos los docs. La usan ExportTools (PDF/ZIP de entrega final, necesita
 *    todos) y EmailJsAlert (cuenta global de pendientes). NO se rompe.
 *  - `subscribeAdminContributions(callback, { pageSize })` (paginado,
 *    Importante #13): emite `{ items, lastDoc, hasMore }` con `limit(pageSize)`.
 *    Usado por ContributionsList.jsx para no traer 100+ docs de golpe.
 *
 * El comportamiento depende de si el segundo argumento se pasa o no — así
 * los callers fuera del alcance siguen funcionando sin cambios.
 */
export function subscribeAdminContributions(callback, options) {
  // Modo paginado: solo si el caller pasa explícitamente options.
  if (options && typeof options === 'object') {
    const { pageSize = 50 } = options;
    const q = query(
      collection(db, C_PRIVATE),
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
      onAdminListenerError
    );
  }

  // Modo legacy: emite array plano con todos los docs.
  const q = query(collection(db, C_PRIVATE), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    onAdminListenerError
  );
}

/**
 * Carga la siguiente página de contribuciones admin a partir del cursor.
 *
 * NO es reactivo: es un `getDocs` puntual. Devuelve `{ items, lastDoc, hasMore }`,
 * la misma forma que emite `subscribeAdminContributions` en modo paginado.
 * Si `lastDoc` es null/undefined, devuelve un resultado vacío sin tirar.
 */
export async function fetchMoreAdminContributions(lastDoc, { pageSize = 50 } = {}) {
  if (!lastDoc) {
    return { items: [], lastDoc: null, hasMore: false };
  }
  const q = query(
    collection(db, C_PRIVATE),
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

/**
 * Crea una aportación manual desde el panel admin (alguien notificó por
 * WhatsApp, transferencia directa, etc.) de forma ATÓMICA.
 *
 * Diseño:
 *  - Pre-genera los IDs (contribution + messageWall mirror) antes de la
 *    transacción, igual que el patrón de `createContribution` para
 *    permitir reintentos idempotentes sin duplicar docs.
 *  - Una sola `runTransaction` que crea contribution + messageWall +
 *    actualiza contadores (tripItem si aplica, config siempre). Si algo
 *    falla a mitad, Firestore hace rollback y no quedan ni docs huérfanos
 *    ni contadores inflados.
 *  - Las manuales se asumen pagadas por defecto (`paymentStatus: 'paid'`,
 *    `paid: true` en el mirror, contadores incrementados al instante). Si
 *    se crea como `pending`, los contadores no se tocan: ya se tocarán
 *    cuando el admin la marque pagada vía `markContributionPaid`.
 *  - Si `tripItemId === null` (fondo general), solo incrementa contadores
 *    de config, no toca tripItems.
 *
 * @param {object} input
 * @param {string} input.name
 * @param {string|null} [input.email]
 * @param {string|null} [input.message]
 * @param {string|null} [input.tripItemId]
 * @param {number|null} [input.amount]
 * @param {boolean} [input.amountPrivate]
 * @param {'paid'|'pending'} [input.paymentStatus]
 * @returns {Promise<{ contributionId: string, publicMessageId: string }>}
 */
export async function createManualContribution({
  name,
  email = null,
  message = null,
  tripItemId = null,
  amount = null,
  amountPrivate = false,
  paymentStatus = 'paid',
}) {
  if (!name || !name.trim()) {
    throw new Error('createManualContribution: falta name.');
  }

  const status = paymentStatus === 'pending' ? 'pending' : 'paid';
  const normalizedAmount = amount && amount > 0 ? Number(amount) : null;
  const isPaid = status === 'paid';

  const contributionId = doc(collection(db, C_PRIVATE)).id;
  const publicMessageId = doc(collection(db, C_PUBLIC)).id;

  await runTransaction(db, async (tx) => {
    // Si la transacción se reintenta y el doc ya existe, leemos primero
    // para detectar el caso (idempotencia ante retry interno).
    const cRef = doc(db, C_PRIVATE, contributionId);
    const mRef = doc(db, C_PUBLIC, publicMessageId);

    // Lecturas previas necesarias para que la transacción sea válida cuando
    // luego escribamos al tripItem (Firestore exige reads antes de writes
    // para los docs cuyo estado nos importe). El tripItem solo lo tocamos
    // si aplica.
    if (isPaid && tripItemId && normalizedAmount) {
      // tx.get pa validar que existe la partida; si no existe, abortamos.
      const tSnap = await tx.get(doc(db, C_TRIP, tripItemId));
      if (!tSnap.exists()) {
        throw new Error(`Partida ${tripItemId} no existe.`);
      }
    }

    // 1. Crear contribution doc.
    tx.set(cRef, {
      name: name.trim(),
      email: email ? String(email).trim() || null : null,
      message: message ? String(message).trim() || null : null,
      photoStoragePath: null,
      tripItemId,
      amount: normalizedAmount,
      amountPrivate: normalizedAmount ? Boolean(amountPrivate) : false,
      paymentStatus: status,
      publicMessageId,
      createdAt: serverTimestamp(),
      paidAt: isPaid ? serverTimestamp() : null,
      adminNotes: '',
      isManual: true,
    });

    // 2. Crear messageWall mirror (solo metadatos públicos).
    tx.set(mRef, {
      name: name.trim(),
      message: message ? String(message).trim() || null : null,
      photoUrl: null,
      photoStoragePath: null,
      tripItemId,
      photoApproved: false,
      messageHidden: false,
      paid: isPaid,
      createdAt: serverTimestamp(),
      contributionId,
    });

    // 3. Incrementar contadores SOLO si está pagada.
    if (isPaid) {
      if (tripItemId && normalizedAmount) {
        tx.update(doc(db, C_TRIP, tripItemId), {
          raisedAmount: increment(normalizedAmount),
          contributorCount: increment(1),
        });
      }

      tx.set(
        doc(db, C_CONFIG, 'general'),
        {
          totalRaised: normalizedAmount ? increment(normalizedAmount) : increment(0),
          totalContributors: increment(1),
        },
        { merge: true }
      );
    }
  });

  // Confirmar ack del servidor antes de declarar éxito al admin. Mismo
  // motivo que en createContribution: la persistencia offline de Firestore
  // resuelve la transacción en cache local antes de la confirmación real.
  await awaitServerAck();

  return { contributionId, publicMessageId };
}

/**
 * Borra solo la aportación económica conservando el mensaje y la foto en
 * el muro público.
 *
 * Caso de uso típico: alguien rellena el formulario con mensaje, foto e
 * importe pero nunca paga a PANGEA. El admin elimina la aportación
 * económica desde el panel; mensaje y foto siguen visibles en el muro y
 * en la galería para que Mariángeles los vea.
 *
 * Diseño:
 *  - `runTransaction` que lee la contribution; si está pagada, decrementa
 *    los 4 contadores (tripItem si aplica + config siempre). Borra el doc
 *    privado de la contribución. Si algo falla, rollback automático.
 *  - **El mirror público (messageWall) se conserva** si la entrada tenía
 *    contenido del usuario: mensaje no vacío, o foto. Solo se limpian los
 *    campos vinculados a la aportación económica:
 *    `paid: false` y `contributionId: null`. Los campos de foto
 *    (`photoStoragePath`, `photoUrl`, `photoApproved`), el mensaje y el
 *    `tripItemId` permanecen intactos. Como `paid: false`, el donante no
 *    aparece bajo el termómetro de la partida (filtro `paid==true`), pero
 *    el mensaje sigue en el muro y la foto en la galería si estaba
 *    aprobada.
 *  - Si la entrada NO tenía ni mensaje ni foto (aportación monetaria
 *    pura), el mirror se borra: no hay contenido del usuario que
 *    preservar y dejarlo sería un fantasma sin nada visible.
 *  - **El blob de Storage NO se borra**: la foto, si la había, sigue
 *    accesible para la galería pública (si estaba aprobada) o para
 *    moderación (si seguía pendiente).
 *  - Idempotente: si la contribución no existe (alguien la borró antes),
 *    sale limpiamente sin tirar ni mutar contadores.
 *
 * Casos:
 *  - Pendiente, con mensaje o foto: limpia mirror, conserva contenido,
 *    no toca contadores.
 *  - Pendiente, sin mensaje ni foto: borra mirror y privado, no toca
 *    contadores.
 *  - Pagada con tripItemId null (fondo general): decrementa config.
 *  - Pagada con tripItemId: decrementa tripItem + config.
 *
 * @param {string} contributionId
 */
export async function deleteContribution(contributionId) {
  if (!contributionId) return;

  await runTransaction(db, async (tx) => {
    const cRef = doc(db, C_PRIVATE, contributionId);
    const cSnap = await tx.get(cRef);
    if (!cSnap.exists()) {
      // Idempotencia: ya no existe, nada que borrar.
      return;
    }
    const c = cSnap.data();

    // Si está pagada, hay que validar la partida antes de tocarla. Lecturas
    // antes de cualquier escritura.
    const wasPaid = c.paymentStatus === 'paid';
    const amount = c.amount && c.amount > 0 ? Number(c.amount) : null;
    const hasMessage =
      typeof c.message === 'string' && c.message.trim().length > 0;
    const hasPhoto = !!c.photoStoragePath;

    // Lectura previa del mirror público: puede no existir si fue borrado
    // antes desde "Mensajes" del admin o por una operación previa. Sin
    // este chequeo, `tx.update` lanzaría `not-found` y haría rollback de
    // toda la transacción.
    let mirrorExists = false;
    if (c.publicMessageId) {
      const mSnap = await tx.get(doc(db, C_PUBLIC, c.publicMessageId));
      mirrorExists = mSnap.exists();
    }

    if (wasPaid && c.tripItemId && amount) {
      // tx.get para satisfacer la regla de read-before-write de la
      // transacción (vamos a actualizar este doc).
      await tx.get(doc(db, C_TRIP, c.tripItemId));
    }

    // Mirror público: conservar si hay contenido del usuario (mensaje o
    // foto), borrar si no había nada que preservar. Si ya no existe, se
    // omite — no hay nada que limpiar.
    if (c.publicMessageId && mirrorExists) {
      const mRef = doc(db, C_PUBLIC, c.publicMessageId);
      if (hasMessage || hasPhoto) {
        // Solo se limpian los campos vinculados a la aportación económica.
        // Mensaje, foto (path/url/aprobada) y tripItemId quedan intactos.
        tx.update(mRef, {
          paid: false,
          contributionId: null,
        });
      } else {
        tx.delete(mRef);
      }
    }

    // Borrar contribution doc (privado, siempre).
    tx.delete(cRef);

    // Decrementar contadores solo si estaba pagada.
    if (wasPaid) {
      if (c.tripItemId && amount) {
        tx.update(doc(db, C_TRIP, c.tripItemId), {
          raisedAmount: increment(-amount),
          contributorCount: increment(-1),
        });
      }

      tx.set(
        doc(db, C_CONFIG, 'general'),
        {
          totalRaised: amount ? increment(-amount) : increment(0),
          totalContributors: increment(-1),
        },
        { merge: true }
      );
    }
  });

  // El blob de Storage NO se borra: la foto se conserva en el muro/galería.
  // Si en el futuro hay que borrar foto y mensaje juntos, esa decisión vive
  // en moderación (PhotosModeration → "Borrar entrada" ya cubre ese caso).
}

/**
 * Reasigna una contribución a otra partida (o a "sin asignar") con
 * reajuste atómico de contadores.
 *
 * Diseño:
 *  - `runTransaction` que lee la contribution, valida la partida nueva
 *    (si no es null), lee la partida vieja (si la hay) y el mirror público.
 *  - Escribe en `contributions[id]`:
 *      - `tripItemId`: nuevo valor (string o null).
 *      - `originalTripItemId`: solo se escribe la PRIMERA vez que se
 *        reasigna esa contribución. Conserva el valor original que el
 *        donante eligió (o null si fue a fondo general). En reasignaciones
 *        posteriores no se sobrescribe — la "primera vez" se detecta por
 *        `'originalTripItemId' in c === false`.
 *      - `manuallyAssignedAt`: timestamp de la reasignación (siempre se
 *        actualiza al timestamp más reciente).
 *  - Escribe en `messageWall[mirrorId].tripItemId` para que la cara pública
 *    quede coherente. Si el mirror no existe (fue borrado antes), se omite
 *    sin tirar — patrón ya aplicado en `deleteContribution`.
 *  - **Reajuste de contadores en `tripItems`** (solo si está pagada y
 *    tiene amount > 0):
 *      - Decrementa `raisedAmount` y `contributorCount` de la partida vieja.
 *      - Incrementa `raisedAmount` y `contributorCount` de la partida nueva.
 *      - `config/general.totalRaised` y `totalContributors` NO se tocan:
 *        el total y el número de donantes son los mismos, solo cambia el
 *        bucket. El dashboard de tres tarjetas (suma desde `contributions`
 *        directamente) reflejará el cambio: "Sin asignar" baja, "Asignado
 *        a partidas" sube por el mismo importe.
 *  - Si la contribución NO está pagada, no toca contadores: cuando se
 *    marque pagada en el futuro, `markContributionPaid` ya leerá el
 *    `tripItemId` actualizado y contará en la partida correcta.
 *  - No-op si `newTripItemId === current` (incluido `null === null`).
 *
 * Validaciones:
 *  - newTripItemId puede ser null (vuelve a "sin asignar / fondo general"),
 *    string no vacío (debe existir en `tripItems`) o cadena vacía (se
 *    normaliza a null).
 *  - Si la contribución no existe, lanza error.
 *  - Si newTripItemId no es null y la partida nueva no existe, lanza error
 *    (el dropdown solo permite seleccionar partidas reales, así que esto
 *    es defensa en profundidad).
 *
 * @param {string} contributionId
 * @param {string|null} newTripItemId
 * @returns {Promise<{ previousTripItemId: string|null, newTripItemId: string|null, originalTripItemIdRecorded: boolean }>}
 */
export async function reassignContributionTripItem(contributionId, newTripItemId) {
  if (!contributionId) throw new Error('reassignContributionTripItem: falta id.');

  // Normaliza cadena vacía a null. Acepta null o string no vacío como entrada.
  const normalizedNew =
    newTripItemId === null || newTripItemId === undefined || newTripItemId === ''
      ? null
      : String(newTripItemId);

  const result = await runTransaction(db, async (tx) => {
    const cRef = doc(db, C_PRIVATE, contributionId);
    const cSnap = await tx.get(cRef);
    if (!cSnap.exists()) throw new Error('Contribución no encontrada.');
    const c = cSnap.data();

    const oldTripItemId = c.tripItemId || null;
    if (oldTripItemId === normalizedNew) {
      // No-op: misma partida o ambos null.
      return {
        previousTripItemId: oldTripItemId,
        newTripItemId: normalizedNew,
        originalTripItemIdRecorded: false,
      };
    }

    const isPaid = c.paymentStatus === 'paid';
    const amount = c.amount && c.amount > 0 ? Number(c.amount) : 0;
    const shouldRebalance = isPaid && amount > 0;

    // Lecturas previas a cualquier write (regla de read-before-write
    // de las transacciones de Firestore). Lectura defensiva de la partida
    // nueva para validar existencia; lectura de la partida vieja solo si
    // hay que decrementarla.
    if (normalizedNew !== null) {
      const newSnap = await tx.get(doc(db, C_TRIP, normalizedNew));
      if (!newSnap.exists()) {
        throw new Error(`Partida ${normalizedNew} no existe.`);
      }
    }
    if (shouldRebalance && oldTripItemId !== null) {
      // Lectura para satisfacer read-before-write antes del update.
      await tx.get(doc(db, C_TRIP, oldTripItemId));
    }

    // Mirror público: leer si existe para actualizar `tripItemId`. Si no
    // existe (fue borrado antes), se omite sin abortar la transacción.
    let mirrorExists = false;
    if (c.publicMessageId) {
      const mSnap = await tx.get(doc(db, C_PUBLIC, c.publicMessageId));
      mirrorExists = mSnap.exists();
    }

    // 1. Update de la contribution. `originalTripItemId` solo se escribe
    //    la primera vez que se reasigna (preserva la elección original).
    const updateData = {
      tripItemId: normalizedNew,
      manuallyAssignedAt: serverTimestamp(),
    };
    const isFirstReassignment = !('originalTripItemId' in c);
    if (isFirstReassignment) {
      updateData.originalTripItemId = oldTripItemId;
    }
    tx.update(cRef, updateData);

    // 2. Update del mirror público para que la cara visible (muro de
    //    mensajes, asociación con la partida) quede coherente.
    if (c.publicMessageId && mirrorExists) {
      tx.update(doc(db, C_PUBLIC, c.publicMessageId), {
        tripItemId: normalizedNew,
      });
    }

    // 3. Reajuste de contadores. Solo se mueven entre partidas; el total
    //    global no cambia.
    if (shouldRebalance) {
      if (oldTripItemId !== null) {
        tx.update(doc(db, C_TRIP, oldTripItemId), {
          raisedAmount: increment(-amount),
          contributorCount: increment(-1),
        });
      }
      if (normalizedNew !== null) {
        tx.update(doc(db, C_TRIP, normalizedNew), {
          raisedAmount: increment(amount),
          contributorCount: increment(1),
        });
      }
    }

    return {
      previousTripItemId: oldTripItemId,
      newTripItemId: normalizedNew,
      originalTripItemIdRecorded: isFirstReassignment,
    };
  });

  // Confirmar ack del servidor antes de declarar éxito al admin. Mismo
  // motivo que en createContribution: la persistencia offline de Firestore
  // resuelve la transacción contra cache local antes de la confirmación
  // real del servidor.
  await awaitServerAck();

  return result;
}

/**
 * Edita el `amount` de una contribución existente reajustando los
 * contadores afectados.
 *
 * Diseño:
 *  - Si la contribución está `pending`, simplemente `updateDoc` del amount
 *    (los contadores aún no se han tocado; ya se incrementarán al marcar
 *    pagada con el nuevo importe).
 *  - Si está `paid`, en `runTransaction` calcula `delta = newAmount - oldAmount`
 *    y aplica `delta` a los 4 contadores (tripItem si aplica + config
 *    siempre). Actualiza también `contributions.amount`.
 *  - NO toca `paymentStatus` ni `paidAt`. Solo cambia el importe.
 *  - NO existe `messageWall.amount` (los importes son privados), así que
 *    no hay mirror que actualizar.
 *
 * Validaciones:
 *  - newAmount debe ser número finito >= 0. Se redondea/normaliza igual
 *    que el resto del código.
 *  - Si la contribución no existe, lanza error.
 *  - Si oldAmount era null y la contribución está paid, se trata como 0
 *    para el cálculo del delta (caso patológico; admite recovery).
 *
 * @param {string} contributionId
 * @param {number} newAmount
 */
export async function updateContributionAmount(contributionId, newAmount) {
  if (!contributionId) throw new Error('updateContributionAmount: falta id.');
  if (!Number.isFinite(Number(newAmount)) || Number(newAmount) < 0) {
    throw new Error('updateContributionAmount: importe inválido.');
  }

  const normalizedNew = Number(newAmount) > 0 ? Number(newAmount) : null;

  await runTransaction(db, async (tx) => {
    const cRef = doc(db, C_PRIVATE, contributionId);
    const cSnap = await tx.get(cRef);
    if (!cSnap.exists()) throw new Error('Contribución no encontrada.');
    const c = cSnap.data();

    const oldAmount = c.amount && c.amount > 0 ? Number(c.amount) : 0;
    const newNumeric = normalizedNew || 0;
    const isPaid = c.paymentStatus === 'paid';

    // Si está paid y vamos a tocar la partida, lectura previa para
    // satisfacer read-before-write.
    if (isPaid && c.tripItemId && (oldAmount > 0 || newNumeric > 0)) {
      await tx.get(doc(db, C_TRIP, c.tripItemId));
    }

    // Actualizar amount (siempre).
    tx.update(cRef, {
      amount: normalizedNew,
      // Si pasa a 0/null, el flag de privacidad pierde sentido.
      amountPrivate: normalizedNew ? Boolean(c.amountPrivate) : false,
    });

    // Si no estaba pagada, los contadores nunca se incrementaron. Nada más.
    if (!isPaid) return;

    const delta = newNumeric - oldAmount;
    if (delta === 0) return;

    if (c.tripItemId) {
      // contributorCount no cambia: la persona ya estaba contada.
      tx.update(doc(db, C_TRIP, c.tripItemId), {
        raisedAmount: increment(delta),
      });
    }

    tx.set(
      doc(db, C_CONFIG, 'general'),
      {
        totalRaised: increment(delta),
      },
      { merge: true }
    );
  });
}
