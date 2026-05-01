/**
 * Detección y conversión de fotos HEIC/HEIF a JPEG en el cliente.
 *
 * Por qué cliente: las fotos de iPhone modernas suben en HEIC. Ese formato
 * no se renderiza en Chrome/Firefox/Edge ni se procesa con
 * browser-image-compression. Sin conversión, el upload falla con un error
 * genérico para el usuario.
 *
 * Por qué heic2any: pure-JS (libheif compilado a wasm), MIT, sin servicios
 * externos, sin coste. La carga vía dynamic import: el wasm pesa ~3 MB y
 * solo lo bajamos cuando alguien sube HEIC.
 */

const HEIC_MIME = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'];

export function isHeic(file) {
  if (!file) return false;
  const type = (file.type || '').toLowerCase();
  if (HEIC_MIME.includes(type)) return true;
  const name = (file.name || '').toLowerCase();
  return name.endsWith('.heic') || name.endsWith('.heif');
}

/**
 * Convierte un File HEIC/HEIF a un File JPEG. Tira si no se puede
 * (permite al caller mostrar un mensaje claro de "formato no compatible").
 *
 * @param {File} file
 * @returns {Promise<File>} JPEG con extensión .jpg
 */
export async function convertHeicToJpeg(file) {
  const { default: heic2any } = await import('heic2any');
  const result = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.85,
  });
  // heic2any puede devolver Blob o Blob[] (HEIC multi-imagen); cogemos el primero.
  const blob = Array.isArray(result) ? result[0] : result;
  const newName = (file.name || 'foto').replace(/\.(heic|heif)$/i, '') + '.jpg';
  return new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() });
}
