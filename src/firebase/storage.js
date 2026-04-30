import {
  ref,
  uploadBytes,
  getDownloadURL,
  getBlob,
  deleteObject,
} from 'firebase/storage';
import { storage } from './config.js';

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
  const blob = await getBlob(srcRef);

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
