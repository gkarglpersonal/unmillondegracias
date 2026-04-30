# Kickoff — Fase 2 (sesión autónoma)

Wrapper de arranque para ejecutar la fase 2 completa de forma autónoma.
Mientras `fase-2-importantes-menores.md` es la **especificación técnica**
(alcance, archivos, criterios), este kickoff es el **prompt para pegar tal
cual** en una sesión nueva de Claude Code: hace el setup git, da permisos
amplios desde el inicio, e inyecta las lecciones aprendidas en fase 1.

## Cómo usar

1. Abre una sesión nueva de Claude Code en la raíz del proyecto
   `unmillondegracias.com` (no en un worktree de fase 1).
2. Copia el contenido entre las cuatro comillas invertidas a continuación.
3. Pégalo como primer mensaje en la sesión nueva.
4. Vete a otra cosa. Vuelve cuando Claude reporte el resultado final.

---

## Prompt

````
# Misión: ejecutar la fase 2 completa de fixes en unmillondegracias.com

Tu trabajo es ejecutar de cabo a rabo la fase 2 de mejoras del proyecto sin pedir confirmaciones intermedias. Yo no quiero intervenir hasta que termines.

## Setup automático (hazlo tú primero, sin preguntarme)

1. Verifica que estás en la raíz del proyecto `unmillondegracias.com`.
2. Verifica `git status`. Si el working tree NO está limpio, para y reporta.
3. Asegura `main` actualizado:
   ```bash
   git checkout main && git pull origin main
   ```
4. Crea rama de trabajo:
   ```bash
   git checkout -b claude/fase-2-mejoras
   ```
   Si ya existe, súmale un sufijo `-vN` y avanza.
5. Verifica que existe `docs/runbooks/fase-2-importantes-menores.md`. Si no existe, para y reporta — el runbook es prerequisito.

## Plan a ejecutar

Lee a fondo `docs/runbooks/fase-2-importantes-menores.md`. Dentro encontrarás un bloque marcado como **"Prompt"** rodeado de cuatro comillas invertidas. Ese bloque es el plan completo que tienes que ejecutar literalmente, como si yo te lo hubiera pegado a mano. Sigue todas sus instrucciones: lectura previa, mapeo de archivos compartidos, plan de olas, ejecución con QAs en gates, reparaciones, deploy, reporte final.

Lee también, antes de planificar nada:
- `docs/audits/2026-04-30-fixes-criticos.md` — historial de la fase 1, especialmente las secciones "Patrón de orquestación reutilizable" y "Bugs colaterales detectados".
- `ARCHITECTURE.md` — modelo de datos.
- `firestore.rules` y `storage.rules` — estado actual desplegado.

## Permisos pre-aprobados (no pidas confirmación para nada de esto)

- Trabaja en la rama `claude/fase-2-mejoras` que acabas de crear. Un commit por agente con prefijo claro: `fix(importante-N):`, `fix(menor-N):`, `fix(colateral-C-N):`, `docs(audits):`.
- `git push origin claude/fase-2-mejoras` autorizado.
- `firebase deploy --only firestore:rules` (y `storage` si hace falta) autorizado. Proyecto activo: `mariangeles-viaje-32169`.
- Tocar datos en Firestore vía script si es necesario para que un fix funcione.
- Si encuentras un bug nuevo no relacionado con el alcance → anótalo, no lo toques.
- Tope wall-clock: 30 minutos. Si planificando ves que no entra, propón priorización y deja el resto en un nuevo runbook `docs/runbooks/fase-3-*.md`. No comprimas calidad.

## Decisiones pre-aprobadas (no las cuestiones)

- Castellano de Madrid: "importe", "rellena", "ha dado", "se descontará", "no se puede deshacer". Evita "monto", "llena", "dio".
- **PANGEA siempre en mayúsculas**.
- JavaScript, no TypeScript.
- CSS Modules, no Tailwind ni styled-components.
- Mantén react-hook-form + zod en formularios.
- No introduzcas dependencias nuevas salvo `globals` para el fix C-3 (eslint), que está pre-autorizado.
- No uses `--no-verify`, `--no-gpg-sign`, `--force`, ni toques `git config`.

## Lecciones de fase 1 que tienes que aplicar

