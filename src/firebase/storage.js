import {
  ref,
  uploadBytes,
  getDownloadURL,
  getBlob,
  deleteObject,
} from 'firebase/storage';
import { storage } from './config.js';

/**
 * Descarga un blob desde Storage probando dos estrategias en orden:
 *
 *  1. Preferida: getDownloadURL + fetch. La URL incluye un media token
 *     y se sirve desde el endpoint público de Firebase Storage; el
 *     token actúa como auth y la respuesta lleva CORS abierto, así
 *     que fetch funciona desde cualquier origen sin configurar el
 *     bucket.
 *  2. Fallback: getBlob del SDK. XHR directo al bucket, requiere
 *     CORS pero algunos navegadores con extensiones que bloquean
 *     fetch en third-party permiten el XHR del SDK.
 *
 * Si ambas fallan, propaga un Error compuesto con el detalle de las
 * dos rutas, que el caller surface a la UI admin.
 */
async function downloadBlobByPath(srcRef) {
  // Intento 1: getDownloadURL + fetch
  let urlAttemptError = null;
  try {
    const url = await getDownloadURL(srcRef);
    try {
      const response = await fetch(url);
      if (response.ok) return await response.blob();
      urlAttemptError = `fetch HTTP ${response.status}`;
    } catch (fetchErr) {
      urlAttemptError = `fetch: ${fetchErr?.message || fetchErr}`;
    }
  } catch (urlErr) {
    urlAttemptError = `getDownloadURL: ${urlErr?.code || urlErr?.message || urlErr}`;
  }

  // Intento 2: SDK getBlob
  try {
    return await getBlob(srcRef);
  } catch (sdkErr) {
    const sdkDetail = sdkErr?.code || sdkErr?.message || String(sdkErr);
    throw new Error(
      `descarga falló — URL: ${urlAttemptError}; SDK getBlob: ${sdkDetail}`
    );
  }
}

/**
 * Tiempo máximo que esperamos a que termine una subida a Storage antes de
 * darla por estancada. Sin esto, una subida sobre una conexión móvil débil
 * que va goteando bytes (sin cortar la conexión del todo) puede dejar la
 * promise de `uploadBytes` sin resolver NI rechazar para siempre: el catch
 * del llamador nunca salta y el botón se queda clavado en "Enviando…".
 *
 * Mismo patrón que `awaitServerAck` en `contributions.js`: una carrera contra
 * un temporizador que rechaza con un `code` propio para que el llamador lo
 * distinga y muestre copy específico ("la foto tarda demasiado").
 */
const UPLOAD_TIMEOUT_MS = 60000;

/**
 * Genera un id único corto, sin colisiones prácticas.
 */
function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Limpia el nombre del archivo y obtiene la extensión.
 */
function nameParts(file) {
  const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase().slice(0, 6);
  const slug = (file.name || 'foto')
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'foto';
  return { ext, slug };
}

/**
 * Sube una foto a `photos/pending/{id}-{slug}.{ext}`.
 *
 * IMPORTANTE: NO obtiene URL pública. La foto vive en un path privado
 * solo legible por admin hasta que se apruebe (entonces se mueve a
 * `photos/approved/`). Esto evita que una URL pueda filtrar la imagen
 * antes de la moderación o tras un rechazo.
 *
 * @param {File} file
 * @param {{ contributionId?: string }} opts
 * @returns {Promise<{ storagePath: string }>}
 */
export async function uploadPhoto(file, { contributionId } = {}) {
  const { ext, slug } = nameParts(file);
  const id = contributionId || newId();
  const storagePath = `photos/pending/${id}-${slug}.${ext}`;

  const storageRef = ref(storage, storagePath);

  // Carrera contra un temporizador: si la subida se estanca, rechazamos con
  // `code: 'upload-timeout'` para que el catch de fase 'photo' del llamador
  // se dispare y el botón se desbloquee. NOTA: `uploadBytes` no es cancelable,
  // así que la petición subyacente puede seguir corriendo en segundo plano
  // tras perder la carrera; no consume recursos relevantes y el reintento es
  // idempotente (mismo path estable por contributionId).
  await Promise.race([
    uploadBytes(storageRef, file, { contentType: file.type }),
    new Promise((_, reject) =>
      setTimeout(() => {
        const err = new Error(
          'Tiempo de espera agotado al subir la foto a Storage.'
        );
        err.code = 'upload-timeout';
        reject(err);
      }, UPLOAD_TIMEOUT_MS)
    ),
  ]);

  return { storagePath };
}

