# Runbook — Fase 2: hallazgos importantes y menores

Runbook autocontenido para ejecutar la fase 2 de fixes en
`unmillondegracias.com` con el mismo patrón orquestado de la fase 1
(agentes paralelos + QAs independientes + gates + reportes).

## Cómo usarlo

1. Abre una sesión nueva de Claude Code en el directorio raíz del proyecto.
2. Verifica que estás en una rama nueva limpia (no en la rama de fase 1):
   ```bash
   git checkout main && git pull origin main
   git checkout -b claude/fase-2-mejoras
   ```
3. Copia el contenido del bloque "Prompt" de abajo.
4. Pégalo como primer mensaje en la sesión nueva.
5. Claude planificará y ejecutará. Si tienes preferencias adicionales,
   menciónalas tras pegar el prompt y antes de dar luz verde.

---

## Prompt

> Pega todo lo que va entre los triple-comilla a continuación como primer
> mensaje en la sesión nueva.

````
# Misión: ejecutar la fase 2 de fixes en unmillondegracias.com

Vas a coordinar una operación de fixes con el mismo patrón que se usó en la
fase 1 (documentado en `docs/audits/2026-04-30-fixes-criticos.md`): planificar
olas de agentes paralelos con archivos disjuntos, lanzar QAs independientes
tras cada commit, reparar si un QA encuentra problemas dentro del scope,
anotar bugs colaterales sin tocarlos, y entregar reporte final.

## Contexto del proyecto

`unmillondegracias.com` es un regalo colectivo a Mariángeles (lista de bodas
10.500 € para viaje a Argentina con PANGEA, abril 2026). Stack: Vite + React
18 (JSX, no TS) + CSS Modules + Firebase (Firestore + Storage + Auth) +
EmailJS. Sin tráfico ni campaña activa actualmente.

**Lee primero estos archivos antes de planificar nada**:

1. `docs/audits/2026-04-30-fixes-criticos.md` — historial de la fase 1.
   Especialmente las secciones "Bugs colaterales detectados" y "Patrón de
   orquestación reutilizable".
2. `ARCHITECTURE.md` — modelo de datos, decisiones técnicas.
3. `firestore.rules` y `storage.rules` — estado actual de las reglas
   desplegadas.

## Alcance de esta fase

Resolver los **12 hallazgos importantes** y **7 menores** de la auditoría
del 2026-04-30, más **3 bugs colaterales** detectados por los QAs de la fase
1 y que quedaron fuera de aquel alcance. Total: 22 puntos.

### Importantes (degradan la experiencia de forma observable)

7. **iOS Safari hace zoom al hacer focus en inputs** —
   `src/components/form/ParticipationForm.module.css:49-88`. Inputs con
   `font-size: var(--fs-body-lg)` (~19px desktop) sin media query mobile.
   Asegurar `>= 16px` en mobile para evitar zoom en iOS.

8. **Textarea de 220px fija aplasta el form en mobile landscape** —
   `src/components/form/ParticipationForm.module.css:142`. Reducir altura
   en breakpoints mobile/landscape.

9. **Carruseles con `100vw - 48px` y gap de breakpoint 768–900px** —
   `src/components/thermometers/ThermometersGrid.module.css:238` y
   `src/components/history/HistorySection.module.css:78`. Causa overflow
   horizontal en navegadores con scrollbar contado en `100vw`. Tablets
   768–899px sin ajuste.

10. **StickySidebar con `height: 100vh` se rompe en laptops 13"** —
    `src/components/layout/Layout.module.css:25`. El form + SuccessOverlay
    puede superar la altura disponible.

11. **SuccessOverlay no bloquea body en desktop y es fácil no verlo** —
    `src/components/form/StickySidebar.jsx:26-28`. Falta z-index global y
    body-lock cuando el overlay está activo.

12. **TripItemPicker no maneja estado de carga** —
    `src/components/form/TripItemPicker.jsx:14, 39-43`. `useTripItems()`
    expone `loading` pero el componente lo ignora. Mostrar "Cargando…" o
    deshabilitar dropdown.

13. **Listeners admin sin `limit()`** —
    `src/firebase/messageWall.js:103-110` (admin moderation) y
    `src/firebase/contributions.js:79-92` (lista admin). Cada snapshot trae
    todos los docs. Añadir paginación con cursor.

14. **AmountField acepta valores negativos por escritura manual** —
    `src/components/form/AmountField.jsx:73-85`. `min="1"` HTML5 no impide
    pegar `-100`. Filtrar en el handler o ajustar validación zod para
    feedback inmediato.

15. **CityNode imágenes con `height: 220px` fijo sin aspect-ratio** —
    `src/components/thermometers/CityNode.module.css:63`. Aplicar
    `aspect-ratio` declarativo para evitar CLS y cortes.

