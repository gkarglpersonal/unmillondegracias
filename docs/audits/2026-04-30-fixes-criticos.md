# Fixes críticos post-auditoría — 2026-04-30

## Metadata

- **Fecha**: 2026-04-30
- **Rama**: `claude/modest-poincare-e251bf`
- **Commits añadidos**: 5 (sobre `0895502`)
- **Stats**: +2.144 / −259 líneas, 19 archivos modificados
- **Push**: ✅ a `origin/claude/modest-poincare-e251bf`
- **Deploy**: ✅ `firebase deploy --only storage,firestore:rules` en proyecto `mariangeles-viaje-32169`
- **Pendiente manual**: migración de fotos legacy (`scripts/migrateExistingPhotos.js`)

## TL;DR

Auditoría inicial detectó 25 hallazgos (6 críticos, 12 importantes, 7 menores).
Esta sesión resolvió los **6 críticos** mediante operación coordinada con
agentes especializados en 2 olas, con gates de QA independientes tras cada
ola. Todos los críticos cerrados, 5 commits limpios commitados, rama empujada
a remoto, reglas de Firebase desplegadas en producción. Los 12 importantes y 7
menores quedan fuera de alcance para tandas futuras.

## Contexto y alcance

El proyecto `unmillondegracias.com` es un regalo colectivo a Mariángeles
(viaje a Argentina con PANGEA, lista de bodas 10.500 €). Stack: Vite + React
18 + Firebase (Firestore + Storage + Auth) + EmailJS. Sitio en producción pero
sin tráfico ni campaña activa al momento de esta sesión, lo que permitió
deploys directos sin riesgo de visitantes afectados.

La auditoría de la sesión anterior cubrió tres áreas: visualización/responsive,
UX, y funcionalidad/Firebase. Los 6 críticos identificados:

| # | Problema | Razón de criticidad |
|---|---|---|
| 1 | `storage.rules` permitía `read: if true` para `/photos/{name}`. URL pública desde upload, antes de aprobación. | Privacidad / RGPD; foto inapropiada accesible aunque admin la rechace. |
| 2 | Crear contribución no era atómico: addDoc(messageWall) → addDoc(contribution) → updateDoc. Fallo a mitad dejaba huérfanos. | Datos corruptos en producción. |
| 3 | Botón submit con `disabled={submitting}` evaluado tras el primer handler. Doble clic en mobile = duplicación. | Duplicados, doble email a PANGEA. |
| 4 | `deleteContribution` no decrementaba contadores ni borraba mirror ni foto. `createManualContribution` no atómico. No había `updateContributionAmount`. | Termómetro inflado permanentemente; contadores corruptos. |
| 5 | Borrar partida dejaba contribuciones huérfanas con `tripItemId` inexistente. Campo `active` no usado. | FK rota; UI con fallback silencioso. |
| 6 | EmailJS fallaba con `console.warn` silencioso. Usuario veía SuccessOverlay falso. | Usuario asume que PANGEA le contactará y nunca llega correo. |

## Diseño operacional

### Por qué 2 olas y no 1

Análisis de archivos compartidos entre fixes:

- `ParticipationForm.jsx` lo tocaban #2, #3 y #6 → fusionados en un solo agente.
- `firebase/contributions.js` lo tocaban #2 y #4 → secuenciar.
- `storage.rules` y `firebase/tripItems.js` aislados → paralelizables.

Resultado:

- **Ola 1** (paralelo): 3 agentes con archivos disjuntos.
  - **Agente A**: #1 privacidad de fotos.
  - **Agente B**: #5 integridad de partidas.
  - **Agente C**: #2 + #3 + #6 cirugía de submit.
- **Ola 2** (secuencial tras Ola 1): 1 agente que hereda contributions.js limpio.
  - **Agente D**: #4 contadores admin.

### Por qué QAs separados

Quien escribe el código no es el mejor revisor. Cada agente fue auditado por
un agente QA independiente (read-only) que validaba criterios concretos del
prompt original. Resultado: QA-A detectó 3 puntos del fix #1 que no estaban
completos, lo que disparó una **reparación A'** antes de cerrar el gate.

### Por qué no hubo orquestador separado

