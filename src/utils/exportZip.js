import JSZip from 'jszip';

/**
 * Descarga todas las fotos aprobadas, las empaqueta en un ZIP, y dispara la
 * descarga. Usa la URL pública de Storage (con token de getDownloadURL).
 *
 * Recibe un array de items messageWall con `photoUrl`, `name`, `createdAt`.
 * Llama a onProgress({current, total}) durante la descarga si se pasa.
 */
export async function generatePhotosZip(photos, onProgress) {
  const zip = new JSZip();
  const total = photos.length;
  let current = 0;

  for (const p of photos) {
    if (!p.photoUrl) continue;
    try {
      const res = await fetch(p.photoUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const ext = guessExtension(blob.type, p.photoUrl);
      const dateStr = p.createdAt?.toDate
        ? p.createdAt.toDate().toISOString().slice(0, 10)
        : 'sin-fecha';
      const safeName = slug(p.name || 'anonimo');
      const filename = `${dateStr}__${safeName}__${p.id.slice(0, 6)}.${ext}`;
      zip.file(filename, blob);
    } catch (err) {
      console.warn('No se pudo descargar foto', p.id, err);
    }
    current++;
    onProgress?.({ current, total });
  }

  return await zip.generateAsync({ type: 'blob', compression: 'STORE' });
}

function guessExtension(mime, url) {
  if (mime?.includes('jpeg')) return 'jpg';
  if (mime?.includes('png')) return 'png';
  if (mime?.includes('webp')) return 'webp';
  if (mime?.includes('heic')) return 'heic';
  // fallback: parse de la URL
  const m = /\.([a-z]{3,4})(?:\?|$)/i.exec(url || '');
  return m ? m[1].toLowerCase() : 'jpg';
}

function slug(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'anonimo';
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
