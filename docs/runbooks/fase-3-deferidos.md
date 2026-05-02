# Runbook — Fase 3: puntos diferidos de fase 2

Runbook autocontenido para los **8 puntos** que la fase 2 no pudo
cerrar con calidad en su ventana de tiempo y se difirieron honestamente.

Sigue el mismo patrón orquestado de fases anteriores: agentes paralelos
con archivos disjuntos, QAs independientes tras cada commit, gate de
build/lint, reparación si QA encuentra problemas dentro del scope,
anotar bugs colaterales sin tocarlos, reporte final en `docs/audits/`.

## Estado al 2026-05-02

Tras cerrar fase 2, además de los 14 puntos del audit original
(documentados en
[`2026-05-01-fase-2-mejoras.md`](../audits/2026-05-01-fase-2-mejoras.md))
se hicieron **extras** que NO estaban en el audit y que conviene tener
presentes para no repetir trabajo:

- ✅ **HEIC en formulario público**: detección + conversión client-side
  con `heic2any` (dynamic import) y mensaje claro si la conversión
  falla. Ver `src/utils/convertHeic.js` y `PhotoUploader.jsx`.
- ✅ **Robustez de "Aprobar foto"**: `movePhotoToApproved` y
  `movePhotoToPending` con descarga de blob en doble estrategia
  (getDownloadURL+fetch → fallback a SDK getBlob), errores por etapa
  con prefijo `[descargar pending]`/`[subir approved]`/`[URL aprobada]`,
  recovery idempotente si el blob ya estaba en `/approved/` por un
  intento previo fallido. `PhotosModeration.jsx` muestra `err.code`
  real, no genérico.
- ✅ **Ver más en muro**: `MessagesWall.jsx` muestra 3 mensajes
  inicialmente, con botón `Ver todos los mensajes (N)`. Importante en
  mobile para no bloquear scroll a la galería.
- ✅ **CityNode banner restaurado**: el cambio de fase 2 a
  `aspect-ratio: 4/3` rompía el banner en desktop (imagen de 700 px
  de alto). Revertido a `height: 220px` con object-fit cover.
- ✅ **`cors.json` añadido al repo** (raíz). Necesario para que
  `getDownloadURL+fetch` funcione desde `unmillondegracias.com`.
- ✅ **Storage rules redeployed**: el SDK detectó drift entre repo y
  prod en el deploy de fase 2-debug. Ahora están sincronizadas.

**Pendientes manuales del usuario** (Claude no puede hacerlos desde la
sandbox; el kickoff de fase 3 los pregunta antes de arrancar):

- ⏸ Aplicar `cors.json` al bucket con
  `gsutil cors set cors.json gs://mariangeles-viaje-32169.firebasestorage.app`.
- ⏸ Añadir `unmillondegracias.com` a Firebase Console → Authentication
  → Settings → Authorized domains.

Sin esos dos pasos, las fotos no se podrán aprobar en producción
aunque el código esté correcto.

## Cómo usarlo

**Recomendado**: usa el wrapper [`fase-3-kickoff.md`](./fase-3-kickoff.md)
en lugar de pegar este runbook directo. El kickoff hace setup git,
verifica los prerequisitos manuales y inyecta lecciones de fases 1 y 2.

**Si prefieres pegar este runbook directo** (para alcance reducido o
revisión de plan antes de ejecutar):

1. Lee primero los reports de fases 1 y 2 en `docs/audits/`.
2. Verifica que estás en una rama nueva limpia desde `main`:
   ```bash
   git checkout main && git pull origin main
   git checkout -b claude/fase-3-deferidos
   ```
3. Pega el bloque "Prompt" de abajo como primer mensaje de una sesión
   nueva.
4. Si quieres ejecutar solo un subconjunto, edita la sección "Alcance"
   antes de pegar.

---

## Prompt

> Pega todo lo que va entre los triple-comilla a continuación como
> primer mensaje en la sesión nueva.

````
# Misión: cerrar los 8 puntos diferidos de fase 2 en unmillondegracias.com

Coordina una operación de fixes con el patrón ya validado en fases 1 y 2:
planifica olas de agentes paralelos con archivos disjuntos, lanza QAs
independientes tras cada commit, repara si un QA encuentra problemas
dentro del scope, anota bugs colaterales sin tocarlos, entrega reporte
final en `docs/audits/YYYY-MM-DD-fase-3-deferidos.md`.

## Contexto del proyecto

`unmillondegracias.com` — regalo colectivo a Mariángeles, lista de bodas
10.500 € para viaje a Argentina con PANGEA, abril 2026. Stack: Vite +
React 18 (JSX) + Firebase (Firestore + Storage + Auth) + EmailJS.
Sin tráfico ni campaña activa actualmente.

**Lee antes de planificar**:

1. `docs/audits/2026-04-30-fixes-criticos.md` — fase 1.
2. `docs/audits/2026-05-01-fase-2-mejoras.md` — fase 2 (incluye qué se
   resolvió y qué se difirió y por qué).
3. `ARCHITECTURE.md` — modelo de datos.
4. `firestore.rules` y `storage.rules` — estado desplegado.

## Alcance — 8 puntos diferidos de fase 2

### Importantes

#### #13 — Listeners admin sin `limit()` (paginación)

**Origen**: auditoría 2026-04-30, archivos
`src/firebase/messageWall.js:103-110` y
`src/firebase/contributions.js:79-92`.

**Problema**: cada `onSnapshot` admin trae todos los docs. Con 100+
contribuciones se vuelve costoso.

**Decisión a tomar antes de implementar**:
- Tamaño de página (sugerido 50).
- "Cargar más" con cursor o paginación numerada.
- Si moderador filtra por estado, ¿cursor cubre filtros?

**Archivos a tocar**:
- `src/firebase/messageWall.js` — añadir `subscribeAdminMessages({ pageSize, cursor })`.
- `src/firebase/contributions.js` — añadir `subscribeAdminContributions({ pageSize, cursor })`.
- `src/components/admin/MessagesModeration.jsx`, `ContributionsList.jsx` — UI con "Cargar más".

**Criterio de éxito**: con 200 docs simulados, primer snapshot trae
sólo 50; el botón "Cargar más" trae los siguientes; ordering estable.

#### #16 — Firestore rules sin FK ni rate limiting

**Origen**: auditoría 2026-04-30, `firestore.rules` +
`ARCHITECTURE.md` §8 #12.

**Problema**: `messageWall.create` no valida que `contributionId` y
`tripItemId` apunten a docs reales (FK suave). El rate limiting
prometido en arquitectura no está implementado.

**Decisión a tomar**:
- FK estricta (`exists(/databases/$(database)/documents/contributions/$(...))`)
  o suave (formato/longitud)? Estricta cuesta una read por write.
- Rate limit por dirección IP (no disponible en rules sin Cloud
  Functions) vs por documento previo del mismo `name+email`.

**Archivos a tocar**: `firestore.rules`.

**Criterio de éxito**: tests con `@firebase/rules-unit-testing` (o
emulator) muestran que un write con `contributionId` inválido falla, y
dos writes consecutivos del mismo `email` con menos de N segundos entre
ellos también fallan.

**Nota de despliegue**: una vez verificado en emulator, ejecutar
`firebase deploy --only firestore:rules`. Proyecto activo:
`mariangeles-viaje-32169`.

#### #17 — Privacy.jsx no enlazado desde el formulario (RGPD)

**Origen**: auditoría 2026-04-30, `src/pages/Home.jsx:63-74` +
`src/components/form/ParticipationForm.jsx`.

**Problema**: existe `/privacy` (linkeado en footer) pero el form no
menciona consentimiento ni que el email viaja a PANGEA.

**Decisión legal a tomar**:
- Wording exacto del checkbox.
- Enlace a `/privacy` en nueva pestaña o en línea.
- ¿Cesión de datos a PANGEA va explícita en el copy del form o solo en
  Privacy?

**Archivos a tocar**:
- `src/components/form/ParticipationForm.jsx` — añadir checkbox como
  campo de la zod schema, requerido.
- `src/components/form/ParticipationForm.module.css` — ya tiene
  `.checkboxField`/`.checkboxText` aprovechables.
- `src/content/copy.js` — wording.

**Criterio de éxito**:
- El submit no avanza si el checkbox está desmarcado.
- El error es visible y accesible.
- El wording del checkbox menciona explícitamente PANGEA.

#### #18 — PhotosModeration: rechazar foto borra también el mensaje

**Origen**: auditoría 2026-04-30,
`src/components/admin/PhotosModeration.jsx:51-58`.

**Decisión de UX**: separar 3 acciones:
1. Aprobar foto (ya existe).
2. **Rechazar foto, conservar mensaje** (nueva). Borra el blob,
   deja `messageWall` con `photoStoragePath: null`, `photoUrl: null`,
   `photoApproved: false`.
3. Rechazar foto + borrar mensaje (es lo que hace hoy "rechazar").

**Archivos a tocar**:
- `src/components/admin/PhotosModeration.jsx` — UI con 3 botones (o
  menú de acciones).
- `src/firebase/messageWall.js` — exportar `rejectPhotoKeepMessage`
  que: borra blob de Storage, hace `update` del doc para limpiar
  campos foto.
- `src/firebase/storage.js` — reusar `deletePhotoByPath` ya existente.

**Criterio de éxito**: tras "rechazar foto + conservar mensaje", el
mensaje sigue en el muro público sin foto; tras "rechazar foto + borrar
mensaje" todo desaparece.

#### #20 — Mensaje de error genérico en submit

