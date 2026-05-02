# Kickoff — Fase 3 (sesión autónoma)

Wrapper de arranque para ejecutar la fase 3 completa de forma autónoma.
Mientras [`fase-3-deferidos.md`](./fase-3-deferidos.md) es la **especificación
técnica** (alcance, archivos, criterios), este kickoff es el **prompt
para pegar tal cual** en una sesión nueva de Claude Code: hace el setup
git, da permisos amplios desde el inicio, e inyecta las lecciones
aprendidas en fases 1 y 2.

## Cómo usar

1. Abre una sesión nueva de Claude Code en la raíz del proyecto
   `unmillondegracias.com` (no en un worktree de fase anterior).
2. Copia el contenido entre las cuatro comillas invertidas a continuación.
3. Pégalo como primer mensaje en la sesión nueva.
4. Vete a otra cosa. Vuelve cuando Claude reporte el resultado final.

---

## Prompt

````
# Misión: ejecutar la fase 3 completa de fixes en unmillondegracias.com

Tu trabajo es cerrar los puntos diferidos de fase 2 más los pendientes
que la fase 2 destapó. Sigue el patrón validado en fases 1 y 2: olas de
agentes paralelos con archivos disjuntos, QAs independientes tras cada
commit, gates de build/lint, anotar bugs colaterales sin tocarlos,
reportar al final.

## Prerequisitos manuales que YO (el usuario) tengo que tener hechos

Antes de planificar, pregúntame si he hecho estas dos cosas. Si dudo,
proponme una manera concreta de comprobarlo:

1. **CORS aplicado al bucket de Storage** — el archivo `cors.json` está
   en la raíz del repo desde fase 2. Tuve que aplicarlo manualmente
   con:
   ```
   gsutil cors set cors.json gs://mariangeles-viaje-32169.firebasestorage.app
   ```
   Síntoma de NO estar aplicado: aprobar fotos en /admin → Fotos falla
   con `[descargar pending] descarga falló — fetch: Failed to fetch;
   SDK getBlob: storage/retry-limit-exceeded`.

2. **`unmillondegracias.com` añadido a Authorized domains de Firebase
   Auth** — Firebase Console → Authentication → Settings → Authorized
   domains. Login con email/password funciona sin esto, pero si en el
   futuro se añade OAuth (Google, Apple) se rompe.

Si alguno NO está hecho, para y pídeme que lo haga. No tiene sentido
arrancar la ola técnica si la base no está lista.

## Contexto del proyecto

`unmillondegracias.com` es un regalo colectivo a Mariángeles, lista de
bodas 10.500 € para viaje a Argentina con PANGEA, abril 2026. Stack:
Vite + React 18 (JSX, no TS) + CSS Modules + Firebase (Firestore +
Storage + Auth) + EmailJS. Sin tráfico ni campaña activa.

## Lecturas obligatorias antes de planificar nada

1. `docs/audits/2026-04-30-fixes-criticos.md` — fase 1 (6 críticos
   cerrados). Especialmente "Patrón de orquestación reutilizable" y
   "Bugs colaterales detectados".
2. `docs/audits/2026-05-01-fase-2-mejoras.md` — fase 2 (14 puntos
   cerrados + 8 diferidos a esta fase + extras como HEIC, robustez de
   aprobar foto, ver-más en muro). Esto te dice qué NO repetir.
3. `docs/runbooks/fase-3-deferidos.md` — runbook técnico que vas a
   ejecutar. Tiene los 8 puntos con scope, decisiones a tomar y
   criterios de éxito.
4. `ARCHITECTURE.md` — modelo de datos y decisiones técnicas.
5. `firestore.rules` y `storage.rules` — estado desplegado en
   `mariangeles-viaje-32169`.

## Setup automático (hazlo tú primero, sin preguntarme)

1. Verifica que estás en la raíz del proyecto `unmillondegracias.com`.
2. `git status`. Si el working tree NO está limpio, para y reporta.
3. `git checkout main && git pull origin main`.
4. `git checkout -b claude/fase-3-deferidos` (sufijo `-vN` si ya
   existe).
5. Verifica que existe `docs/runbooks/fase-3-deferidos.md` — es
   prerequisito.

