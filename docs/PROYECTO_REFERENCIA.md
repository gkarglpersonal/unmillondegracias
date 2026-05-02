# unmillondegracias.com — Documento de referencia maestro

*Última actualización: 2 de mayo de 2026 (auditoría pre-lanzamiento + dos fixes urgentes posteriores con smoke test E2E confirmado)*

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

- **Aportaciones:** ver todas, marcar como pagadas, añadir manuales, editar importes
- **Mensajes:** mostrar/ocultar (se publican automáticamente, no requieren aprobación)
- **Fotos:** aprobar o rechazar (requieren aprobación manual antes de aparecer en la galería)
- **Partidas:** crear, editar, archivar (soft delete con active: false), borrar si no tienen contribuciones
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

## Estado al 2 de mayo de 2026

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
- 🚀 **Lista para lanzamiento: lunes 5 de mayo de 2026 — sin puntos técnicos pendientes bloqueantes**

**Riesgos residuales conocidos** (no bloquean el lanzamiento, documentados en [`docs/HISTORIAL_TECNICO.md`](HISTORIAL_TECNICO.md)):
- Paginación admin pierde reactividad en docs >50 (hace falta refrescar para ver cambios en docs viejos).
- FK suave en rules acepta IDs con formato válido pero sin doc real (impacto bajo: huérfano detectable por admin).
- Sin rate limiting honesto en rules — requiere Cloud Functions; mitigado por anti doble-clic en cliente y validación RGPD.
- Fallo transitorio puntual de EmailJS: la contribución queda guardada y `notifyAdmin` recibe `pangea_status: 'failed'`; el admin atiende manualmente. Probabilidad baja con plan de 2.000 emails/mes y 3 reintentos con backoff.

**Hallazgos de la auditoría diferidos a post-lanzamiento (no bloqueantes):**
- I1 (seed.js no preserva contadores en re-ejecución), I5 (`ManualContributionForm.row2` colapsa en mobile estrecho), I8 (`HeroSection .portraitWrap` 320 px fijos en mobile landscape), I9 (`SuccessOverlay z-index: 1000` hardcoded vs sistema de tokens), I10 (`setMessageHidden`/`deleteMessage` propagan errores sin handler), I11 (paginación admin no totalmente reactiva, ya documentado arriba), y todos los menores M1–M10.
