import imageCompression from 'browser-image-compression';

// Si la compresión falla y el archivo original sigue por encima de este
// tamaño, NO lo subimos a ciegas: un archivo pesado sobre una conexión móvil
// débil es justo lo que estanca la subida y deja el botón clavado en
// "Enviando…". Mejor rechazar aquí, al elegir la foto, con un mensaje claro.
// 3 MB da margen sobre el objetivo de 1.5 MB sin bloquear fotos razonables.
const FALLBACK_MAX_BYTES = 3 * 1024 * 1024;

/**
 * Comprime una imagen para subida.
 * - máx 1.5 MB
 * - máx 2400 px lado largo
 * - mantiene EXIF orientation
 *
 * Si la compresión falla, devuelve el original SOLO si es lo bastante ligero
 * para subirse con seguridad. Si el original sigue siendo grande, lanza un
 * Error con `code: 'image-too-large'` en lugar de subir a ciegas algo que
 * probablemente estancará la subida.
 */
export async function compressImage(file) {
  if (!file || !file.type.startsWith('image/')) return file;
  try {
    return await imageCompression(file, {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 2400,
      useWebWorker: true,
      preserveExif: false,
      fileType: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
    });
  } catch (err) {
    console.warn('Compresión falló:', err);
    if (file.size > FALLBACK_MAX_BYTES) {
      const tooLarge = new Error(
        'La compresión falló y el archivo original es demasiado pesado para subirse.'
      );
      tooLarge.code = 'image-too-large';
      throw tooLarge;
    }
    // Original suficientemente ligero: aceptable subir tal cual.
    return file;
  }
}