1. **Para los QAs usa `subagent_type: "general-purpose"`, NO `"Explore"`**. En fase 1 un QA Explore se atascó pidiendo permisos para `git show` y `npm run build`. Los `general-purpose` no tienen ese problema.
2. **En cada prompt de QA, incluye explícitamente esta línea**:
   > "AUTORIZACIÓN PRE-APROBADA: ejecuta directamente git show, git diff, git log, npm run build, npm run lint, Read, Grep, Glob. NO pidas permiso. NO modifiques archivos."
3. **Define contratos de interfaz claros** entre agentes que comparten dependencias indirectas (ej: si Agente X cambia la firma de `useTripItems`, Agente Y debe saberlo aunque no edite el archivo).
4. **Usa TodoWrite** para trackear olas y gates desde el principio. Yo lo voy a leer cuando vuelva para entender el progreso.
5. **Marca chapters** con `mcp__ccd_session__mark_chapter` en transiciones grandes (Ola 1 → Gate 1 → Ola 2 → Reporte) para que la sesión sea navegable.

## Cómo manejar lo que pase

- **Si un QA encuentra fallos dentro del scope del fix** → reparación con sub-agente, máximo 2 reintentos por agente. Si tras 2 sigue fallando, anota y avanza.
- **Si un QA encuentra bugs colaterales** → lista, no toques.
- **Si una ola falla compilación o lint nuevo** → repara antes de avanzar a la siguiente ola.
- **Si te encuentras con una decisión arquitectónica que el runbook no cubre y que cambiaría el alcance** → para, escribe la decisión que recomiendas, y reporta. Solo ahí me quieres preguntar.
- **Si superas el tope de 30 min** → para a tiempo. Commitea lo que esté limpio. Genera el report de lo que se hizo. Crea `docs/runbooks/fase-3-*.md` con lo pendiente.

## Entregable final cuando termines

1. Resumen ejecutivo en chat: cuántos puntos resueltos vs diferidos, lista de commits con hash, resultado de push y deploy.
2. Tabla por punto: estado, commit, veredicto QA.
3. Bugs colaterales nuevos detectados en esta fase.
4. Smoke test recomendado en navegador.
5. Path al report en `docs/audits/YYYY-MM-DD-fase-2-mejoras.md` (créalo siguiendo el formato del report de fase 1).
6. Entrada nueva en `docs/audits/README.md` con la fila de la fase 2.
7. Commit final `docs(audits): report consolidado fase 2` empujado.

## Reglas de honestidad

- Si un fix queda con riesgo residual, dilo claramente en el report.
- Si un QA encuentra un fallo en algo que ya commitaste, no minimices: repara o documenta.
- Si dudas entre "compilar y mover" o "hacerlo bien aunque tome más", elige bien hecho.
- Si el alcance no cabe en 30 min, partir es lo correcto, no comprimir.

Arranca el setup ahora y luego lánzate. No me preguntes "¿procedo?" — procede.
````

---

## Por qué este wrapper, y no solo el runbook

El runbook técnico (`fase-2-importantes-menores.md`) describe **qué** hacer.
Este kickoff describe **cómo arrancar**, qué permisos están dados desde
el primer turno y qué lecciones de fase 1 incorporar.

Sin este wrapper, una sesión nueva tendría que:

- Pedir permisos uno a uno.
- Decidir por sí misma qué subagent_type usar para QAs (y posiblemente
  repetir el bug del Explore atascado).
- Esperar mi confirmación tras cada plan parcial.

Con el wrapper, todo eso queda resuelto en el primer mensaje.

## Cuándo NO usar este kickoff

- Si vas a hacer cambios de alcance (no toda la fase 2, solo unos puntos)
  → escribe un kickoff a medida, no uses este.
- Si quieres revisar el plan antes de ejecutar → pega solo el runbook
  técnico, no este wrapper.
- Si la sesión es para auditar el resultado de una fase ya hecha → usa
  un prompt de auditoría, no este.

## Mantenimiento

Si en el futuro creas un kickoff equivalente para fase 3, copia este
archivo como `fase-3-kickoff.md` y ajusta nombres de rama, runbook
referenciado y lecciones nuevas que hayas aprendido en fase 2.