La sesión principal (yo) actuó como orquestador. Crear un sub-agente
orquestador habría añadido indirección sin ganancia: la decisión de qué
delegar y cuándo avanzar requiere contexto completo del transcurso, que la
sesión principal ya tiene.

### Estructura del flujo

```
OLA 1 (paralelo)         GATE 1                OLA 2          GATE 2
┌─────────────┐         ┌─────────────┐
│  Agente A   │ ──────▶ │   QA-A      │
│  (#1 fotos) │         │  PASA c/    │
└─────────────┘         │  reparación │
                        └─────────────┘
                              │
                              ▼
                        ┌─────────────┐
                        │ Reparación  │
                        │   A'        │
                        └─────────────┘
                              │
                              ▼
                        ┌─────────────┐
                        │   QA-A'     │
                        │   PASA      │
                        └─────────────┘
┌─────────────┐         ┌─────────────┐
│  Agente B   │ ──────▶ │   QA-B      │ ─────┐
│ (#5 partidas)│        │   PASA      │      │
└─────────────┘         └─────────────┘      │
                                             ▼
┌─────────────┐         ┌─────────────┐    ┌──────────┐    ┌──────────┐
│  Agente C   │ ──────▶ │   QA-C      │ ──▶│ Agente D │ ──▶│  QA-D    │
│ (#2+3+6)    │         │   PASA      │    │  (#4)    │    │   PASA   │
└─────────────┘         └─────────────┘    └──────────┘    └──────────┘
```

## Permisos pre-aprobados por el usuario

Para evitar parar el flujo en cada decisión:

- Trabajar en la rama actual (`claude/modest-poincare-e251bf`), sin crear nueva.
- Un commit por agente, mensaje claro con prefijo `fix(critico-N):`.
- Si encuentro bugs nuevos no relacionados → anotar, no tocar.
- `git push` y `firebase deploy` autorizados sin pedir confirmación.
- Tocar datos en Firestore vía script si fuese necesario para el fix.
- Tope de 30 minutos wall-clock.
- Castellano de Madrid + PANGEA en mayúsculas en todo copy nuevo.

Decisiones técnicas pre-aprobadas:

- **Fix #1**: solución sin Cloud Functions ni URLs firmadas. Path privado
  `photos/pending/` + público `photos/approved/`. Riesgo residual aceptado.
- **Fix #2/#3/#6**: idempotencia + cleanup compensatorio. No se pretende
  atomicidad cross-collection (Firestore no la soporta con Storage).

## Trabajo por crítico

### #1 — Privacidad de fotos

#### Problema original

`storage.rules` permitía `read: if true` para `/photos/{photoName}`. La URL
pública se obtenía en el upload y se guardaba en `messageWall.photoUrl` antes
de aprobación. Cualquiera con la URL veía la foto incluso tras rechazo.

#### Decisión de diseño

- Subir a `photos/pending/{contributionId}.{ext}` (admin-only read).
- Al aprobar: copiar blob a `photos/approved/{newId}.{ext}` (público) y borrar
  el original.
- Al desaprobar: mover el blob físicamente de vuelta a `pending/`, no solo
  desligar el doc.
- `messageWall.photoUrl` siempre `null` al crear; solo se popula tras
  aprobación.
- `firestore.rules.messageWall.create` exige `photoUrl: null` y
  `photoStoragePath` bajo `photos/pending/`.

#### Contrato de interfaz que estableció el Agente A para C y D

```js
// src/firebase/storage.js
export async function uploadPhoto(file, { contributionId } = {}) {
  // Sube a photos/pending/{contributionId}.{ext}
  // Retorna SOLO { storagePath } — NO URL pública, NO getDownloadURL
}

export async function movePhotoToApproved(currentPath) {
  // Copia a photos/approved/{newId}, borra original
  // Retorna { newStoragePath, publicUrl }
}

export async function movePhotoToPending(currentPath) {  // Añadido en A'
  // Inverso. Idempotente si ya está en pending.
}

export async function deletePhotoByPath(storagePath) {
  // Best-effort. Falla silenciosa si no admin (caso cleanup público).
}
```

#### Archivos modificados

