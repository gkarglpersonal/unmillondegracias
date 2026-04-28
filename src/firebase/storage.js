import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config.js';

/**
 * Sube un archivo de imagen a Storage.
 * El path es: photos/{timestamp}-{random}-{slug}.{ext}
 * Devuelve { path, url }.
 */
export async function uploadPhoto(file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const slug = (file.name || 'foto')
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 40);
  const path = `photos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${slug}.${ext}`;

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type });
  const url = await getDownloadURL(storageRef);
  return { path, url };
}

export async function deletePhoto(path) {
  if (!path) return;
  try {
    await deleteObject(ref(storage, path));
  } catch (err) {
    console.warn('No se pudo borrar foto:', path, err.code);
  }
}