**Origen**: `src/components/form/ParticipationForm.jsx:132-134`.

**Decisión**: distinguir 3 fases de fallo (foto / Firestore / email)
para que el usuario sepa qué reintentar. Las funciones de
`firebase/contributions.js` y `firebase/email.js` ya retornan contratos
unificados; el handler del form solo necesita propagar la categoría.

**Archivos a tocar**:
- `src/components/form/ParticipationForm.jsx` — capturar la fase del
  fallo en el catch y mostrar copy específico.
- `src/content/copy.js` — 3 mensajes de error nuevos.

**Criterio de éxito**: simulación de fallo en cada fase muestra el
mensaje correcto sin reintentar las fases que ya completaron.

### Bugs colaterales

#### C-1 — Cierre de FormModal mid-submit pierde `attemptStateRef`

**Origen**: QA-C de fase 1, `src/components/form/FormModal.jsx`,
`src/components/form/ParticipationForm.jsx`.

**Decisión**: bloquear botón × y tecla ESC mientras
`submitting === true`, simétrico al patrón ya existente para
`success`.

**Archivos a tocar**:
- `src/components/form/FormModal.jsx` — extender la guarda existente
  para `submitting`.
- `src/components/form/ParticipationForm.jsx` — exponer estado
  `submitting` al modal o al provider.

**Criterio de éxito**: con DevTools throttling en "Slow 3G", click rápido
en × durante el submit no cierra el modal hasta que el flujo termine
(éxito o error).

#### C-2 — TripItemsManager modal hard delete con conteo aproximado

**Origen**: QA-B de fase 1,
`src/components/admin/TripItemsManager.jsx`.

**Decisión**: al abrir el modal "Eliminar permanentemente", hacer un
`getDocs` agregado al vuelo a `messageWall` y `contributions`
filtrando por `tripItemId === itemId`. Mostrar el conteo real.

**Archivos a tocar**: `src/components/admin/TripItemsManager.jsx`.

**Criterio de éxito**: el conteo del modal coincide con
`db.collection('messageWall').where('tripItemId', '==', id).count()`
del emulator.

## Permisos pre-aprobados

Los mismos que en fases 1 y 2 (consultar
`docs/runbooks/fase-2-kickoff.md` para detalles). Resumen:

- Rama `claude/fase-3-deferidos` autorizada.
- Commits con prefijos `fix(importante-N):` / `fix(menor-N):` /
  `fix(colateral-C-N):` autorizados.
- `git push origin claude/fase-3-deferidos` autorizado.
- `firebase deploy --only firestore:rules` autorizado si tu fix toca
  rules. Proyecto activo: `mariangeles-viaje-32169`.
- Tope de **30 minutos** wall-clock — si planificando ves que no cabe,
  partir es lo correcto. No comprimas calidad.

## Decisiones pre-aprobadas

- Castellano de Madrid en todo copy nuevo.
- **PANGEA siempre en mayúsculas**.
- JavaScript, no TypeScript.
- CSS Modules.
- react-hook-form + zod en formularios.
- No introducir dependencias nuevas sin justificación fuerte.
- No usar `--no-verify`, `--no-gpg-sign`, `--force`, ni tocar
  `git config`.

## Patrón operacional

Idéntico al de fase 2 — auditar primero, mapear archivos compartidos,
plan de olas, ejecutar con QA gates, reportar.

**Para los QAs usa `subagent_type: "general-purpose"`**, NO `"Explore"`.
En cada prompt de QA incluye:

> "AUTORIZACIÓN PRE-APROBADA: ejecuta directamente git show, git diff,
> git log, npm run build, npm run lint, Read, Grep, Glob. NO pidas
> permiso. NO modifiques archivos."

## Entregable final

1. Resumen ejecutivo: cuántos puntos resueltos vs diferidos a fase 4,
   commits, push y deploy.
2. Tabla por punto: estado, commit, veredicto QA.
3. Bugs colaterales nuevos detectados.
4. Smoke test recomendado.
5. `docs/audits/YYYY-MM-DD-fase-3-deferidos.md` siguiendo el formato
   de los reports anteriores.
6. Entrada nueva en `docs/audits/README.md`.
7. Commit final `docs(audits): report consolidado fase 3` empujado.

## Reglas de honestidad

- Si un fix queda con riesgo residual, dilo claramente en el report.
- Si el alcance no cabe en 30 min, partir es lo correcto.
- Si una decisión técnica te incomoda, pregunta antes de actuar.

Arranca cuando estés listo.
````

---

## Notas de mantenimiento

- Si en fase 3 se cierran solo algunos puntos, actualizar el bloque
  "Alcance" arriba con lo que quede pendiente para fase 4.
- Si el patrón orquestado se queda corto en algún aspecto, reflejar la
  lección en el README de `docs/runbooks/` y en el report de la sesión.