- `storage.rules` — separación pending/approved/legacy
- `firestore.rules` — refuerzos sobre messageWall.create
- `src/firebase/storage.js` — nuevas funciones, refactor uploadPhoto
- `src/firebase/messageWall.js` — approvePhoto / unapprovePhoto / rejectPhoto
- `src/components/admin/PhotosModeration.jsx` — usa nuevas funciones
- `src/components/admin/PhotosModeration.module.css`
- `scripts/migrateExistingPhotos.js` — migración de fotos legacy
- `scripts/README.md`

#### Commits

- `4e86769` — Agente A original
- `bb9267f` — Reparación A' (movePhotoToPending + assert path + dry-run paso explícito en README)

#### Veredicto QA

- QA-A: PASA-CON-OBSERVACIONES → 3 puntos a reparar.
- QA-A' (tras reparación): PASA tal cual.

#### Riesgos residuales aceptados

- **Cleanup de foto pending falla por reglas si lo lanza usuario público**:
  `storage.rules` da `delete` admin-only en pending. Si el flujo de
  ParticipationForm cae a cleanup compensatorio, el blob queda huérfano en
  `photos/pending/`. No es fuga (admin-only-read); solo coste de Storage.
  Decisión: aceptable para volumen previsto del proyecto.
- **Concurrencia approve + delete con admin múltiple**: si dos admins
  simultáneos aprueban y borran la misma contribución, el blob puede quedar
  huérfano en `approved/`. El proyecto tiene 1 admin (Gerry), riesgo nulo
  práctico.

### #5 — Integridad de partidas

#### Problema original

`deleteTripItem` borraba la partida sin tocar los `messageWall` ni
`contributions` que apuntaban a ella. UI hacía fallback silencioso a "fondo
general". Campo `active: boolean` del schema sin uso.

#### Decisión de diseño

- **Soft delete por defecto**: `deleteTripItem` ahora delega a
  `archiveTripItem` (`active: false`). Las contribuciones siguen vinculadas.
- **Hard delete opcional**: requiere confirmación; antes valida si hay docs
  apuntando, los reasigna a `tripItemId: null` (fondo general) en batches de
  450 ops, y luego borra el doc.
- **Reactivar**: `unarchiveTripItem` pone `active: true`.

#### Archivos modificados

- `src/firebase/tripItems.js` — nuevas funciones
- `src/firebase/messageWall.js` — `reassignTripItem` con batching
- `src/components/admin/TripItemsManager.jsx` — UI con archivar / panel
  colapsable / modal hard delete
- `src/components/admin/TripItemsManager.module.css`

#### Commit

- `bd68ac3`

#### Veredicto QA

- QA-B: PASA-CON-OBSERVACIONES → modal hard delete usa `contributorCount`
  agregado en lugar de query real. No bloqueante.

#### Riesgos residuales aceptados

- Modal de hard delete muestra `contributorCount` aproximado, no conteo
  exacto de docs reasignables. Anotado como follow-up menor.

### #2 / #3 / #6 — Cirugía de submit

#### Problemas originales

- **#2**: `createContribution` con addDoc no atómico → huérfanos al fallar.
- **#3**: doble clic submit sin defensa síncrona → duplicación.
- **#6**: EmailJS fallaba en silencio con `console.warn`.

#### Decisión de diseño

Idempotencia + cleanup compensatorio + email feedback honesto:

1. **Pre-generar IDs**: `generateContributionIds()` produce
   `contributionId` y `publicMessageId` antes de cualquier write.
2. **Anti doble-clic**: `submittingRef = useRef(false)`, set síncrono al
   inicio del handler antes de cualquier `await`. Doble defensa con
   `setSubmitting(true)` para UI.
3. **Idempotencia**: IDs cacheados en `attemptStateRef` para reusarse en
   reintentos. `setDoc` con esos IDs (no `addDoc`) → reintento no duplica.
4. **Cleanup compensatorio en orden inverso**: si falla messageWall después
   de contribution → borrar contribution. Si falla contribution después de
   foto → borrar foto. Si cleanup mismo falla, log pero no enmascarar error
   original.
5. **Email feedback**: `notifyPangea` y `notifyAdmin` retornan
   `{ ok, reason?, error? }`. NUNCA tiran. SuccessOverlay con prop opcional
   `warning` en ámbar discreto si email a PANGEA falló.
