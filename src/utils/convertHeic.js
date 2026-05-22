/**
 * Detección y conversión de fotos HEIC/HEIF a JPEG en el cliente.
 *
 * Por qué cliente: las fotos de iPhone modernas suben en HEIC. Ese formato
 * no se renderiza en Chrome/Firefox/Edge ni se procesa con
 * browser-image-compression. Sin conversión, el upload falla con un error
 * genérico para el usuario.
 *
 * Por qué heic-to: usa una build moderna de libheif compilada a wasm
 * (libheif-js), MIT, sin servicios externos ni coste. A diferencia de
 * heic2any@0.0.4 (libheif antiguo), decodifica también el HEIC que generan
 * los móviles Samsung (verificado con un Galaxy S24 Ultra real). La carga va
 * por dynamic import: el wasm solo se baja cuando alguien sube un HEIC.
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
 * Convierte un File HEIC/HEIF a un File JPEG. Tira si no se puede, para que
 * el caller muestre un mensaje honesto de que la foto no se pudo procesar
 * (NO un falso "formato no compatible, sube JPG/PNG/WEBP").
 *
 * @param {File} file
 * @returns {Promise<File>} JPEG con extensión .jpg
 */
export async function convertHeicToJpeg(file) {
  // heic-to expone `heicTo`, que devuelve un único Blob JPEG.
  const { heicTo } = await import('heic-to');
  const blob = await heicTo({
    blob: file,
    type: 'image/jpeg',
    quality: 0.85,
  });
  const newName = (file.name || 'foto').replace(/\.(heic|heif)$/i, '') + '.jpg';
  return new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() });
}