/**
 * Mueve una foto desde su path actual (típicamente `photos/pending/...`)
 * a `photos/approved/{newId}-{nombreOriginal}` y devuelve la nueva URL
 * pública. Implementación: descarga el blob, lo sube al nuevo path y
 * borra el viejo. (Firebase Storage no expone una operación nativa de
 * mover/renombrar desde el SDK web.)
 *
 * Solo el admin puede ejecutar esto correctamente; las reglas exigen
 * autenticación admin para escribir en /approved/ y para leer/borrar
 * en /pending/.
 *
 * @param {string} currentStoragePath
 * @returns {Promise<{ newStoragePath: string, publicUrl: string }>}
 */
export async function movePhotoToApproved(currentStoragePath) {
  if (!currentStoragePath) {
    throw new Error('movePhotoToApproved: storagePath vacío.');
  }

  const srcRef = ref(storage, currentStoragePath);

  // Conserva el nombre del archivo (parte tras la última /). Si la foto
  // ya estaba en approved/, no la duplicamos.
  const fileName = currentStoragePath.split('/').pop();
  if (currentStoragePath.startsWith('photos/approved/')) {
    const publicUrl = await getDownloadURL(srcRef);
    return { newStoragePath: currentStoragePath, publicUrl };
  }

  const newStoragePath = `photos/approved/${fileName}`;
  const dstRef = ref(storage, newStoragePath);

  // 1. Descargar blob desde el path origen (admin tiene permiso de read).
  let blob;
  try {
    blob = await downloadBlobByPath(srcRef);
  } catch (err) {
    throw new Error(`[descargar pending] ${err?.message || err}`);
  }

  // 2. Subir al destino approved/. Pasamos un content-type explícito;
  // si el blob viene de fetch sin Content-Type, el SDK lo guardaría como
  // application/octet-stream y los <img> de la galería no lo renderizan.
  try {
    await uploadBytes(dstRef, blob, {
      contentType: blob.type || 'image/jpeg',
    });
  } catch (err) {
    throw new Error(`[subir approved] ${err?.code || err?.message || err}`);
  }

  // 3. Obtener URL pública del destino.
  let publicUrl;
  try {
    publicUrl = await getDownloadURL(dstRef);
  } catch (err) {
    throw new Error(`[URL aprobada] ${err?.code || err?.message || err}`);
  }

  // 4. Borrar el origen. Si falla, lo dejamos (el doc ya apunta al nuevo
  //    path); el admin puede limpiarlo después manualmente.
  try {
    await deleteObject(srcRef);
  } catch (err) {
    console.warn('movePhotoToApproved: no se pudo borrar el origen:', currentStoragePath, err?.code);
  }

  return { newStoragePath, publicUrl };
}

/**
 * Mueve una foto desde `photos/approved/...` de vuelta a
 * `photos/pending/{newId}-{nombreOriginal}` y devuelve el nuevo path.
 * Inverso de `movePhotoToApproved`: se usa al "desaprobar" una foto
 * para garantizar que el blob deja de ser legible públicamente.
 *
 * Implementación: descarga el blob desde el path origen, lo sube al
 * nuevo path en `pending/` y borra el viejo. (Storage no expone
 * mover/renombrar nativamente desde el SDK web.) NO devuelve URL
 * pública: las fotos en `pending/` solo son legibles por admin.
 *
 * Idempotente: si el path ya está bajo `photos/pending/`, devuelve el
 * mismo path sin hacer nada (igual criterio que `movePhotoToApproved`
 * cuando el path ya está bajo `approved/`).
 *
 * Robustez: si la copia al destino falla, propaga el error y deja el
 * estado intacto. Si la copia tiene éxito pero el borrado del origen
 * falla, deja un warning y NO propaga: un blob duplicado en `pending/`
 * (privado) es preferible a que el blob siga accesible en `approved/`.
 *
 * Solo el admin puede ejecutar esto correctamente; las reglas exigen
 * autenticación admin para escribir en /pending/ y para leer/borrar
 * en /approved/.
 *
 * @param {string} currentApprovedPath
 * @returns {Promise<{ newStoragePath: string }>}
 */