6. **Botón "Reintentar"** si hay error de guardado, reusa los mismos IDs.

#### Archivos modificados

- `src/components/form/ParticipationForm.jsx` — handler reescrito
- `src/components/form/SuccessOverlay.jsx` — prop `warning`
- `src/components/form/SuccessOverlay.module.css` — clase `.warning` ámbar
- `src/firebase/contributions.js` — `createContribution` idempotente +
  helpers `deleteContributionById` / `deletePublicMessageById` /
  `generateContributionIds`
- `src/firebase/email.js` — funciones retornan contrato unificado

#### Commit

- `9ae86ab`

#### Veredicto QA

- QA-C: PASA-CON-OBSERVACIONES → solo M1/M2/M3 menores, recomendación
  aceptar tal cual.

#### Riesgos residuales aceptados

- **Cierre de modal mid-submit pierde `attemptStateRef`** (M3): si el usuario
  cierra el `FormModal` mientras el submit está en vuelo y el primer write
  completó, un reintento posterior generaría IDs nuevos → duplicado en BD.
  Mitigación posible: bloquear botón × y ESC mientras `submitting === true`.
  Anotado como bug colateral importante para tanda futura.
- **Cleanup público no puede borrar foto pending por reglas** (M1): explicado
  en sección #1.

### #4 — Contadores admin

#### Problema original

- `deleteContribution` no decrementaba contadores ni borraba mirror ni foto.
- `createManualContribution` 3 writes secuenciales sin transacción.
- No existía `updateContributionAmount` para reajustar contadores al editar
  amount.

#### Decisión de diseño

Tres funciones rehechas/nuevas, todas con `runTransaction`:

1. **`deleteContribution(id)`** atómica:
   - Lee la contribución; si no existe, return limpio (idempotente).
   - Si `paymentStatus === 'paid'`: decrementa `tripItems.raisedAmount`
     (-amount), `tripItems.contributorCount` (-1), `config.totalRaised`
     (-amount), `config.totalContributors` (-1). Si `tripItemId === null`,
     solo config.
   - Borra el doc messageWall mirror.
   - Borra el doc contribution.
   - **Después** del commit: intenta `deletePhotoByPath` (best-effort fuera
     de la transacción, porque Firestore Tx no incluye Storage).
   - Patrón **read-before-write** respetado: todos los `tx.get` antes de
     cualquier `tx.delete` o `tx.update`.

2. **`createManualContribution(input)`** atómica:
   - Pre-genera `contributionId` y `publicMessageId` antes de la transacción.
   - Crea contribution + messageWall mirror + actualiza contadores en una
     sola transacción.
   - Maneja `paymentStatus: 'pending' | 'paid'` y `tripItemId === null`.
   - `messageWall` mirror sin `amount` (privacidad).

3. **`updateContributionAmount(id, newAmount)`** nueva:
   - Solo aplica delta a `raisedAmount` y `totalRaised` si está `paid`.
   - NO toca `contributorCount`, `paymentStatus`, ni `paidAt`.
   - Si está pending, solo updateDoc del amount.
   - Si delta === 0, return sin escribir.

#### Archivos modificados

- `src/firebase/contributions.js`
- `src/components/admin/ContributionsList.jsx` — confirmación delete con
  consecuencias enunciadas + doble confirmación si pagada + botón "Editar
  importe" con preview del delta
- `src/components/admin/ContributionsList.module.css`
- `src/components/admin/ManualContributionForm.jsx` — limpieza de writes
  post-hoc duplicados

#### Commit

- `552c369`

#### Veredicto QA

- QA-D: PASA-CON-OBSERVACIONES → solo menores cosméticos, recomendación
  aceptar tal cual.

#### Riesgos residuales aceptados

- Concurrencia approve + delete con admin múltiple: blob huérfano posible
  pero proyecto con 1 admin → riesgo nulo práctico.
- `updateContributionAmount` con `oldAmount=null` y `newAmount=0` hace un
  write redundante antes del early-return. Inocuo.

## Acciones ejecutadas en esta sesión

