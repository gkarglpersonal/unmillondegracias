# Runbooks

Carpeta para prompts operativos reutilizables: instrucciones autocontenidas
que una sesión nueva de Claude Code puede ejecutar para reproducir un patrón
de trabajo definido en una sesión previa.

A diferencia de `docs/audits/` (que documenta lo ya hecho), aquí viven las
instrucciones para hacer.

## Índice

| Documento | Estado | Resumen |
|---|---|---|
| [Fase 3 — kickoff autónomo](./fase-3-kickoff.md) | 📋 Listo para pegar | Wrapper que se pega tal cual en sesión nueva. Verifica prerequisitos manuales (CORS + Auth domains), hace setup git, da permisos amplios y delega al runbook técnico de fase 3. |
| [Fase 3 — runbook técnico (diferidos de fase 2)](./fase-3-deferidos.md) | 📋 Listo para ejecutar | 8 puntos que la fase 2 dejó por límite de tiempo: paginación admin, rules FK + rate limit, RGPD checkbox, photos rechazo trifásico, errores submit específicos, FormModal block mid-submit, conteo real en hard delete. Incluye preámbulo "Estado al 2026-05-02" con extras de fase 2. |
| [Fase 2 — kickoff autónomo](./fase-2-kickoff.md) | ✅ Ejecutado 2026-05-01 | Wrapper de arranque. Resultado: ver [audit fase 2](../audits/2026-05-01-fase-2-mejoras.md). |
| [Fase 2 — runbook técnico](./fase-2-importantes-menores.md) | ✅ Ejecutado 2026-05-01 | Especificación de los 22 puntos. 14/22 cerrados; los 8 restantes pasaron a fase 3. |

## Cómo usar

1. Abre el runbook que corresponde.
2. Copia el bloque marcado como **"Pega esto en una sesión nueva de Claude
   Code"**.
3. Pégalo como primer mensaje en una sesión nueva, en el directorio raíz del
   proyecto.
4. Claude leerá el contexto, planificará y ejecutará.

## Convención de nombres

`<scope>-<slug>.md`. Ejemplos:

- `fase-N-tema.md` — para fases sucesivas de mejoras del proyecto.
- `auditoria-trimestral.md` — para procesos recurrentes.
- `pre-lanzamiento.md` — para checklist antes de eventos clave.

## Qué incluye un runbook bueno

- **Contexto del proyecto** suficiente para alguien que entra cold.
- **Referencia a docs previos** (`docs/audits/`, `ARCHITECTURE.md`).
- **Alcance** explícito y delimitado.
- **Permisos pre-aprobados** del usuario (git push, deploy, etc.).
- **Decisiones pre-aprobadas** (idioma, marca, convenciones).
- **Patrón a seguir** (auditar → planificar olas → ejecutar → QA → reportar).
- **Entregable** que se espera al final.
- **Cómo manejar imprevistos** (alcance excesivo, bugs colaterales, fallos).