export async function movePhotoToPending(currentApprovedPath) {
  if (!currentApprovedPath) {
    throw new Error('movePhotoToPending: storagePath vacío.');
  }

  // Idempotencia: ya está en pending/, no hacemos nada.
  if (currentApprovedPath.startsWith('photos/pending/')) {
    return { newStoragePath: currentApprovedPath };
  }

  const srcRef = ref(storage, currentApprovedPath);

  // Conserva el nombre del archivo (parte tras la última /).
  const fileName = currentApprovedPath.split('/').pop();
  const newStoragePath = `photos/pending/${fileName}`;
  const dstRef = ref(storage, newStoragePath);

  // 1. Descargar blob desde approved/ (admin tiene permiso de read).
  let blob;
  try {
    blob = await downloadBlobByPath(srcRef);
  } catch (err) {
    throw new Error(`[descargar approved] ${err?.message || err}`);
  }

  // 2. Subir al destino pending/. Si esto falla, propagamos el error y
  //    el estado queda como estaba (nada movido).
  try {
    await uploadBytes(dstRef, blob, {
      contentType: blob.type || 'image/jpeg',
    });
  } catch (err) {
    throw new Error(`[subir pending] ${err?.code || err?.message || err}`);
  }

  // 3. Borrar el origen. Si falla, lo dejamos: el blob duplicado en
  //    pending/ es privado, y el doc apuntará al nuevo path. Lo peor
  //    sería propagar y dejar el blob aprobado todavía accesible.
  try {
    await deleteObject(srcRef);
  } catch (err) {
    console.warn(
      'movePhotoToPending: no se pudo borrar el origen aprobado:',
      currentApprovedPath,
      err?.code
    );
  }

  return { newStoragePath };
}

/**
 * Borra un blob por su path. Admin-only (las reglas lo exigen para
 * /pending/ y /approved/).
 */
export async function deletePhotoByPath(storagePath) {
  if (!storagePath) return;
  try {
    await deleteObject(ref(storage, storagePath));
  } catch (err) {
    console.warn('deletePhotoByPath:', storagePath, err?.code || err?.message);
  }
}

/**
 * Versión que propaga el error subyacente (a diferencia de
 * `getAdminPhotoUrl`, que silencia con null). Se usa en flujos de
 * recovery donde el caller necesita distinguir "blob existe y se
 * puede leer" de "blob no existe / permiso denegado".
 */
export async function getStorageDownloadUrl(storagePath) {
  if (!storagePath) {
    throw new Error('getStorageDownloadUrl: storagePath vacío.');
  }
  return getDownloadURL(ref(storage, storagePath));
}

/**
 * Devuelve una URL temporal con token para que el admin pueda previsualizar
 * una foto en /pending/. Falla si el usuario no es admin (las reglas lo
 * impiden). No usar en código público.
 */
export async function getAdminPhotoUrl(storagePath) {
  if (!storagePath) return null;
  try {
    return await getDownloadURL(ref(storage, storagePath));
  } catch (err) {
    console.warn('getAdminPhotoUrl:', storagePath, err?.code || err?.message);
    return null;
  }
}

// Alias retro-compatible: algunos sitios del código antiguo pueden
// importar `deletePhoto`. Lo mantenemos exportado pero apuntando a la
// nueva implementación.
export const deletePhoto = deletePhotoByPath;
