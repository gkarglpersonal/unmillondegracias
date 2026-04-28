/**
 * Seed inicial de Firestore.
 *
 * Uso:
 *   1. Descargar service account desde Firebase Console -> Project Settings -> Service accounts.
 *   2. Guardarlo como `service-account.json` en la raíz del proyecto (gitignored).
 *   3. Ejecutar: `npm run seed`
 *
 * Idempotente: usa IDs deterministas (`tripItem-01`...`tripItem-25`).
 * Volver a correrlo sobreescribe las partidas pero NO borra contribuciones existentes.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

// Para que `import()` dinámico funcione en Windows, hay que pasar una URL
// `file://`, no una ruta absoluta `C:\...`. `pathToFileURL` la convierte.
const seedModuleUrl = pathToFileURL(
  resolve(projectRoot, 'src/content/seedTripItems.js')
).href;
const { seedTripItems, seedConfig } = await import(seedModuleUrl);

const credentialsPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS || resolve(projectRoot, 'service-account.json');

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(credentialsPath, 'utf-8'));
} catch (err) {
  console.error(`\nNo se pudo leer service account en: ${credentialsPath}`);
  console.error(`Descárgalo desde: Firebase Console -> Project Settings -> Service accounts.\n`);
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function seed() {
  console.log('→ Sembrando partidas del viaje...');
  const batch = db.batch();

  seedTripItems.forEach((item, idx) => {
    const id = `tripItem-${String(idx + 1).padStart(2, '0')}`;
    const ref = db.collection('tripItems').doc(id);
    batch.set(ref, {
      ...item,
      raisedAmount: 0,
      contributorCount: 0,
      active: true,
    });
  });

  await batch.commit();
  console.log(`  ✓ ${seedTripItems.length} partidas creadas / actualizadas.`);

  console.log('→ Sembrando config/general...');
  await db.collection('config').doc('general').set(seedConfig, { merge: true });
  console.log('  ✓ config/general listo.');

  console.log('\n✅ Seed completo.');
  console.log(`   Total objetivo placeholder: ${seedConfig.totalTripCost} €`);
  console.log(`   Suma de partidas: ${seedTripItems.reduce((a, b) => a + b.targetAmount, 0)} €`);
}

seed().catch((err) => {
  console.error('Error en seed:', err);
  process.exit(1);
});
