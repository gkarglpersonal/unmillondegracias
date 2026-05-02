# unmillondegracias.com — Historial técnico y lecciones aprendidas

*Última actualización: 2 de mayo de 2026*

---

## Cronología del desarrollo

### Fase 0 — Arranque (abril 2026)
- Dominio comprado en GoDaddy: unmillondegracias.com
- Proyecto Firebase creado: mariangeles-viaje-32169
- Stack elegido: React + Vite + CSS Modules + Firebase + GitHub Pages
- Claude Code instalado y arquitectura inicial definida

### Fase 1 — Correcciones críticas (30 abril 2026)
Auditoría completa del código reveló 25 problemas. Se resolvieron los 6 críticos:

| Fix | Problema | Solución |
|---|---|---|
| #1 | Fotos públicas aunque no estuvieran aprobadas | Storage rules con paths privados `pending/` y `approved/` |
| #2+3+6 | Race condition al crear contribución + doble clic + email silencioso | Submit idempotente con transacción Firestore, cleanup compensatorio, feedback honesto al usuario |
| #4 | deleteContribution no ajustaba contadores | runTransaction que decrementa todos los contadores atómicamente |
| #5 | Borrar partida dejaba contribuciones huérfanas | Soft delete (active: false) como alternativa al borrado destructivo |

**Commits clave:** 4e86769 (fotos), 9ae86ab (submit), 552c369 (contadores), bd68ac3 (partidas)

### Fase 2 — Mejoras importantes y menores (1 mayo 2026)
14 de 22 puntos resueltos. Los 8 restantes diferidos a Fase 3.

Highlights:
- ESLint globals configurado (reducción de 925 errores de lint)
- Auth persistence configurada
- CSS responsive: textarea en landscape, StickySidebar en pantalla corta, carruseles
- TripItemPicker con estado de carga
- SuccessOverlay con z-index y body-lock
- AmountField sin valores negativos
- Botón "Ver todos los mensajes" con colapso/expansión (muestra 3 inicialmente)
- Fotos HEIC: conversión automática a JPG client-side (librería heic2any, MIT, lazy-loaded)
- Aprobar foto: fix de CORS (getDownloadURL + fetch en lugar de getBlob)
- Rechazo de foto: ahora solo borra la foto, no el mensaje asociado

### Fase 3 — Diferidos (2 mayo 2026, completada)
8 puntos pendientes de Fase 2 cerrados en una sesión orquestada con el patrón validado en fases anteriores: **Ola 1** con 4 agentes paralelos sobre archivos disjuntos + **Ola 2** secuencial sobre `messageWall.js`. QA gates independientes tras cada ola, build/lint estables a baseline (1884 errores) en cada gate. **Cero diferidos a Fase 4. Cero bugs colaterales nuevos.**

| Punto | Solución | Commit |
|---|---|---|
| #13 | Paginación admin con cursor (`pageSize=50`, botón "Cargar más"). Funciones legacy preservadas para `ExportTools` y `EmailJsAlert`. | `8d61a32` |
| #16 | FK suave en `firestore.rules`: validación de formato Firestore ID (`^[A-Za-z0-9_-]{20}$`) para `contributionId` y `tripItemId`. | `0ed6210` |
| #17 | Checkbox RGPD obligatorio en el formulario, link a `/privacy`, mención explícita de PANGEA. Zod `z.literal(true)`. Cleanup de copy huérfano. | `244709c` + `3166bbb` |
| #18 | Dos botones distintos en moderación de fotos: "Rechazar foto" (preserva mensaje si hay) y "Borrar entrada" (siempre borra todo). Nueva función `rejectPhotoKeepMessage`. | `267f77f` |
| #20 | Errores específicos por fase de fallo: `photo` / `save` / `unknown`. El catch externo lee `err.phase` y muestra copy de `copy.form.errors`. | `244709c` |
| C-1 | Bloquear botón × y ESC en `FormModal` mientras `submitting === true`. Prop `onSubmittingChange` en `ParticipationForm`. | `244709c` |
| C-2 | Conteo real al abrir `HardDeleteItemModal`: `getDocs(messageWall where tripItemId == id)` con state `'cargando' / number / 'error'`. | `0b7d162` |

