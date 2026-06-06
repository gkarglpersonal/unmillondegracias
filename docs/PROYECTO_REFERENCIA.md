# unmillondegracias.com — Documento de referencia maestro

*Última actualización: 6 de junio de 2026 (objetivo de campaña dinámico: el porcentaje global público se calcula sobre la suma de `targetAmount` de las partidas activas, y el panel admin muestra ese objetivo en euros — PR #40 abierto; antes 23 de mayo: arreglo de conversión HEIC para móviles Samsung)*

---

## Qué es este proyecto

Regalo de jubilación colectivo para **Mariángeles**, profesora de infantil del **Colegio Everest School Monteclaro** (Pozuelo de Alarcón, Madrid), con más de 40 años en el mismo colegio. La campaña reúne a todas las generaciones de familias y exalumnos a los que ha dado clase.

El regalo es un **viaje a Argentina para dos personas**, organizado a través de **PANGEA The Travel Store**. La mecánica es de lista de bodas: cada participante elige una partida del viaje y contribuye al fondo. Al final, Mariángeles decide si usa ese viaje exacto u otro con el dinero recaudado.

**La campaña se lanza el lunes 5 de mayo de 2026.** La página no tiene campaña activa todavía en el momento de escribir esto.

---

## Personas clave

| Persona | Rol | Contacto |
|---|---|---|
| **Gerry (Gerardo Kargl)** | Organizador y admin del sitio | gerardo.kargl@gmail.com / gkargl@outlook.com |
| **Irene Banchero** | PANGEA — gestiona los pagos | irene.banchero@pangea.es / 910837976 |
| **María Ulloa** | Coordinadora de infantil en Everest | Distribuye info entre colegas del cole |
| **Carla** | Alumni Everest | Tiene base de datos de exalumnos |
| **Maripepa** | Responsable grupo de padres | Ya avisada para no organizar regalo paralelo |
| **Miss Ivonne** | Amiga y colega de Mariángeles | Ayudó a recopilar fotos históricas |

**Mariángeles:** tiene pareja e hija. La sorpresa se mantiene para todos, incluida la familia. No se contactó al marido.

---

## Stack técnico

| Componente | Tecnología |
|---|---|
| Frontend | React 18 + Vite, JSX (no TypeScript) |
| Estilos | CSS Modules (no Tailwind, no styled-components) |
| Hosting | GitHub Pages |
| Repo | github.com/gkarglpersonal/unmillondegracias |
| Base de datos | Firebase Firestore (proyecto: mariangeles-viaje-32169) |
| Almacenamiento fotos | Firebase Storage |
| Autenticación admin | Firebase Auth (un solo usuario: gerardo.kargl@gmail.com) |
| Emails | EmailJS (service_gr3xvsg, templates: template_pangea / template_admin) |
| Dominio | unmillondegracias.com (GoDaddy, DNS apunta a GitHub Pages) |
| Idioma | Solo español (castellano de Madrid) |

**Proyecto Firebase:** mariangeles-viaje-32169  
**Cuenta Firebase:** gerardo.kargl@gmail.com  
**Ruta local del proyecto:** `C:\Users\gkarg\OneDrive\My Relationships\Kids\Viaje de Mariangeles - Everest 2026\Website - unmillondegracias.com`

---

## Convenciones de código inamovibles

- JavaScript, nunca TypeScript
- CSS Modules, nunca Tailwind ni styled-components
- react-hook-form + zod en todos los formularios
- No introducir dependencias nuevas sin justificación fuerte
- No usar `--no-verify`, `--no-gpg-sign`, `--force` en git
- Castellano de Madrid: "importe" (no "monto"), "rellena" (no "llena"), "ha dado" (no "dio")
- **PANGEA siempre en mayúsculas**
- Íconos: Lucide (Plane, BedDouble, Bus, Map, Music, UtensilsCrossed, Wine, Gift, Shield)

---

## Estructura de la página (scroll único)

1. **Hero** — foto grande de Mariángeles, titular emotivo, contador de contribuidores en tiempo real, CTA al formulario
2. **Historia** — línea de tiempo visual con fotos de distintas épocas y textos evocadores
3. **El viaje** — descripción del viaje a Argentina, cómo funciona la mecánica de participación
4. **Experiencias del viaje** — 29 partidas organizadas como timeline por ciudades: Buenos Aires → Ushuaia → El Calafate → Iguazú → Mendoza → Buenos Aires → Madrid. Total: 10.500 €. Las tarjetas de vuelo tienen fondo eucalipto y van en su propia fila entre ciudades.
5. **Muro de mensajes** — mensajes enviados por participantes, se publican automáticamente, Gerry puede ocultarlos desde el admin
6. **Galería de fotos** — masonry, solo fotos aprobadas manualmente por Gerry

---

## Flujo de un participante

1. El usuario llega a la página (por WhatsApp) y ve la historia de Mariángeles
2. Elige una partida del viaje o usa el formulario general
3. Rellena el formulario: nombre, email, mensaje (opcional), foto (opcional), partida, importe
4. Al enviar: EmailJS manda email a PANGEA con sus datos; PANGEA envía enlace de pago personalizado al participante; Gerry recibe copia
5. El mensaje aparece automáticamente en el muro público
6. La foto queda pendiente de aprobación manual de Gerry en /admin
7. Cuando PANGEA confirma el pago a Gerry, este marca la aportación como "pagada" en el admin → el termómetro se actualiza en tiempo real

---

## Panel de administrador (/admin)

Acceso con email/contraseña (Firebase Auth). Solo Gerry.

- **Dashboard de totales (cabecera):** cuatro tarjetas en tiempo real — Total recaudado, Asignado a partidas, Sin asignar (fondo general) sobre `contributions` pagadas (`paymentStatus === 'paid'`), y **Objetivo total** (solo lectura) con la suma en euros de los `targetAmount` de las partidas activas. Visible en todas las pestañas. Ese importe en euros del objetivo solo se ve en el admin; en la página pública el mismo cálculo se muestra únicamente como porcentaje.
- **Aportaciones:** ver todas, marcar como pagadas, añadir manuales, editar importes, **cambiar la partida** (reasignación atómica con reajuste de termómetros). Filtros: Todas · Pendientes · Pagadas · **Sin asignar** (las que están en fondo general / sin preferencia, candidatas a reasignación). Indicador "Importe privado" (pill con icono Lock) cuando `amountPrivate === true` y hay importe — distingue a simple vista quién prefiere que MªÁngeles no vea el importe exacto. Indicador "Elegida por el donante" (pill con icono UserCheck) cuando la partida actual la eligió el contribuyente y no se ha reasignado nunca; al reasignarla se guarda la elección original como `originalTripItemId` y aparece un hint "Reasignada · original: X" para trazabilidad.
- **Mensajes:** mostrar/ocultar (se publican automáticamente, no requieren aprobación)
- **Fotos:** aprobar o rechazar (requieren aprobación manual antes de aparecer en la galería)
- **Partidas:** crear, editar, archivar (soft delete con active: false), borrar si no tienen contribuciones
- **Aportación manual:** registrar a mano una aportación (con o sin importe) cuando alguien notifica por WhatsApp/transferencia directa
- **Subir foto:** subir una foto en nombre de alguien (típicamente recibida por WhatsApp) sin que aparezca en el feed de "X se ha sumado". Crea un doc en `messageWall` con `excludeFromFeed: true`; la foto sigue el flujo normal de aprobación desde la pestaña "Fotos" y acaba en la galería.
- **Exportar:** PDF de mensajes + ZIP de fotos para entregar a Mariángeles al final

---

## Diseño visual

- **Estilo:** cálido, emotivo, moderno. Referencia: Apple, Microsoft
- **Fondo:** warm off-white cremoso
- **Acento principal:** verde eucalipto y oliva (botones, CTAs)
- **Acento dorado:** honey y cálido (titular hero, divisores, contadores)
- **Tarjetas:** beige cálido ligeramente más oscuro que el fondo
- **Texto:** charcoal cálido oscuro, nunca negro puro
- **Gradientes:** siempre dentro del mismo tono, nunca mezclando colores entre sí
- **Mobile-first:** la mayoría llega por WhatsApp en móvil

---

## Workflow de deploy

GitHub Actions resultó poco fiable (jobs en cola indefinidamente). El workflow estándar es **manual**:

```bash
npm run build
npx gh-pages -d dist
git push
```

Si hace falta forzar redeploy sin cambios:
```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

Las ramas de trabajo siguen el patrón `claude/nombre-descriptivo`. El flujo es: rama → PR en GitHub → merge desde la UI de GitHub → GH Action despliega automáticamente a producción.

---

## Configuración Firebase externa (requiere acción manual)

Estas dos cosas NO se pueden hacer desde el código — requieren acceso a las consolas de Google/Firebase:

**CORS del bucket de Storage** — necesario para que el admin pueda aprobar/rechazar fotos. El archivo `cors.json` está en la raíz del repo. Comando para aplicar:
```bash
gsutil cors set cors.json gs://mariangeles-viaje-32169.firebasestorage.app
```
Verificar con: `gsutil cors get gs://mariangeles-viaje-32169.firebasestorage.app`

**Authorized domains en Firebase Auth** — `unmillondegracias.com` debe estar en Firebase Console → Authentication → Settings → Authorized domains. Ya añadido.

---

## Estado al 23 de mayo de 2026

- ✅ Página completa en producción con fotos y textos reales de Mariángeles
- ✅ 29 partidas del viaje en Firestore (10.500 € total)
- ✅ Formulario funcionando: emails llegan a Gerry y a PANGEA
- ✅ Panel admin funcional: mensajes, fotos, aportaciones, exportación
- ✅ Fotos: subida (incluyendo conversión HEIC→JPG), aprobación, rechazo
- ✅ CORS configurado en Firebase Storage
- ✅ Authorized domains configurado en Firebase Auth
- ✅ Mensaje de WhatsApp de lanzamiento listo
- ✅ **Fase 1 completada** (6 críticos cerrados — auditoría 30 abril)
- ✅ **Fase 2 completada** (14 mejoras cerradas + 8 diferidas a Fase 3 — 1 mayo)
- ✅ **Fase 3 completada** (8 diferidos cerrados, 0 bugs colaterales nuevos — 2 mayo)
- ✅ **Correcciones post-Fase 3 aplicadas y desplegadas** (2 mayo, smoke test):
  - Rechazar foto conserva el mensaje en el muro (solo se borra la foto)
  - El formulario de desktop se limpia automáticamente tras un envío correcto
  - Eliminar una sección de partidas avisa en rojo si alguna partida tiene aportaciones reales, con recomendación de mover a "Sin asignar"
  - Borrar una aportación conserva el mensaje y la foto en el muro — solo se elimina la aportación económica y los contadores se decrementan si estaba pagada
  - Bug `No document to update` al borrar aportaciones consecutivas: corregido verificando existencia del mirror antes del update
- ✅ Rules de Firestore actualizadas y desplegadas con FK suave por formato
- ✅ Checkbox RGPD obligatorio en el formulario, link a `/privacy`, mención explícita de PANGEA
- ✅ Errores del formulario específicos por fase (foto / guardado / desconocido)
- ✅ Bloqueo de cierre del modal durante envío (prevención de duplicados)
- ✅ Paginación admin con cursor (50 docs/página) en mensajes y aportaciones
- ✅ Moderación de fotos con dos acciones distintas (rechazar foto vs borrar entrada)
- ✅ Conteo real de contribuciones al borrar una partida (hard delete)
- ✅ **Auditoría pre-lanzamiento aplicada (2 mayo 2026)** — 8 hallazgos cerrados en dos olas (C1, C2, C3, I2, I4, I6, I7, I12). Detalle en [`HISTORIAL_TECNICO.md`](HISTORIAL_TECNICO.md):
  - Validación de tamaño de `message` en rules de `contributions` (prev. solo en messageWall)
  - Reintentos con backoff exponencial en EmailJS + `pangea_status` en correo al admin si los reintentos fallan
  - Eliminado timeout 2 s en hooks de Firestore (causaba estado vacío engañoso en redes lentas)
  - `error` expuesto en cada hook para feedback futuro de "conexión perdida"
  - `submittingRef` síncrono en `ManualContributionForm` (mismo patrón que el form público)
  - `overflow-wrap: anywhere` en mensajes para URLs largas
  - Touch targets ≥44 px en `FormModal.closeBtn` y CTA "Regalar"
  - `ErrorBoundary` global con fallback en castellano y enlace de contacto
- ✅ Plan EmailJS subido a 2.000 emails/mes (margen amplio para 100+ aportaciones × 2 emails)
- ✅ **Correcciones urgentes post-auditoría aplicadas y desplegadas (2 mayo, tras el primer envío real)** — detalle en [`HISTORIAL_TECNICO.md`](HISTORIAL_TECNICO.md):
  - Bug del regex de `tripItemId` en rules: `^[A-Za-z0-9_-]{20}$` exigía 20 chars exactos pero los IDs reales del seed son `tripItem-01..29` (11 chars). Toda aportación a partida concreta era rechazada con `permission-denied`. Regex relajado a `{6,64}` para cubrir IDs deterministas + auto-IDs. Rules redesplegadas (commit `7f27511`).
  - Confirmación de escritura con `waitForPendingWrites`: `setDoc` resolvía contra cache local sin esperar al servidor (persistencia offline activa). Una red mala podía dejar la escritura solo en local mientras la UI mostraba "guardado". Ahora se exige ack del servidor con timeout de 15 s antes de declarar éxito; si timeout, copy específico ("comprueba tu conexión") y NO se hace cleanup local. Copy de `errors.save` reescrito para no afirmar falsamente "hemos llegado a guardar". Nuevo `errors.serverTimeout` (commit `4fb74bc`).
- ✅ **Smoke test end-to-end confirmado**: la primera participación real del proyecto (esposa de Gerry, con partida concreta) se guardó correctamente en Firestore y apareció en `/admin` tras desplegar los dos fixes urgentes. Camino completo verificado: cliente público → rule acepta → `waitForPendingWrites` → `notifyPangea` → `notifyAdmin` → `SuccessOverlay` → doc visible en admin.
- ✅ **Subida manual de fotos desde admin sin notificar al feed (commit `2ba44e6`)**: nueva pestaña "Subir foto" en `/admin` para incorporar fotos recibidas por WhatsApp en nombre de la persona. Los docs llevan `excludeFromFeed: true` y `subscribeRecentContributions` filtra el feed del hero por ese flag. Rule `allow create: if isAdmin()` añadida en `messageWall` para que el admin pueda escribir esos campos especiales sin pasar por las validaciones públicas. La rule pública sigue intacta.
- 🎉 **Lanzamiento ejecutado el lunes 5 de mayo de 2026** — campaña activa, contribuciones reales en producción.
- ✅ **PR 1 admin desplegado y verificado en producción (6 mayo 2026, merge commit `da54859`)** — primer PR de mejoras post-lanzamiento, **solo lectura**, sin tocar `firestore.rules` ni el flujo público:
  - Dashboard de totales en la cabecera del panel admin: tres tarjetas en tiempo real sobre `contributions` pagadas — Total recaudado, Asignado a partidas (con `tripItemId` válido), Sin asignar (fondo general / sin preferencia). Reusa el listener legacy `subscribeAdminContributions(callback)` que ya viven `ExportTools` y `EmailJsAlert`, sin abrir un suscriptor nuevo.
  - Indicador "Importe privado" en `ContributionsList`: el icono Lock minúsculo con tooltip se sustituye por un pill visible bajo el importe (mismo lenguaje visual que `manualBadge` y `status`). Etiqueta literal "Importe privado".
  - Verificación post-deploy: las cifras del dashboard cuadran con el termómetro del hero, el pill aparece en las contribuciones con `amountPrivate: true`, página pública idéntica.
- ✅ **PR 2 admin desplegado y verificado en producción (6 mayo 2026, merge commit `f7b2116`)** — segundo PR post-lanzamiento, **escritura** sobre `contributions` y `messageWall` con transacción atómica. Sin cambios en `firestore.rules` (la regla actual `allow update, delete: if isAdmin()` ya cubre los nuevos campos):
  - Reasignación manual de la partida (`tripItemId`) desde la fila de cada aportación en `/admin`, vía `reassignContributionTripItem(id, newTripItemId)` en `src/firebase/contributions.js`. Transacción que actualiza la contribution, el mirror de `messageWall` y reajusta `raisedAmount` + `contributorCount` en las dos partidas afectadas (vieja y nueva). `config/general.totalRaised` no se toca: el total no cambia, solo cambia el bucket.
  - Nuevos campos en docs de `contributions`: `originalTripItemId` (escrito una sola vez la primera vez que se reasigna; preserva la elección original) y `manuallyAssignedAt` (timestamp del último cambio).
  - Filtro "Sin asignar" en `ContributionsList` (4º filtro junto a Todas/Pendientes/Pagadas), botón "Cambiar partida" inline en cada fila (mismo patrón visual que "Editar importe"), badge "Elegida por el donante" cuando la contribución viene del formulario público con partida concreta y aún no se ha reasignado, hint "Reasignada · original: X" tras la primera reasignación.
  - Verificación post-deploy con reasignaciones reales (6 mayo): contribuciones sin asignar movidas a partidas concretas; persistencia en Firestore confirmada, `originalTripItemId` y `manuallyAssignedAt` escritos correctamente, termómetros públicos reajustados y dashboard de tres tarjetas reflejando el cambio (Sin asignar baja, Asignado a partidas sube por el mismo importe).

- ✅ **Fix del botón "Enviando…" clavado por subida de foto sin timeout (22 mayo 2026, PR #35, merge `1f58da8`)**. Detalle en [`HISTORIAL_TECNICO.md`](HISTORIAL_TECNICO.md). Una foto pesada subida con conexión lenta dejaba el botón del formulario clavado en "Enviando…" para siempre, sin error, porque `uploadBytes` no tenía timeout y la promise colgada impedía que el `finally` reseteara el botón. Solución: `Promise.race` con timeout de 60 s en `uploadPhoto` (mismo patrón que `awaitServerAck`) que rechaza con `upload-timeout` y permite reintentar, más endurecimiento de `compressImage` para no subir el original a ciegas si supera 3 MB. Sin tocar EmailJS, Firestore ni el orden de operaciones.

- ✅ **Fix de conversión HEIC para móviles Samsung (23 mayo 2026, merge `3c85a73`)**. Detalle en [`HISTORIAL_TECNICO.md`](HISTORIAL_TECNICO.md). Las fotos HEIC de un Galaxy S24 Ultra (y de iPhone) se rechazaban con un falso "formato no compatible, sube JPG/PNG/WEBP" porque `heic2any@0.0.4` llevaba un libheif antiguo que no las decodificaba. Tras verificar en laboratorio (Node y navegador, en el propio Galaxy) que un libheif moderno sí convierte la foto, se sustituyó `heic2any` por `heic-to` (`^1.4.3`, libheif-js 1.19.x) en `convertHeic.js` y se reescribió el mensaje de error de `PhotoUploader` para que sea honesto y accionable. Sin tocar tamaño, timeout, compresión, Firestore ni emails.

- 🔄 **Objetivo de campaña dinámico (6 junio 2026, PR #40 abierto, pendiente de merge y deploy)**. Detalle en [`HISTORIAL_TECNICO.md`](HISTORIAL_TECNICO.md). El porcentaje global de la página pública (hero y cabecera de "Las experiencias del viaje") deja de calcularse sobre un target fijo hardcodeado (`config.totalTripCost ?? 10500`) y pasa a derivarse en tiempo real de la suma de los `targetAmount` de las partidas activas en Firestore — nuevos `sumCampaignTarget(items)` y hook `useCampaignTarget()` sobre el listener reactivo de `tripItems`, así que altas/ediciones/archivados de partida se reflejan sin tocar código. Ambos indicadores públicos siguen mostrando solo el porcentaje, nunca euros. En el panel admin se añade una 4ª tarjeta de solo lectura "Objetivo total" con ese mismo cálculo en euros (cifra que no aparece en ningún sitio de la página pública). Sin cambios en `firestore.rules` ni en el flujo de escritura. Build verde; pendiente de verificación en producción tras el merge.

**Riesgos residuales conocidos** (no bloquean el lanzamiento, documentados en [`docs/HISTORIAL_TECNICO.md`](HISTORIAL_TECNICO.md)):
- Paginación admin pierde reactividad en docs >50 (hace falta refrescar para ver cambios en docs viejos).
- FK suave en rules acepta IDs con formato válido pero sin doc real (impacto bajo: huérfano detectable por admin).
- Sin rate limiting honesto en rules — requiere Cloud Functions; mitigado por anti doble-clic en cliente y validación RGPD.
- Fallo transitorio puntual de EmailJS: la contribución queda guardada y `notifyAdmin` recibe `pangea_status: 'failed'`; el admin atiende manualmente. Probabilidad baja con plan de 2.000 emails/mes y 3 reintentos con backoff.

**Hallazgos de la auditoría diferidos a post-lanzamiento (no bloqueantes):**
- I1 (seed.js no preserva contadores en re-ejecución), I5 (`ManualContributionForm.row2` colapsa en mobile estrecho), I8 (`HeroSection .portraitWrap` 320 px fijos en mobile landscape), I9 (`SuccessOverlay z-index: 1000` hardcoded vs sistema de tokens), I10 (`setMessageHidden`/`deleteMessage` propagan errores sin handler), I11 (paginación admin no totalmente reactiva, ya documentado arriba), y todos los menores M1–M10.
