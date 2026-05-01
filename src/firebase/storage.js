import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from './config.js';

/**
 * Descarga el blob de un objeto de Storage usando getDownloadURL + fetch.
 *
 * Por qué no `getBlob` del SDK: getBlob hace XHR directo al endpoint REST
 * del bucket, lo que requiere que el bucket tenga CORS configurado para
 * el origen que llama. En despliegues con dominio custom (GitHub Pages +
 * CNAME) sin CORS configurado, getBlob queda esperando indefinidamente
 * en algunos navegadores en lugar de fallar limpio — ese era el síntoma
 * "Aprobando…" colgado en /admin → Fotos.
 *
 * Las URLs que devuelve getDownloadURL incluyen un media token; sirven
 * desde un endpoint configurado con CORS abierto, así que `fetch` sobre
 * ellas funciona desde cualquier origen sin configurar el bucket.
 */
async function downloadBlobByPath(srcRef) {
  const url = await getDownloadURL(srcRef);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `No se pudo descargar la foto desde Storage (HTTP ${response.status}).`
    );
  }
  return response.blob();
}

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
  await uploadBytes(storageRef, file, { contentType: file.type });

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
  const blob = await downloadBlobByPath(srcRef);

  // 2. Subir al destino approved/.
  await uploadBytes(dstRef, blob, { contentType: blob.type || undefined });

  // 3. Obtener URL pública del destino.
  const publicUrl = await getDownloadURL(dstRef);

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
  const blob = await downloadBlobByPath(srcRef);

  // 2. Subir al destino pending/. Si esto falla, propagamos el error y
  //    el estado queda como estaba (nada movido).
  await uploadBytes(dstRef, blob, { contentType: blob.type || undefined });

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
