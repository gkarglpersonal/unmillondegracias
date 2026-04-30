# Auditorías y reports estructurados

Carpeta para documentar auditorías técnicas, refactors grandes y operaciones de
fix coordinadas en `unmillondegracias.com`.

Convención de nombres: `YYYY-MM-DD-slug-descriptivo.md`. Ordenadas por fecha
descendente.

## Índice

| Fecha | Documento | Resumen | Estado |
|---|---|---|---|
| 2026-04-30 | [Fixes críticos post-auditoría](./2026-04-30-fixes-criticos.md) | 6 críticos resueltos en 2 olas con QA gates. 5 commits, push + deploy a producción. | ✅ Cerrado |

## Carpetas relacionadas

- [`../runbooks/`](../runbooks/) — prompts operativos reutilizables para
  ejecutar fases sucesivas de mejoras con el patrón coordinado.

## Cómo añadir un report nuevo

1. Copia el formato del último report como plantilla.
2. Nombre del archivo: `YYYY-MM-DD-slug.md`.
3. Añade una fila al índice de arriba.
4. Commitea junto al cambio que documenta (mismo PR si es posible).

## Qué meter en cada report

- **Metadata**: fecha, rama, commits afectados, autor de la sesión.
- **TL;DR**: 5 líneas.
- **Contexto y alcance**: qué se auditó / refactorizó / arregló y por qué.
- **Diseño operacional**: si hubo agentes paralelos, gates de QA, decisiones de
  orquestación.
- **Permisos pre-aprobados**: qué autorizó el usuario para no tener que parar.
- **Por unidad de trabajo**: problema, decisión de diseño, archivos, commit,
  veredicto QA, riesgos residuales aceptados.
- **Acciones ejecutadas**: push, deploy, scripts corridos.
- **Pendientes**: lo que el usuario debe hacer manualmente.
- **Bugs colaterales**: encontrados pero fuera de alcance, para tickets futuros.
- **Smoke test**: cómo verificar que el cambio funciona en navegador.
- **Cómo retomar**: qué leer si una sesión futura tiene que continuar.

## Por qué esta carpeta existe

Las auditorías y refactors grandes pierden contexto rápidamente si solo viven
en la transcripción de Claude Code. Estos documentos son la memoria persistente
del proyecto: una sesión futura (mía o de otro agente) puede entrar fresco al
repo, leer el report relevante y reconstruir las decisiones de diseño sin
adivinar.