| Acción | Resultado | Hash/timestamp |
|---|---|---|
| `git push origin claude/modest-poincare-e251bf` | ✅ Branch creada en remoto | 5 commits empujados |
| `firebase deploy --only storage,firestore:rules` | ✅ Deployed | proyecto `mariangeles-viaje-32169` |
| Migración de fotos legacy | ❌ Sandbox sin service-account | Acción manual del usuario |

## Acción pendiente del usuario

Migrar fotos legacy si las hay. Las nuevas reglas dejan `photos/{name}` legacy
como admin-only-read; cualquier foto en ese path ya no es accesible
públicamente desde el muro. Si Storage está vacío (lo más probable, dado que
no hay tráfico), no hay nada que migrar. El dry-run lo confirma sin tocar
datos.

```bash
# Necesitas service-account.json o GOOGLE_APPLICATION_CREDENTIALS apuntando
node scripts/migrateExistingPhotos.js --dry-run     # previsualiza
node scripts/migrateExistingPhotos.js               # ejecuta
```

El script:
- Es idempotente.
- Lista solo blobs en `photos/` raíz, sin recursar a subcarpetas.
- Para cada blob busca el doc messageWall por `photoStoragePath` o por
  nombre como fallback.
- Si `messageWall.photoApproved === true` → mueve a `approved/` y popula
  `photoUrl`.
- Si no aprobado → mueve a `pending/` y deja `photoUrl: null`.
- Si no hay doc messageWall asociado → loggea como orphan, no toca el blob.

## Bugs colaterales detectados (NO arreglados — fuera de alcance)

Anotados por los QAs durante la auditoría, listos para tickets futuros:

| Severidad | Origen | Descripción |
|---|---|---|
| Media | QA-C M3 | Cierre de modal mid-submit pierde `attemptStateRef`. Riesgo de duplicado en BD si el primer write completó antes del unmount. Fix: bloquear botón × y ESC mientras `submitting === true` (patrón ya existe para `success`). |
| Media | QA-B importante | Modal "Eliminar permanentemente" en TripItemsManager muestra `contributorCount` agregado del tripItem en lugar de query real a `messageWall + contributions`. Fix: hacer `getDocs` en tiempo real al abrir el modal. |
| Media (saneamiento) | Repetido en QAs A/B/C/D | `eslint.config.js` no declara globals de browser (`setTimeout`, `confirm`, `URL`, `Blob`, `IntersectionObserver`, `alert`, `window`). ~42 errores `no-undef` pre-existentes en muchos archivos. Fix de una línea: añadir `globals.browser` del paquete `globals`. |
| Baja | QA-A M1 | `unapprovePhoto` correcto pero raros casos de concurrencia podrían dejar duplicado en pending. Defensa en profundidad: añadir assert simétrico en `movePhotoToPending` (validar que origen está en `photos/approved/`). |
| Baja | QA-A M5 | `firestore.rules` para messageWall.create funciona porque Firestore convierte `undefined` en "campo ausente". Futuros callers deben pasar `null` explícito, no `undefined`, `""` ni `0`. |
| Baja | QA-D | Nuevo uso de `alert()` en `ContributionsList.jsx` añade error `no-undef` al lint (categoría que ya existía con `confirm`). Se resuelve con el fix de globals.browser. |
| Baja | Repetido | Bundle JS principal supera 500 kB (Firebase + pdf-lib + jszip + react-masonry-css cargados eager). Candidato a code-splitting con dynamic imports. |
| Baja | QA-A M2 | Bucket fallback en `migrateExistingPhotos.js` usa `.appspot.com` (formato viejo). Proyectos creados desde finales 2024 usan `.firebasestorage.app`. Inocuo si `VITE_FIREBASE_STORAGE_BUCKET` está en `.env`. |
| Baja | QA-A M3 | `findMessageDoc` en script de migración hace `getDocs` por cada blob legacy. O(N×M). Para volumen del proyecto es trivial. |

Recomendación de prioridad si se abre tanda futura:

1. **QA-C M3** (modal mid-submit) — riesgo real de datos.
2. **eslint config** — desbloquea CI con lint.
3. **QA-B importante** (conteo real en hard delete) — UX honesta.
4. Resto: cosmético.

## Smoke test recomendado en navegador

Para verificar que todo funciona en producción tras este deploy:

| # | Caso | Esperado |
|---|---|---|
| 1 | Submit form con foto en mobile real | SuccessOverlay verde; Storage tiene blob en `photos/pending/`; Firestore tiene messageWall con `photoUrl: null`, `photoApproved: false`. |
| 2 | Doble clic rápido en submit | Solo se crea **una** contribución. |
| 3 | Submit sin red (DevTools offline) | Error visible, botón cambia a "Reintentar". Reintentar reusa los mismos IDs (no duplica). |
| 4 | Aprobar foto en `/admin → Fotos` | Blob aparece en `photos/approved/`, sale del muro público con URL accesible. |
| 5 | Desaprobar foto ya aprobada | Blob vuelve a `photos/pending/`, desaparece del muro, URL antigua deja de funcionar (admin-only). |
| 6 | Marcar contribución como pagada | Termómetro y contadores suben. |
| 7 | Editar importe pagada (100 → 150 €) | Confirmación muestra "+50 €", termómetro sube 50 €. |
| 8 | Borrar contribución pagada | Doble confirmación; termómetro decrementa; mensaje desaparece del muro; foto desaparece de Storage (best-effort). |
| 9 | Archivar partida en `/admin → Partidas` | Sale del muro público; sigue en admin con flag "archivada"; aportaciones intactas. |
| 10 | Eliminar permanentemente partida con aportaciones | Modal indica nº aproximado; tras confirmar, esas aportaciones aparecen como "fondo general" en admin. |

## Cómo retomar este trabajo en el futuro

Si una sesión futura (mía o de otro Claude) tiene que continuar este trabajo:

### Si vienes a verificar el estado actual

1. Confirma rama: `git log --oneline -10 origin/main..HEAD`. Deben estar los
   5 commits con prefijo `fix(critico-N):`.
2. Confirma reglas Firebase desplegadas: las pending/approved están en
   `storage.rules`. Si no, redeploy con
   `firebase deploy --only storage,firestore:rules`.
3. Confirma que migración corrió: `gsutil ls gs://<bucket>/photos/` no debe
   tener blobs en raíz, solo en `pending/` y `approved/`. Si hay blobs en
   raíz, ejecuta `node scripts/migrateExistingPhotos.js` (con
   service-account).

### Si vienes a abrir un ticket de los colaterales

Lee la sección "Bugs colaterales detectados" arriba. Cada uno tiene origen
del QA y descripción suficiente para empezar.

### Si vienes a continuar la auditoría original

La auditoría inicial tenía 25 hallazgos: 6 críticos (cerrados aquí) + 12
importantes + 7 menores. Los importantes y menores quedaron fuera. Los
encontrarás en la transcripción de la sesión que generó este documento, o
puedes regenerar la auditoría con la misma estructura: 3 agentes Explore
paralelos (visualización, UX, funcionalidad).

### Si vienes a auditar este mismo deploy de nuevo

Los 5 commits, sus archivos exactos, y los veredictos QA están detallados
arriba. Puedes correr:

```bash
git show 4e86769 --stat   # #1 fotos
git show bb9267f --stat   # #1 reparación
git show bd68ac3 --stat   # #5 partidas
git show 9ae86ab --stat   # #2/#3/#6 submit
git show 552c369 --stat   # #4 contadores admin
```

para inspeccionar cada uno aislado.

### Patrón de orquestación reutilizable

Si quieres reutilizar el patrón "olas + QA gates" para futuros refactors
grandes:

1. Audita primero (Explore agents en paralelo, uno por dominio).
2. Mapea solapamientos de archivos → decide qué fixes son paralelizables y
   cuáles secuenciales.
3. Lanza implementadores en background con prompts self-contained que
   incluyan **contrato de interfaz** entre agentes.
4. Lanza QAs independientes (read-only) tras cada commit.
5. Si un QA encuentra problemas dentro del scope del fix → reparación
   inmediata con sub-agente. Máximo 2 reintentos.
6. Si un QA encuentra bugs colaterales → anotar, no tocar.
7. Pre-aprueba con el usuario decisiones que de otro modo te bloquearían:
   permisos git/deploy, ubicación de scripts, estilo de commits, idioma del
   copy.
8. Genera reporte final estructurado como este documento, persistido en
   `docs/audits/`.