**Decisiones operacionales clave:**
- Bundling de #17 + #20 + C-1 en un solo agente porque comparten `ParticipationForm.jsx` y `copy.js`.
- Secuenciación de #13 (Ola 1) y #18 (Ola 2) porque ambos editan `messageWall.js` — evita merge conflicts entre agentes paralelos.
- Deploy de `firestore.rules` diferido al post-merge: rules en producción no deben adelantar al código que los va a cumplir.

**Riesgos residuales conocidos (documentados, aceptados):**
1. **Paginación admin pierde reactividad en docs >50** — un admin que modifica un doc viejo desde otra pestaña no lo ve hasta refrescar. Documentado en JSDoc. Aceptable para volumen previsto.
2. **FK suave acepta IDs con formato válido pero sin doc real** — un atacante puede generar IDs `^[A-Za-z0-9_-]{20}$` que no apunten a nada. Impacto bajo: el mensaje queda huérfano pero el admin lo ve. La FK estricta (`exists()`) costaría una read por write y se descartó.
3. **Sin rate limiting honesto en rules** — requiere Cloud Functions para contar requests por email/IP. Mitigación actual: validación de formato + `submittingRef` anti doble-clic + checkbox RGPD obligatorio. Documentado como follow-up explícito en el comentario de `firestore.rules`.

**Report completo:** [`docs/audits/2026-05-02-fase-3-deferidos.md`](audits/2026-05-02-fase-3-deferidos.md)

### Correcciones post-Fase 3 (2 mayo 2026)

Smoke test tras el merge de Fase 3 destapó cinco correcciones adicionales en el panel admin y el formulario público. Todas resueltas el mismo día con build verde y deploy manual a `gh-pages`.

| # | Problema | Solución | Commit |
|---|---|---|---|
| 1 | "Rechazar foto" parecía seguir borrando el mensaje del muro | Verificado: el código en `main` ya separaba "Rechazar foto" (preserva mensaje si lo había) de "Borrar entrada" (siempre borra todo) desde el commit `267f77f` de Fase 3. El síntoma reportado era un texto de confirm pre-Fase-3 — deploy stale en GitHub Pages / cache de navegador. Resuelto al desplegar el bundle nuevo (hash distinto invalida cache). | (sin cambio de código) |
| 2 | El formulario de desktop no se limpiaba tras enviar correctamente | `reset()` de react-hook-form + `setPhoto(null)` justo después de `onSuccess` en `ParticipationForm`. La variante `modal` no lo notaba (el modal se desmonta); el sidebar de desktop quedaba con todos los datos rellenos. | `325f622` |
| 3 | Eliminar una sección de partidas no avisaba si las partidas tenían aportaciones reales | `useEffect` en `DeleteSectionModal` con `getDocs(messageWall where tripItemId in [...])` por chunks de 30 IDs. Aviso visible en rojo cuando hay aportaciones, con recomendación de usar "Mover tarjetas a Sin asignar" si se quiere preservar la trazabilidad. Estados: cargando / sin aportaciones / con aviso / fallback en error. | `325f622` |
| 4 | Borrar una aportación borraba también el mensaje del muro | `deleteContribution` ahora conserva el mirror público cuando la entrada tiene mensaje **o** foto. Solo se limpian los campos vinculados a la aportación económica: `paid: false`, `contributionId: null`. El mensaje, la foto (path/url/aprobada) y el `tripItemId` quedan intactos. El blob de Storage **no se borra** — la foto sigue accesible en galería pública o moderación. Si la entrada no tenía ni mensaje ni foto, el mirror se elimina (sería un fantasma). | `4dca336` (solo mensaje) → `1d8d8ce` (mensaje + foto, versión final) |
| 5 | Texto del confirm con variantes condicionales | Simplificado a un único texto literal en `handleDelete`: *"Vas a eliminar esta aportación económica. El mensaje y la foto de esta persona se conservan en el muro. Esta acción no se puede deshacer. ¿Continuar?"*. La doble confirmación para pagadas se conserva intacta con el importe a restar. | `1ab3e8c` |
| 6 | `FirebaseError: No document to update` al borrar la segunda aportación seguida | Cuando el mirror del muro había sido borrado antes (desde "Mensajes" del admin o por una operación previa), `tx.update` lanzaba `not-found` y hacía rollback de toda la transacción. Fix: `tx.get(mRef)` antes de cualquier write para detectar si existe; si existe, `update` o `delete` según corresponda; si no, se omite ese paso y solo se borra la contribution privada y se decrementan los contadores. | `72d9247` |

