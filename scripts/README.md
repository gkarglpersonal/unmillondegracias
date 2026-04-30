# Scripts de mantenimiento

Scripts Node con `firebase-admin` para tareas administrativas que no encajan
en la app de cliente (seed inicial, migraciones de Storage, etc.).

## Requisitos comunes

1. Service account JSON descargado desde
   **Firebase Console -> Project Settings -> Service accounts -> Generate new private key**.
   Guárdalo como `service-account.json` en la raíz del proyecto (está en
   `.gitignore`). Alternativamente, exporta `GOOGLE_APPLICATION_CREDENTIALS`
   apuntando al archivo.
2. Node.js >= 18 (los scripts usan `crypto.randomUUID` global y ESM nativo).
3. Variables de entorno habituales del `.env` (al menos
   `VITE_FIREBASE_STORAGE_BUCKET` para los scripts que tocan Storage).

## Scripts disponibles

### `seed.js`

Crea o actualiza las partidas (`tripItems`) y el doc `config/general` a
partir de `src/content/seedTripItems.js`.

```sh
npm run seed
```

Idempotente: usa IDs deterministas. Volver a correrlo sobreescribe las
partidas pero NO borra contribuciones existentes.

### `migrateExistingPhotos.js`

Migra las fotos antiguas que estaban en `photos/{filename}` (lectura
pública) al nuevo esquema de privacidad:

- `photos/pending/{filename}` — privado, solo admin lee.
- `photos/approved/{filename}` — público.

Para cada blob legacy busca su doc `messageWall` correspondiente:

- Si la foto estaba aprobada (`photoApproved === true`), la mueve a
  `photos/approved/` y actualiza `photoStoragePath` y `photoUrl` en el
  doc.
- Si no está aprobada (o no tiene doc), la mueve a `photos/pending/` y
  fija `photoUrl: null` en el doc (si lo hay).

Idempotente: blobs ya en `pending/` o `approved/` se ignoran. Puedes
correrlo más de una vez sin duplicar nada.

```sh
# Dry-run (no escribe nada, solo lista lo que haría):
node scripts/migrateExistingPhotos.js --dry-run

# Migración real:
node scripts/migrateExistingPhotos.js
```

> **Importante**: ejecutar el script ANTES de desplegar las nuevas reglas
> de Storage produce un estado intermedio donde algunas fotos están en
> rutas privadas pero las reglas viejas siguen permitiendo lectura
> pública del path `photos/{name}`. El orden recomendado es:
>
> 1. Desplegar reglas (`firebase deploy --only storage,firestore:rules`).
>    Las reglas nuevas mantienen un bloque de compat para
>    `/photos/{name}` que solo permite acceso al admin, así que las
>    URLs antiguas ya no funcionarán para el público.
> 2. Ejecutar el script de migración.
