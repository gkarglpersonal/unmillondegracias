/**
 * Migración de fotos existentes al nuevo esquema de privacidad.
 *
 * Estado anterior: las fotos vivían en `photos/{filename}` (sin
 * subcarpeta) y `photos/{name}` era de lectura pública. Cualquiera con
 * la URL podía ver la foto, incluso tras un rechazo.
 *
 * Estado nuevo:
 *   - photos/pending/{filename}  — privado, solo admin lee.
 *   - photos/approved/{filename} — público (lectura abierta).
 *
 * Este script:
 *   1. Lista todos los blobs en `photos/` que NO estén ya en pending/
 *      o approved/.
 *   2. Para cada blob, busca el doc `messageWall` cuyo
 *      `photoStoragePath` coincida.
 *   3. Si `messageWall.photoApproved === true`, mueve a
 *      `photos/approved/{filename}` (copy + delete) y actualiza el doc:
 *      `photoStoragePath` al nuevo path y `photoUrl` a la nueva URL
 *      pública.
 *   4. Si no aprobado (o no hay doc), mueve a
 *      `photos/pending/{filename}` y, si hay doc, fija `photoUrl: null`.
 *   5. Loggea progreso. Idempotente: blobs ya en pending/ o approved/
 *      se ignoran. Si vuelves a ejecutarlo, no duplica nada.
 *
 * Uso:
 *   1. Asegúrate de tener `service-account.json` en la raíz (o exporta
 *      GOOGLE_APPLICATION_CREDENTIALS).
 *   2. Asegúrate de que `.env` define `VITE_FIREBASE_STORAGE_BUCKET`
 *      (o pasa STORAGE_BUCKET=... como env var).
 *   3. Ejecuta:  node scripts/migrateExistingPhotos.js
 *
 * Modo dry-run (no escribe nada): añade `--dry-run`.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

const DRY_RUN = process.argv.includes('--dry-run');

const credentialsPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  resolve(projectRoot, 'service-account.json');

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(credentialsPath, 'utf-8'));
} catch {
  console.error(`\nNo se pudo leer service account en: ${credentialsPath}`);
  console.error('Descárgalo desde: Firebase Console -> Project Settings -> Service accounts.\n');
  process.exit(1);
}

const storageBucket =
  process.env.STORAGE_BUCKET ||
  process.env.VITE_FIREBASE_STORAGE_BUCKET ||
  `${serviceAccount.project_id}.appspot.com`;

initializeApp({
  credential: cert(serviceAccount),
  storageBucket,
});

const db = getFirestore();
const bucket = getStorage().bucket();

console.log(`Bucket: ${bucket.name}`);
console.log(`Modo: ${DRY_RUN ? 'DRY-RUN (no escribe)' : 'EJECUCIÓN REAL'}\n`);

/**
 * Mueve un blob de origen a destino y borra el origen si todo OK.
 * Devuelve la URL pública con token (permanente, similar a la del SDK
 * web).
 */
async function moveBlob(srcPath, dstPath) {
  const srcFile = bucket.file(srcPath);
  const dstFile = bucket.file(dstPath);

  if (DRY_RUN) {
    return { newPath: dstPath, publicUrl: null };
  }

  // Genera un download token nuevo en el destino (formato del SDK web).
  const downloadToken = randomUUID();

  await srcFile.copy(dstFile, {
    metadata: {
      metadata: { firebaseStorageDownloadTokens: downloadToken },
    },
  });
  await srcFile.delete();

  const encodedPath = encodeURIComponent(dstPath);
  const publicUrl =
    `https://firebasestorage.googleapis.com/v0/b/${bucket.name}` +
    `/o/${encodedPath}?alt=media&token=${downloadToken}`;
  return { newPath: dstPath, publicUrl };
}

/**
 * Busca el doc messageWall que apunte a `oldPath` mediante
 * `photoStoragePath`. Si no encuentra, intenta también por nombre de
 * archivo dentro de `photoUrl` (por si quedaron docs antiguos sin
 * `photoStoragePath`).
 */