**Lecciones técnicas registradas:**

- **`tx.delete` vs `tx.update` en transacciones Firestore**: `tx.delete` sobre un doc inexistente es **no-op silencioso**, `tx.update` lanza `not-found` y aborta la transacción. Cuando se sustituye uno por otro, hay que añadir un `tx.get` previo para verificar existencia.
- **Read-before-write en transacciones**: todas las llamadas `tx.get` deben preceder a cualquier `tx.update`/`tx.delete`/`tx.set` dentro del mismo `runTransaction`. Al introducir lecturas adicionales, agruparlas con las existentes al inicio.
- **Cache de GitHub Pages**: tras un cambio que solo afecta a admin, el bundle nuevo invalida el cache automáticamente (hash distinto). Si el síntoma reportado cita texto que ya no existe en `main`, sospechar deploy stale antes que bug en el código actual.
- **Reset de RHF al éxito**: la variante `modal` esconde el problema del form persistente porque el componente se desmonta. La variante `sidebar` (desktop) sí queda montada y necesita `reset()` explícito.
- **Aviso en modales destructivos**: cuando una operación destructiva tiene consecuencias variables según los datos, el modal debe consultar el estado real al abrirse y mostrar el conteo, no confiar en agregados aproximados (lección compartida con la corrección C-2 de Fase 3).

---

## Problemas resueltos y cómo

### El botón "Aprobar foto" se quedaba colgado en "Aprobando..."

**Síntoma:** El botón mostraba el estado de carga indefinidamente sin completar ni fallar.

**Diagnóstico:** `getBlob()` del SDK de Firebase Storage requiere CORS configurado correctamente en el bucket. En Firebase Storage + GitHub Pages + dominio personalizado, `getBlob()` se quedaba esperando sin lanzar error visible. La solución fue sustituir por `getDownloadURL() + fetch()` (los media tokens de Firebase saltan CORS), con fallback a `getBlob()` si fetch falla.

**Causa raíz real:** CORS no estaba configurado en el bucket para el dominio `unmillondegracias.com`. Aunque las subidas funcionaban (las subidas van por una ruta distinta), las descargas fallaban silenciosamente.

**Solución final:** Configurar CORS con `gsutil cors set cors.json gs://mariangeles-viaje-32169.firebasestorage.app`. El archivo `cors.json` está versionado en la raíz del repo.

**Lección:** Si una operación de Storage falla con `Failed to fetch` o `retry-limit-exceeded` desde un dominio que SÍ tiene otras operaciones funcionando, sospechar CORS antes que rules.

---

### GitHub Actions poco fiable para deploy

**Síntoma:** Los jobs de CI/CD se quedaban en cola indefinidamente sin ejecutarse.

**Solución:** Deploy manual como workflow estándar:
```bash
npm run build
npx gh-pages -d dist
git push
```