## Permisos pre-aprobados (no pidas confirmación)

- Trabaja en la rama `claude/fase-3-deferidos`. Un commit por agente
  con prefijo: `fix(importante-N):` / `fix(menor-N):` /
  `fix(colateral-C-N):`. Bundling cuando los puntos comparten
  archivos, igual que en fase 2.
- `git push origin claude/fase-3-deferidos` autorizado.
- `firebase deploy --only firestore:rules,storage` autorizado si tu
  fix toca rules. Proyecto activo: `mariangeles-viaje-32169`. Recuerda
  que el flag correcto es `--only storage` (no `storage:rules`).
- Tocar datos en Firestore vía script si hace falta para que un fix
  funcione.
- Si encuentras un bug nuevo no relacionado con el alcance →
  anótalo, no lo toques.
- Tope wall-clock: 30 minutos. Si planificando ves que no entra,
  propón priorización y deja el resto en un nuevo runbook
  `docs/runbooks/fase-4-*.md`. No comprimas calidad.
- **NO mergees a main directamente** — al final empuja la rama y dame
  el comando para abrir PR (`gh pr create ...`) o instruyeme. Mi
  workflow es PR + merge desde GitHub UI.

## Decisiones pre-aprobadas (no las cuestiones)

- Castellano de Madrid: "importe", "rellena", "ha dado",
  "se descontará", "no se puede deshacer". Evita "monto", "llena",
  "dio".
- **PANGEA siempre en mayúsculas**.
- JavaScript, no TypeScript.
- CSS Modules, no Tailwind ni styled-components.
- Mantén react-hook-form + zod en formularios.
- No introduzcas dependencias nuevas salvo justificación fuerte
  (consulta el runbook técnico — algunas pueden estar pre-autorizadas).
- No uses `--no-verify`, `--no-gpg-sign`, `--force`, ni toques
  `git config`.

## Lecciones de fases 1 y 2 que tienes que aplicar

1. **Para los QAs usa `subagent_type: "general-purpose"`, NO
   `"Explore"`**. En fase 1 un QA Explore se atascó pidiendo permisos
   para `git show` y `npm run build`.

2. **En cada prompt de QA, incluye explícitamente esta línea**:
   > "AUTORIZACIÓN PRE-APROBADA: ejecuta directamente git show, git
   > diff, git log, npm run build, npm run lint, Read, Grep, Glob.
   > NO pidas permiso. NO modifiques archivos."

3. **Define contratos de interfaz claros** entre agentes que
   comparten dependencias indirectas (si Agente X cambia firma de
   `useTripItems`, Agente Y debe saberlo aunque no edite ese archivo).

4. **Lee el JSX antes de tocar el CSS de un componente**. En fase 2
   cambié `CityNode.image` de `height: 220px` a `aspect-ratio: 4/3`
   asumiendo que vivía en una columna del grid. Vivía en un banner
   full-width → 4/3 daba imágenes de 700 px de alto en desktop. Hubo
   que revertir. Lección: nunca asumas la estructura de un componente
   sin leer su render.

5. **La configuración Firebase puede divergir de lo que está en el
   repo**. En fase 2 redeployé `storage.rules` y el SDK detectó que la
   versión en producción NO coincidía con el repo: la subió. Cuando
   un comportamiento en producción te confunda, redeployar las rules
   es más barato que adivinar.

6. **El sitio se sirve desde GH Pages a partir de `main`**. Tus
   commits en una rama no llegan a producción hasta que se mergean a
   main vía PR + el GH Action despliega. Para verificar si un fix
   está en producción, comprueba que su commit está en `origin/main`,
   no solo en tu rama.

7. **CORS del bucket NO es uniforme bucket-level entre operaciones**.
   En fase 2 las subidas a /pending/ funcionaban desde
   unmillondegracias.com, pero las descargas vía `getBlob`/`fetch`
   fallaban con CORS. La asimetría confunde el diagnóstico. Si una
   operación de Storage falla con `Failed to fetch` o
   `retry-limit-exceeded` desde un origen que SÍ tiene otras
   operaciones funcionando, sospecha CORS antes que rules.

