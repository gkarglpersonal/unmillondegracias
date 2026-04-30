# Runbooks

Carpeta para prompts operativos reutilizables: instrucciones autocontenidas
que una sesión nueva de Claude Code puede ejecutar para reproducir un patrón
de trabajo definido en una sesión previa.

A diferencia de `docs/audits/` (que documenta lo ya hecho), aquí viven las
instrucciones para hacer.

## Índice

| Documento | Estado | Resumen |
|---|---|---|
| [Fase 2 — importantes y menores](./fase-2-importantes-menores.md) | 📋 Listo para ejecutar | Resuelve los 12 hallazgos importantes + 7 menores de la auditoría 2026-04-30 + 3 bugs colaterales detectados por QAs de fase 1. |

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