Para forzar redeploy sin cambios:
```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

---

### Bug de paths ESM en Windows (script de seed)

**Síntoma:** El script de seed de Firestore fallaba en Windows con error de rutas.

**Solución:** `git config --global core.longpaths true` + fix de `fileURLToPath` en el script.

---

### Las fotos de ciudades aparecieron enormes en desktop

**Causa:** En un commit de fix CSS responsive (#15), se cambió `height: 220px` a `aspect-ratio: 4/3` en `.CityNode .image`. El componente asumía erróneamente que la imagen vivía en una columna del grid (~33% de ancho). En realidad es un banner full-width directo bajo `.city`. Con 4:3 a ~700-1000px de ancho, las imágenes salían de 525-750px de alto.

**Solución:** Revertir a `height: 220px + object-fit: cover`.

**Lección:** Leer siempre el JSX antes de tocar el CSS de un componente. Nunca asumir la estructura sin ver el render.

---

### Conflicto de merge entre Fase 1 y cambios en main

**Contexto:** Entre la Fase 1 (en rama `claude/modest-poincare-e251bf`) y el intento de abrir el PR, Gerry había hecho cambios directamente en `main` (rename "Mariángeles" → "MªÁngeles" en dos strings de admin).

**Solución:** `git merge origin/main` (no rebase, para evitar force-push), resolución manual del conflicto en `ContributionsList.jsx` conservando toda la lógica de Fase 1 y aplicando encima el rename de main.

---

### Firebase Storage rules desincronizadas de producción

**Síntoma:** El código del repo tenía unas rules, pero producción tenía otras (diferencia desconocida).

**Lección:** Cuando un comportamiento en producción confunde, hacer `firebase deploy --only storage,firestore:rules` es más barato que adivinar. El SDK detecta automáticamente si hay diferencia y sube solo lo que cambió.

---

## Arquitectura de datos (Firestore)

### Colecciones principales

**`contributions`** — aportaciones recibidas
- `name`, `email`, `tripItemId`, `amount`, `paymentStatus` (pending/paid), `createdAt`
- Solo visible para admin

**`messageWall`** — mirror público de los mensajes
- `name`, `message`, `photoUrl` (solo si aprobada), `photoStoragePath`, `visible`, `photoApproved`
- Lectura pública, escritura solo admin o función serverless

**`tripItems`** — las 29 partidas del viaje
- `name`, `description`, `targetAmount`, `raisedAmount`, `contributorCount`, `active`, `city`, `order`

**`config/general`** — contadores globales
- `totalRaised`, `totalContributors`

### Rutas de Storage

```
photos/pending/{filename}   → subida por usuario, no pública
photos/approved/{filename}  → aprobada por admin, pública
photos/{filename}           → legacy, acceso admin
```

### Regla de atomicidad

Firestore no soporta transacciones cross-collection que incluyan Storage. Por eso:
- Las operaciones críticas (marcar pagado, borrar contribución, contribución manual) usan `runTransaction` dentro de Firestore
- El Storage se maneja fuera de la transacción, con cleanup compensatorio si falla
- Si algo falla a mitad, el sistema detecta el estado inconsistente en el próximo intento y se auto-recupera (recovery idempotente)

---

## Patrones de orquestación con Claude Code

El proyecto usó un patrón de trabajo en fases con agentes paralelos y QA independiente:

**Estructura de cada fase:**
1. Ola de agentes implementadores en paralelo (archivos disjuntos = cero conflictos)
2. Gate de QA: un agente independiente por cada implementador
3. Si QA falla: loop de reparación, máximo 2 reintentos
4. Si pasa: commit por agente con prefijo claro, push, PR en GitHub

**Reglas aprendidas:**
- QA agents: usar `subagent_type: "general-purpose"`, no "Explore" (Explore pide permisos para comandos básicos)
- Incluir en cada prompt de QA: "AUTORIZACIÓN PRE-APROBADA: ejecuta directamente git show, git diff, git log, npm run build, npm run lint"
- Build verde como gate mínimo antes de cualquier commit
- Un commit por agente con prefijo: `fix(critico-N):`, `fix(importante-N):`, `fix(menor-N):`, `docs(audits):`
- Los runbooks de cada fase quedan versionados en `docs/runbooks/`
- Los reports de cada fase quedan en `docs/audits/`

---

## Puntos pendientes técnicos

Tras el cierre de la Fase 3 (2 mayo 2026), no quedan puntos técnicos bloqueantes para el lanzamiento. Las tres fases de fixes (críticos, mejoras, diferidos) están completadas con sus reports en [`docs/audits/`](audits/).

**Mejoras post-lanzamiento candidatas** (no bloquean):
- Bundle JS principal supera 500 kB (Firebase + pdf-lib + jszip + heic2any). Code-splitting con dynamic imports si se quiere reducir tiempo de primer render en mobile lento.
- Lint sigue mostrando 1884 errores reales de `react-hooks/exhaustive-deps` y similares (post-fix de globals en Fase 2). Saneamiento opcional, no afecta funcionamiento.
- Rate limiting honesto en `messageWall.create` requeriría Cloud Functions. Solo necesario si aparece spam real.
- `getCountFromServer` para el conteo del modal hard delete si crece a miles de mensajes por partida (hoy carga todos los docs filtrados; trivial para volúmenes esperados).
- Migrar paginación admin a una estrategia totalmente reactiva si el flujo de moderación se vuelve concurrente (hoy: un solo admin, riesgo nulo).
