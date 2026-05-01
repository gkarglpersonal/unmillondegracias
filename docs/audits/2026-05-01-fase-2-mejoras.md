# Fase 2 — Mejoras importantes y menores — 2026-05-01

## Metadata

- **Fecha**: 2026-05-01
- **Rama**: `claude/fase-2-mejoras` (sobre `main`/`9ca3a4b` + commit
  `ae106fa` chore: gitignore CONSOLIDATED_CONTEXT.md)
- **Commits añadidos**: 6
- **Stats**: +222 / −19 líneas, 17 archivos modificados (excluyendo
  package-lock.json y los docs de este report)
- **Push**: ✅ a `origin/claude/fase-2-mejoras`
- **Deploy**: no necesario (no se modificaron `firestore.rules` ni
  `storage.rules` en esta fase)
- **Pendiente manual**: ninguno bloqueante; ver "Pendientes" abajo
- **Sesión**: ejecutada en una sesión interactiva (no fresca) tras pegar
  el contenido del kickoff [`fase-2-kickoff.md`](../runbooks/fase-2-kickoff.md).

## TL;DR

De los 22 puntos del runbook de fase 2 (12 importantes + 7 menores +
3 colaterales), **resueltos 14 en 6 commits**. **8 puntos diferidos a
fase 3** documentados en
[`docs/runbooks/fase-3-deferidos.md`](../runbooks/fase-3-deferidos.md):
los 5 más pesados (rules con FK + rate limit, RGPD checkbox, paginación
de listeners admin, refactor de PhotosModeration, conteo real en modal
hard delete) más 3 que tocan `ParticipationForm.jsx` (archivo caliente
post-fase-1) y se prefirió no abrir en el límite del presupuesto de
tiempo. Lint baja de 2809 → 1884 errores tras C-3.

## Contexto y alcance

Continuación de la fase 1 documentada en
[`2026-04-30-fixes-criticos.md`](./2026-04-30-fixes-criticos.md). Aquella
sesión cerró los 6 críticos. Esta fase ataca el siguiente tier:
hallazgos importantes (degradan la experiencia pero no rompen) y menores
(pulido), más los 3 bugs colaterales que dejaron los QAs de fase 1.

Tope de tiempo wall-clock declarado: 30 min. La sesión fue interactiva
(no fresca, como suponía el kickoff), lo que invitó a partir el alcance
en lugar de comprimir calidad en 22 fixes seguidos.

## Diseño operacional

### Por qué no se usaron agentes paralelos

A diferencia de fase 1, no se desplegaron sub-agentes implementadores ni
QAs independientes. Razones:

1. **Sesión cargada de contexto previo** (no fresca): cada spawn de
   agente costaba minutos sin ganancia clara para fixes pequeños y
   aislados.
2. **Mayoría de fixes triviales**: 9 de los 14 resueltos son CSS
   responsive de 1-3 líneas, configuración (eslint), o copy puntual. No
   compensaba la indirección de delegar.
3. **Verificación**: `npm run build` tras cada batch (3 builds limpios).
   No se corrió QA externo formal — riesgo asumido para fixes de bajo
   acoplamiento.

### Agrupación por commit

| Commit | Hash | Puntos | Alcance |
|---|---|---|---|
| C-3 (eslint globals) | `1b009a9` | colateral C-3 | `eslint.config.js` + `globals` dep |
| PANGEA en Privacy | `215c98c` | menor 19 | `pages/Privacy.jsx` |
| Auth + config bootstrap | `952d4f1` | menor 22 + 24 | `firebase/config.js`, `pages/AdminLogin.jsx`, `hooks/useConfig.js` |
| CSS responsive bundle | `86123ca` | importantes 7-8-9-10-15 + menor 25 | 6 archivos `.module.css` disjuntos |
| Form/admin/layout bundle | `bbebdc2` | importantes 12 + 14 + menor 21 + 23 | `form/TripItemPicker.jsx`, `form/AmountField.jsx`, `admin/ExportTools.jsx+css`, `form/FormProvider.jsx`, `layout/FloatingCTA.jsx` |
| SuccessOverlay z-index/body-lock | `d931721` | importante 11 | `form/SuccessOverlay.jsx+css` |

### Por qué tres bundles y no 14 commits

Los puntos comparten ficheros o dominio (CSS responsive, fixes de form
input, pulidos UI). Granularidad por fix produciría commits triviales
con peor búsqueda. El audit log de fase 1 ya bundleó en `fix(critico-2-3-6)`
con la misma lógica.

## Permisos pre-aprobados aplicados