8. **Surface el error real al admin desde el principio**. En fase 2
   el handler de aprobar foto mostraba "Vuelve a intentarlo" sin
   código. El usuario no podía ayudar a debug. Cuando finalmente se
   mostró `err.code`, en 5 minutos identificamos CORS. En cualquier
   handler de admin, mostrar `err.code || err.message` en pantalla,
   no genéricos.

9. **Usa TodoWrite** desde el primer turno para trackear olas y
   gates. Yo lo voy a leer cuando vuelva.

10. **Marca chapters con `mcp__ccd_session__mark_chapter`** en
    transiciones grandes (Ola 1 → Gate 1 → Ola 2 → Reporte) para que
    la sesión sea navegable.

## Cómo manejar lo que pase

- **Si un QA encuentra fallos dentro del scope del fix** →
  reparación con sub-agente, máximo 2 reintentos. Si tras 2 sigue
  fallando, anota y avanza.
- **Si un QA encuentra bugs colaterales** → lista, no toques.
- **Si una ola falla compilación o lint nuevo** → repara antes de
  avanzar a la siguiente ola.
- **Si te encuentras con una decisión que el runbook no cubre y que
  cambiaría el alcance** → para, escribe la decisión que recomiendas,
  y reporta. Solo ahí me preguntas.
- **Si superas el tope de 30 min** → para a tiempo. Commitea lo que
  esté limpio. Genera el report parcial. Crea
  `docs/runbooks/fase-4-*.md` con lo pendiente.

## Entregable final cuando termines

1. Resumen ejecutivo en chat: cuántos puntos resueltos vs diferidos
   a fase 4, lista de commits con hash, resultado del push,
   instrucciones para abrir el PR.
2. Tabla por punto: estado (✅ / ⏸ diferido), commit, veredicto QA.
3. Bugs colaterales nuevos detectados en esta fase.
4. Smoke test recomendado en navegador.
5. Path al report en `docs/audits/YYYY-MM-DD-fase-3-deferidos.md`
   (créalo siguiendo el formato de los reports de fases 1 y 2).
6. Entrada nueva en `docs/audits/README.md`.
7. Commit final `docs(audits): report consolidado fase 3` empujado en
   la misma rama.

## Reglas de honestidad

- Si un fix queda con riesgo residual, dilo claramente en el report.
- Si un QA encuentra un fallo en algo que ya commitaste, no
  minimices: repara o documenta.
- Si dudas entre "compilar y mover" o "hacerlo bien aunque tome
  más", elige bien hecho.
- Si el alcance no cabe en 30 min, partir es lo correcto, no
  comprimir.

Arranca el setup ahora y luego lánzate. Empieza preguntándome solo
sobre los dos prerequisitos manuales (CORS, Auth domains). Para todo
lo demás, procede.
````

---

## Por qué este wrapper, y no solo el runbook

El runbook técnico (`fase-3-deferidos.md`) describe **qué** hacer.
Este kickoff describe **cómo arrancar**, qué permisos están dados desde
el primer turno y qué lecciones de fases 1 y 2 incorporar.

Sin este wrapper, una sesión nueva tendría que:

- Descubrir y pedir permisos uno a uno.
- Decidir por sí misma qué subagent_type usar para QAs (y posiblemente
  repetir el bug del Explore atascado).
- Esperar mi confirmación tras cada plan parcial.
- Asumir mal sin avisar — fase 2 me regaló un par de regresiones
  evitables (la del CityNode banner) por leer CSS sin leer JSX.

Con el wrapper, todo eso queda resuelto en el primer mensaje.

## Cuándo NO usar este kickoff

- Si vas a hacer cambios de alcance reducido (no toda la fase 3, solo
  unos puntos) → escribe un kickoff a medida copiando este, no uses
  este sin más.
- Si quieres revisar el plan antes de ejecutar → pega solo el runbook
  técnico, no este wrapper.
- Si la sesión es para auditar el resultado de una fase ya hecha →
  usa un prompt de auditoría, no este.

## Mantenimiento

Si en el futuro creas un kickoff equivalente para fase 4, copia este
archivo como `fase-4-kickoff.md` y ajusta nombres de rama, runbook
referenciado y lecciones nuevas que hayas aprendido en fase 3.