16. **Reglas Firestore sin validar FK ni rate limiting** — `firestore.rules`.
    `messageWall.create` no valida que `contributionId` ni `tripItemId`
    apunten a docs reales. El rate limiting prometido en
    `ARCHITECTURE.md` §8 #12 (`request.time > resource.data.lastSubmit +
    duration`) no está implementado. Añadir validación FK suave (al menos
    formato/longitud) y rate limit por dirección IP / por documento previo.

17. **Privacy.jsx no enlazado desde el formulario (RGPD)** —
    `src/pages/Home.jsx:63-74`. Existe en footer pero el form no menciona
    consentimiento ni que el email viaja a PANGEA. Añadir checkbox
    obligatorio "He leído la política de privacidad" con link a
    `/privacy`, y línea de copy explícita sobre PANGEA.

18. **PhotosModeration: rechazar foto borra también el mensaje** —
    `src/components/admin/PhotosModeration.jsx:51-58`. Añadir opción
    "rechazar foto, conservar mensaje" que solo borre la foto y deje el
    `messageWall` con `photoStoragePath: null`.

### Menores (pulido)

19. **"Pangea" en minúsculas** — `src/content/copy.js:116`. Cambiar a PANGEA.

20. **Mensaje de error genérico en submit** —
    `src/components/form/ParticipationForm.jsx:132-134`. Distinguir si
    falló foto, Firestore o email para que el usuario sepa qué reintentar.

21. **ExportTools sin progreso durante descarga ZIP** —
    `src/components/admin/ExportTools.jsx:55-69`. Mostrar progreso o
    spinner mientras se genera el blob (con 50+ fotos parece colgado).

22. **Auth persistence no configurado** — `src/firebase/config.js`. Añadir
    `setPersistence(LOCAL)` para evitar deslogueo entre recargas.

23. **FloatingCTA mobile sigue clickable con FormModal abierto** —
    `src/components/layout/FloatingCTA.jsx`. Ocultarlo o deshabilitarlo
    cuando el modal está visible.

24. **`config/general` no se garantiza al desplegar** — `useConfig` hace
    fallback a 0, pero los contadores podrían arrancar en silencio si el
    doc se borra. Añadir bootstrap defensivo.

25. **ContributorCounter `clamp()` poco fluido entre 500–800px** —
    `src/components/hero/ContributorCounter.module.css:12`. Ajustar la
    función para transición suave.

### Bugs colaterales detectados por QAs de fase 1

C-1 (severidad **media**) — **Cierre de modal mid-submit pierde
`attemptStateRef`**. Si el usuario cierra `FormModal` mientras el submit
está en vuelo y el primer write completó, un reintento posterior generaría
IDs nuevos → duplicado en BD. Fix: bloquear botón × y tecla ESC mientras
`submitting === true` (patrón ya existe para `success`).
Archivos: `src/components/form/FormModal.jsx`,
`src/components/form/ParticipationForm.jsx`.

C-2 (severidad **media**) — **Modal "Eliminar permanentemente" en
TripItemsManager muestra `contributorCount` agregado en lugar de query
real**. Fix: hacer `getDocs` en tiempo real al abrir el modal sumando
matches en `messageWall` y `contributions`.
Archivo: `src/components/admin/TripItemsManager.jsx`.

C-3 (severidad **media-saneamiento**) — **`eslint.config.js` no declara
globals de browser**. ~42 errores `no-undef` pre-existentes
(`setTimeout`, `confirm`, `URL`, `Blob`, `IntersectionObserver`, `alert`,
`window`). Fix de una línea con el paquete `globals`.
Archivo: `eslint.config.js`.

## Permisos pre-aprobados (mismos que en fase 1)

- Trabaja en una rama dedicada (`claude/fase-2-mejoras` o similar). Si ya
  estás en una, úsala.
- Un commit por agente con prefijo claro:
  `fix(importante-N):` o `fix(menor-N):` o `fix(colateral-C-N):`.
- `git push` autorizado sin pedir confirmación.
- `firebase deploy --only firestore:rules` autorizado si tu fix toca rules.
  El proyecto activo es `mariangeles-viaje-32169`.
- Tocar datos en Firestore vía script si es necesario (con autorización
  para ejecutar).
- Si un QA encuentra bugs nuevos no relacionados → anotar, no tocar.
- Tope de **30 minutos** wall-clock para todo el proceso (puedes negociar
  ampliar si planificas y ves que no cabe — explica por qué).

## Decisiones pre-aprobadas (mismas que en fase 1)

- Castellano de Madrid en todo copy nuevo: "importe", "rellena", "ha dado",
  "te enviaremos", "se descontará", "no se puede deshacer". Evita "monto",
  "llena", "dio".
- **PANGEA siempre en mayúsculas**.
- JavaScript, no TypeScript.
- CSS Modules, no Tailwind ni styled-components.
- Mantén react-hook-form + zod en formularios.
- No introduzcas dependencias nuevas sin justificación fuerte (excepción:
  `globals` para fix C-3, autorizado).
- No uses `--no-verify`, `--no-gpg-sign` ni toques `git config`.
- No uses `git push --force` ni nada destructivo.

## Patrón operacional a seguir

### Paso 0 — Lee y entiende

1. Lee `docs/audits/2026-04-30-fixes-criticos.md` completo.
2. Lee `ARCHITECTURE.md`.
3. Verifica el estado actual: `git log --oneline -5`, `git status`,
   `npm run build`, `npm run lint`.

### Paso 1 — Mapeo de archivos compartidos

Para cada uno de los 22 puntos, identifica los archivos que necesita tocar.
Construye una matriz puntos × archivos. Identifica solapamientos. Esto
determina qué se puede paralelizar y qué debe secuenciarse.

Pista: la mayoría de los importantes responsive son CSS aislados
(paralelizables), los UX form tocan archivos de `form/` (algunos
solapan), y los backend tocan rules + hooks (mayormente disjuntos).

### Paso 2 — Plan de olas

Agrupa los 22 puntos en olas según solapamiento de archivos. Espera 2-3
olas. Para cada ola:

- Lista los puntos que se atacan.
- Lista los agentes a lanzar (1 agente por grupo de archivos sin solape).
- Define el contrato de interfaz si los agentes comparten dependencias.
- Estima si entra en el presupuesto de tiempo.

Si planificando ves que el alcance excede 30 min wall-clock, **propón al
usuario priorizar y dejar el resto en una fase 3 documentada como nuevo
runbook**. No empieces a ejecutar a ciegas.

### Paso 3 — Ejecución

Para cada ola:

1. **Lanza los agentes en paralelo** (subagent_type
   `general-purpose`, `run_in_background: true`). Cada agente con prompt
   self-contained que incluya: misión, archivos asignados, archivos
   prohibidos, contrato de interfaz, permisos, convenciones, criterios de
   éxito, formato de reporte final.
2. Cuando un agente termina, **lanza su QA** (también
   `general-purpose`, read-only, con autorización pre-aprobada para
   ejecutar `git show`, `npm run build`, `npm run lint` sin pedir permiso —
   este punto es importante porque en fase 1 un QA Explore se atascó
   pidiendo permisos).
3. Si QA detecta hallazgos dentro del scope del fix → reparación con
   sub-agente, máximo 2 reintentos.
4. Si QA detecta bugs colaterales → anota en lista, no toques.
5. Avanza a la siguiente ola cuando todos los gates de la actual estén
   superados.

### Paso 4 — Despliegue

1. `git push origin <rama>` (autorizado).
2. Si tocaste rules o indexes:
   `firebase deploy --only firestore:rules` (autorizado).
3. Verifica que los commits están en GitHub.

### Paso 5 — Documentación

Crea un report estructurado en `docs/audits/YYYY-MM-DD-fase-2-mejoras.md`
siguiendo la convención del report de fase 1 (mismas secciones: metadata,
TL;DR, contexto, diseño operacional, permisos, trabajo por punto, acciones
ejecutadas, pendientes, bugs colaterales, smoke test, cómo retomar).

Añade entrada en `docs/audits/README.md`.

Commitea como `docs(audits): report consolidado fase 2`.

## Entregable final esperado

Cuando termines, devuelve al usuario:

1. Resumen ejecutivo: cuántos puntos resueltos vs cuántos diferidos a fase
   3, lista de commits, resultados de push y deploy.
2. Tabla por punto: estado (✅ / ⏸ diferido), commit, veredicto QA.
3. Bugs colaterales nuevos detectados por los QAs de esta fase.
4. Smoke test recomendado en navegador.
5. Path al report en `docs/audits/`.

## Reglas de honestidad

- Si en la fase 1 algo se prometió y se rompió, dilo.
- Si un QA encuentra un fallo en tu fix, no minimices: repara o reporta.
- Si no puedes completar todo en 30 min, para a tiempo y deja un runbook
  para fase 3, no comprimas la calidad.
- Si una decisión técnica te incomoda, pregunta antes de actuar.

Arranca cuando estés listo.
````

---

## Notas de mantenimiento de este runbook

- Si el alcance cambia (puntos resueltos en otras tandas, prioridades
  diferentes), actualiza el bloque "Alcance de esta fase" antes de
  ejecutar.
- Si encuentras que el patrón orquestado se quedó corto en algún aspecto,
  refleja la lección en el README de `docs/runbooks/` y en el report de
  la sesión.
- Este runbook **no es una promesa**: el alcance puede partirse en sub-
  fases si el wall-clock excede el presupuesto. Lo importante es la
  calidad y la trazabilidad, no exprimir 22 puntos en 30 minutos.