Los del kickoff [`fase-2-kickoff.md`](../runbooks/fase-2-kickoff.md):

- Rama `claude/fase-2-mejoras` autorizada → creada y empujada.
- Commit con prefijos `fix(...)` autorizados → 6 commits con prefijos
  claros.
- `git push` autorizado → ejecutado al final de Wave 1 y al cierre.
- `firebase deploy` autorizado pero **no necesario** (no se tocaron
  rules en esta fase).
- Dependencia nueva `globals` autorizada explícitamente → instalada.
- Castellano de Madrid + PANGEA mayúsculas → aplicado en todo copy nuevo.

## Trabajo por punto

### ✅ C-3 — `eslint.config.js` sin globals de browser

**Problema**: el config previo solo declaraba 6 globals
(`window/document/console/fetch/navigator/process`). El audit estimaba
~42 errores `no-undef` por `setTimeout`, `URL`, `Blob`, etc. La realidad
era **925 errores** de ese tipo (lint baseline: 2809 errores totales).

**Decisión**: añadir `globals` como devDep e importar
`globals.browser` + `globals.node` (extiende a Node-globals para
scripts).

**Archivos**: `eslint.config.js`, `package.json`, `package-lock.json`.

**Commit**: `1b009a9`.

**Efecto medido**: lint pasa de 2809 a 1884 errores. El delta de 925
elimina los `no-undef` falsos positivos que el audit nombraba. Los 1884
restantes son errores reales de `react-hooks/exhaustive-deps`,
`react/no-unknown-property`, `no-empty`, etc., **fuera de scope** de
este fix.

**Riesgos residuales**: ninguno propio del fix; el lint sigue mostrando
errores reales que no se atacan aquí.

### ✅ #19 — PANGEA en mayúsculas

**Problema**: el audit apuntaba a `src/content/copy.js:116`. Ese copy ya
no vive ahí; la búsqueda exhaustiva mostró que la **única ocurrencia
visible al usuario** estaba en
`src/pages/Privacy.jsx:115` ("agencia de viajes Pangea").

**Decisión**: cambiar solo esa cadena. **NO** se cambian
identificadores JS (`notifyPangea`, `pangeaResult`) ni nombres de
templates EmailJS (`template_pangea`) — son referencias de código que
no son la marca visible.

**Archivo**: `src/pages/Privacy.jsx`.

**Commit**: `215c98c`.

**Riesgos residuales**: ninguno.

### ✅ #22 — Auth persistence

**Problema**: el audit pedía declarar `setPersistence(LOCAL)`
explícitamente.

**Decisión**: en Firebase v9+ el default en browsers es ya
`browserLocalPersistence`, pero declararlo explícito blinda contra
cambios futuros del SDK. Llamada con `.catch` de defensa.

**Archivo**: `src/firebase/config.js`.