async function findMessageDoc(oldPath) {
  const fileName = oldPath.split('/').pop();

  // Coincidencia exacta por photoStoragePath (lo más común).
  const exact = await db
    .collection('messageWall')
    .where('photoStoragePath', '==', oldPath)
    .limit(1)
    .get();
  if (!exact.empty) return exact.docs[0];

  // Fallback: docs con `photoUrl` que contenga el nombre de archivo.
  // Hacemos un escaneo (debería ser una cantidad pequeña). Lo
  // mantenemos simple para no construir índices ad hoc.
  const all = await db.collection('messageWall').get();
  for (const d of all.docs) {
    const data = d.data();
    if (typeof data.photoUrl === 'string' && data.photoUrl.includes(encodeURIComponent(oldPath))) {
      return d;
    }
    if (typeof data.photoUrl === 'string' && data.photoUrl.includes(fileName)) {
      return d;
    }
  }
  return null;
}

async function listLegacyPhotos() {
  // getFiles({ prefix: 'photos/' }) trae todos los descendientes. Filtramos
  // los que YA están en pending/ o approved/ (idempotencia).
  const [files] = await bucket.getFiles({ prefix: 'photos/' });
  return files.filter((f) => {
    const name = f.name;
    if (name.startsWith('photos/pending/')) return false;
    if (name.startsWith('photos/approved/')) return false;
    if (name === 'photos/' || name.endsWith('/')) return false;
    // Solo nivel raíz dentro de photos/, sin más subcarpetas.
    const rest = name.slice('photos/'.length);
    if (rest.includes('/')) return false;
    return true;
  });
}

async function main() {
  const legacy = await listLegacyPhotos();
  console.log(`Encontrados ${legacy.length} blobs legacy en photos/ (sin subcarpeta).\n`);

  if (legacy.length === 0) {
    console.log('Nada que migrar. ✅');
    return;
  }

  const stats = {
    movedToApproved: 0,
    movedToPending: 0,
    docsUpdated: 0,
    blobsWithoutDoc: 0,
    errors: 0,
  };

  for (const file of legacy) {
    const oldPath = file.name;
    const fileName = oldPath.split('/').pop();
    try {
      const docSnap = await findMessageDoc(oldPath);
      const data = docSnap?.data();
      const isApproved = data?.photoApproved === true;
      const targetDir = isApproved ? 'photos/approved' : 'photos/pending';
      const newPath = `${targetDir}/${fileName}`;

      console.log(
        `→ ${oldPath}  -->  ${newPath}` +
          (docSnap ? `  (doc ${docSnap.id}${isApproved ? ', aprobada' : ', pendiente'})` : '  (sin doc)')
      );

      if (!DRY_RUN) {
        const { publicUrl } = await moveBlob(oldPath, newPath);
        if (isApproved) stats.movedToApproved++;
        else stats.movedToPending++;

        if (docSnap) {
          const update = { photoStoragePath: newPath };
          if (isApproved) {
            update.photoUrl = publicUrl;
          } else {
            update.photoUrl = null;
          }
          await docSnap.ref.update(update);
          stats.docsUpdated++;
        } else {
          stats.blobsWithoutDoc++;
        }
      } else {
        // En dry-run solo contamos.
        if (isApproved) stats.movedToApproved++;
        else stats.movedToPending++;
        if (docSnap) stats.docsUpdated++;
        else stats.blobsWithoutDoc++;
      }
    } catch (err) {
      console.error(`  ✗ Error con ${oldPath}:`, err?.message || err);
      stats.errors++;
    }
  }

  console.log('\n--- Resumen ---');
  console.log(`Movidos a /approved/   : ${stats.movedToApproved}`);
  console.log(`Movidos a /pending/    : ${stats.movedToPending}`);
  console.log(`Docs actualizados      : ${stats.docsUpdated}`);
  console.log(`Blobs sin doc asociado : ${stats.blobsWithoutDoc}`);
  console.log(`Errores                : ${stats.errors}`);
  console.log(DRY_RUN ? '\n(dry-run: no se ha escrito nada)' : '\n✅ Migración completa.');
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
