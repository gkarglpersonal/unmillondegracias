import imageCompression from 'browser-image-compression';

/**
 * Comprime una imagen para subida.
 * - máx 1.5 MB
 * - máx 2400 px lado largo
 * - mantiene EXIF orientation
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
    console.warn('Compresión falló, subiendo original:', err);
    return file;
  }
}