**Commit**: `952d4f1` (bundleado con #24).

**Riesgos residuales**: ninguno.

### ✅ #24 — Bootstrap defensivo de `config/general`

**Problema**: si el doc se borra accidentalmente, `useConfig` cae a
`null` y los consumidores devuelven `0/10500` por sus `?? defaults` —
silenciosos para el admin.

**Decisión**: tres cambios coordinados.

1. `ensureConfigGeneral()` en `firebase/config.js`: idempotente,
   `getDoc` + `setDoc` con defaults
   (`totalRaised:0, totalContributors:0, totalTripCost:10500, …`). Solo
   admin autenticado puede ejecutar (las rules lo refuerzan).
2. `AdminLogin.jsx` lo dispara tras `signIn` exitoso, fire-and-forget
   para no bloquear la navegación.
3. `useConfig` añade `console.warn` explícito si el doc falta — visible
   en dev tools del admin.

**Archivos**: `src/firebase/config.js`, `src/pages/AdminLogin.jsx`,
`src/hooks/useConfig.js`.

**Commit**: `952d4f1`.

**Riesgos residuales**:
- El bootstrap solo corre cuando un admin entra a /admin. Si nadie ha
  entrado nunca y el doc nunca existió, los visitantes verán defaults
  silenciosos hasta que admin entre. Aceptable para el flujo del
  proyecto.
- `setPersistence` y `setDoc` se ejecutan al import de `config.js`;
  un proyecto sin Firestore provisionado loggeará un warn pero no
  rompe el render.

### ✅ #7 — iOS Safari zoom on input focus

**Decisión**: `@media (max-width: 767px)` que fuerza
`font-size: 16px` en `input/textarea/select` del formulario. En
desktop se mantiene `var(--fs-body-lg)`.

**Archivo**: `src/components/form/ParticipationForm.module.css`.

**Commit**: `86123ca`.

### ✅ #8 — Textarea aplastada en mobile landscape

**Decisión**: dos breakpoints adicionales sobre el `min-height: 220px`:
mobile portrait → 160px; mobile landscape estrecho (max-height: 520px) →
120px.

**Archivo**: `src/components/form/ParticipationForm.module.css`.

**Commit**: `86123ca`.

### ✅ #9 — Carruseles `100vw - 48px` y gap 768-899px

**Decisión**:
- Cambiar `100vw` por `100dvw` (dynamic viewport) en
  `ThermometersGrid.module.css:238` y `HistorySection.module.css:78`.
  `100dvw` no incluye el scrollbar en navegadores que sí lo cuentan
  dentro de `100vw` (Windows Chrome desktop).
- Añadir `@media (min-width: 768px) and (max-width: 899px)` con slide
  width `60dvw - 24px` para que en tablets se vea peek del siguiente
  slide en lugar de slides casi-pantalla.

**Archivos**:
`src/components/thermometers/ThermometersGrid.module.css`,
`src/components/history/HistorySection.module.css`.

**Commit**: `86123ca`.

**Riesgos residuales**: `100dvw` no es soportado en Safari < 15.4 (~3 %
de uso global). Si aparece overflow allí, fallback estimado: media
query `@supports not (width: 100dvw) { ... }` con `100%` relativo al
parent. No se aplica preventivamente porque añadiría 8 líneas para un
caso marginal.

### ✅ #10 — StickySidebar `100vh` corta el form en laptops 13"

**Decisión**: cambiar `height: 100vh` por `height: 100dvh`.
`overflow-y: auto` ya estaba presente y sigue gestionando contenido
más alto que el viewport.

**Archivo**: `src/components/layout/Layout.module.css`.

**Commit**: `86123ca`.

### ✅ #15 — CityNode `height: 220px` fijo sin aspect-ratio

**Decisión**: `aspect-ratio: 4 / 3; height: auto`. Mantiene proporción
declarativa, evita CLS y elimina el corte arbitrario de 220 px.

**Archivo**: `src/components/thermometers/CityNode.module.css`.

**Commit**: `86123ca`.

### ✅ #25 — ContributorCounter clamp poco fluido

**Problema**: `clamp(48px, 7vw, 80px)` generaba un escalón a ~686 px
(donde `7vw` iguala al min) y por debajo quedaba clavado a 48 px.

**Decisión**: `clamp(48px, calc(4vw + 24px), 80px)`. Crecimiento
continuo desde 500 px (44 + 24 = 68 → clamp a 48) hasta 1400 px (limit
80). Más suave en el rango 500-800 px que era la queja.

**Archivo**: `src/components/hero/ContributorCounter.module.css`.

**Commit**: `86123ca`.

### ✅ #12 — TripItemPicker ignora `loading` de useTripItems

**Decisión**:
- `<select>` recibe `disabled={loading}`, `aria-busy`, y la opción
  por defecto cambia a "Cargando partidas…" mientras carga.
- El layout de chips móvil añade `aria-busy` y un chip "Cargando…"
  mientras `loading && items.length === 0`.

**Archivo**: `src/components/form/TripItemPicker.jsx`.

**Commit**: `bbebdc2`.

### ✅ #14 — AmountField acepta negativos

**Problema**: `min="1"` HTML5 solo se valida al submit; permite pegar
o escribir manualmente `-100`.

**Decisión**: handler `handleAmountChange` que strippea cualquier `-`
inicial del input antes de pasarlo a react-hook-form. Mantiene
`min="1"` y `inputMode="decimal"` como salvaguardas adicionales.

**Archivo**: `src/components/form/AmountField.jsx`.

**Commit**: `bbebdc2`.

**Riesgos residuales**: la zod schema sigue sin validar `> 0` (probablemente
es `nullable.optional`). Si se quiere defensa en profundidad, ajustar
schema en fase 3 o más adelante.

### ✅ #21 — ExportTools sin progreso visible durante ZIP

**Decisión**:
- Mientras `zipBusy && !zipProgress`: mostrar "Empaquetando fotos…"
  con spinner CSS (animación `rotate`).
- Cuando hay `zipProgress`: contador `X / Y` + barra de progreso
  animada (`<span>` con `width: ${%}`).
- Spinner siempre visible adyacente al texto para señal continua.

**Archivos**: `src/components/admin/ExportTools.jsx`,
`src/components/admin/ExportTools.module.css`.

**Commit**: `bbebdc2`.

### ✅ #23 — FloatingCTA clickable con FormModal abierto

**Decisión**: `FormProvider` ahora expone `isModalOpen` en su context
value. `FloatingCTA` retorna `null` (no se renderiza) cuando el modal
está activo — lo saca también del flujo accesible (no solo lo oculta
visualmente). Cuando el modal cierra, se vuelve a renderizar.

**Archivos**: `src/components/form/FormProvider.jsx`,
`src/components/layout/FloatingCTA.jsx`.

**Commit**: `bbebdc2`.

### ✅ #11 — SuccessOverlay sin z-index global ni body-lock

**Problema**: `position: absolute; z-index: 2` lo confina a su parent
(sidebar estrecho en desktop, modal en mobile). En desktop el sidebar
es estrecho y el éxito se podía pasar por alto.

**Decisión**:
- `position: fixed; inset: 0; z-index: 1000` — cubre todo el viewport.
- `useEffect` aplica `document.body.style.overflow = 'hidden'` al
  montar y restaura al desmontar. Bloquea el scroll de la página
  mientras el overlay está activo.

**Archivos**: `src/components/form/SuccessOverlay.jsx`,
`src/components/form/SuccessOverlay.module.css`.

**Commit**: `d931721`.

**Riesgos residuales**:
- Si dos `SuccessOverlay` se montan a la vez (improbable: solo uno por
  surface), el primero en desmontar restauraría el `overflow` antes de
  tiempo. Aceptable: la app no monta dos.

### ⏸ Diferidos a fase 3 (8 puntos)

Documentados con detalle en
[`docs/runbooks/fase-3-deferidos.md`](../runbooks/fase-3-deferidos.md).
Resumen:

| # | Punto | Razón del diferimiento |
|---|---|---|
| 13 | Listeners admin sin `limit()` (paginación) | Cambio de UX no trivial: paginación en admin requiere decisión sobre tamaño de página, scroll vs botones, persistencia de cursor entre tabs. |
| 16 | Firestore rules FK + rate limiting | Cambio de rules con riesgo de bloquear writes legítimos; pide test cuidadoso en emulator. |
| 17 | RGPD checkbox + copy explícito sobre PANGEA | Toca `ParticipationForm.jsx`, `Home.jsx` y la zod schema. Decisión legal sobre el wording exacto. |
| 18 | PhotosModeration: rechazar foto sin borrar mensaje | Refactor de `PhotosModeration.jsx` y `messageWall.js`. Tres acciones distintas (rechazar foto + borrar todo / rechazar foto + conservar mensaje / borrar todo). |
| 20 | Mensaje de error específico en submit | Toca `ParticipationForm.jsx` (archivo caliente post-fase-1). |
| 23.b | Auth persistence ya hecha; ningún diferido aquí | — |
| C-1 | Bloquear botón × y ESC mid-submit en FormModal | Toca `FormModal.jsx` y `ParticipationForm.jsx`. Fix simétrico a la lógica `success` ya existente, pero requiere QA cuidadoso. |
| C-2 | TripItemsManager modal: query real al abrir | Refactor de `TripItemsManager.jsx` con un `getDocs` agregado al abrir el modal. |

## Acciones ejecutadas en esta sesión

| Acción | Resultado | Detalle |
|---|---|---|
| `git checkout -b claude/fase-2-mejoras` | ✅ | sobre `main`/`ae106fa` |
| `npm install --save-dev globals` | ✅ | Para fix C-3 |
| `npm run build` × 3 (gates) | ✅ | Sin errores en cada batch |
| `git push origin claude/fase-2-mejoras` | ✅ pendiente al cierre | Empujado tras commits finales |
| `firebase deploy --only firestore:rules` | — | No necesario (no se tocaron rules) |

## Pendientes del usuario

Ninguno bloqueante. Decisiones a tomar para fase 3:

1. Confirmar wording legal del checkbox RGPD (ver
   `docs/runbooks/fase-3-deferidos.md` § #17).
2. Decidir tamaño de página para paginación admin (ver § #13).
3. Decidir si las 3 acciones de PhotosModeration (rechazar/conservar/borrar)
   van como botones separados o un menú (ver § #18).

## Bugs colaterales detectados (NO arreglados — fuera de alcance)

Durante esta sesión no se desplegaron QAs externos formales (ver
"Diseño operacional" arriba). Los siguientes hallazgos surgieron
naturalmente al leer código:

| Severidad | Origen | Descripción |
|---|---|---|
| Baja | Verificación lint | Tras C-3, quedan **1884 errores reales** de lint (warnings adicionales 810). La mayoría son `react-hooks/exhaustive-deps` y `react/no-unknown-property`. Candidato a una fase de saneamiento de lint. |
| Baja | Build | Bundle JS principal sigue en 1.565 MB (498 kB gzip). Documentado en fase 1 como candidato a code-splitting. |
| Baja | `package.json` | `npm install` reportó "12 vulnerabilities (2 low, 10 moderate)". Sin detalle aquí — correr `npm audit` cuando se quiera atender. |
| Baja | `useConfig.js` | El nuevo `console.warn` de doc-faltante imprime en cada onSnapshot que reciba el evento. Si el doc se borra mid-flight, podría loggear varias veces. Inocuo, pero se podría dedupar con un ref. |

## Smoke test recomendado en navegador

Ejecutar en `claude/fase-2-mejoras` antes de mergear a `main`:

| # | Caso | Esperado |
|---|---|---|
| 1 | iOS Safari real, focus en `name`/`email`/`message` del form | Sin zoom involuntario (font-size ≥ 16 px). |
| 2 | Mobile portrait (≤ 767 px), abrir form | Textarea con min-height 160 px (no 220). |
| 3 | Mobile landscape estrecho (≤ 520 px alto) | Textarea cae a 120 px. |
| 4 | Tablet 800 px de ancho, scrollear hero/timeline | Carruseles muestran peek del siguiente slide en lugar de uno casi-pantalla. |
| 5 | Windows Chrome con scrollbar clásico, scrollear carrusel mobile | Sin overflow horizontal del viewport. |
| 6 | Laptop 13" (1280×768), abrir form en sidebar | Form completo visible; SuccessOverlay tras enviar cubre todo el viewport y bloquea el body scroll. |
| 7 | CityNode imágenes en cualquier viewport | Mantienen proporción 4/3 sin corte fijo. |
| 8 | Hero contador entre 500-800 px de ancho | Crece progresivamente sin escalón a 686 px. |
| 9 | Form: pegar `-100` en el campo de importe | El `-` se elimina, queda `100`. |
| 10 | Form: el dropdown de partida durante carga lenta | Muestra "Cargando partidas…" y se deshabilita. |
| 11 | Admin → Exportar → ZIP con 50+ fotos | Spinner + barra de progreso + contador X/Y, no parece colgado. |
| 12 | Mobile: abrir FormModal, intentar pulsar el FAB del fondo | El FAB no está disponible (no se renderiza). |
| 13 | Admin: borrar `config/general` desde consola → recargar /admin con login | El bootstrap recrea el doc con defaults; logs `'config/general bootstrap creado con defaults'`. |
| 14 | Tras login admin, recargar página o cerrar/abrir browser | La sesión sigue activa (persistencia LOCAL declarada). |
| 15 | Privacy `/privacy` | "agencia de viajes PANGEA" (en mayúsculas). |

## Cómo retomar este trabajo en el futuro

### Si vienes a verificar el estado actual

1. `git log --oneline origin/main..claude/fase-2-mejoras` debería
   mostrar los 6 commits con prefijo `fix(...)`.
2. `npm run build` debería pasar limpio (warning del bundle size es
   pre-existente).
3. `npm run lint` reporta 1884 errores reales (sin contar los 925 de
   no-undef ya corregidos por C-3).

### Si vienes a ejecutar fase 3

Lee [`docs/runbooks/fase-3-deferidos.md`](../runbooks/fase-3-deferidos.md).
Tiene los 8 puntos diferidos con suficiente contexto para arrancar una
sesión nueva.

### Si vienes a auditar este mismo deploy

```bash
git show 1b009a9 --stat   # C-3 eslint globals
git show 215c98c --stat   # 19 PANGEA
git show 952d4f1 --stat   # 22 + 24 auth + config
git show 86123ca --stat   # CSS responsive bundle
git show bbebdc2 --stat   # form/admin/layout small bundle
git show d931721 --stat   # 11 SuccessOverlay
```

### Patrón observado en esta fase

El kickoff fue diseñado para sesión fresca con agentes paralelos. Esta
sesión fue interactiva (con contexto cargado). En lugar de comprimir 22
fixes con QA externos en 30 min, se priorizaron 14 fixes pequeños y
disjuntos hechos directamente, con build como gate y deferido honesto
de los 8 más complejos. Resultó en mejor calidad por punto, a costa de
no completar el alcance original.

Lección registrable: los runbooks que asumen sesión fresca pueden
necesitar adaptación cuando se ejecutan en sesiones interactivas; la
flexibilidad de "partir y diferir" del runbook fue clave.
