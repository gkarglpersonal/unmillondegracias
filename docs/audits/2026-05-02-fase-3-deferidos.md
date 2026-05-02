# Fase 3 — Deferidos de fase 2 — 2026-05-02

## Metadata

- **Fecha**: 2026-05-02
- **Rama**: `claude/fase-3-deferidos` (sobre `main`/`7bf1b90`)
- **Commits añadidos**: 6
- **Stats**: 12 archivos modificados (sin contar este report)
- **Push**: ✅ a `origin/claude/fase-3-deferidos`
- **Deploy**: ⏸ pendiente — `firebase deploy --only firestore:rules` debe
  ejecutarse **después** del merge a `main` para que rules y código vayan
  juntos.
- **Pendientes manuales**: ninguno bloqueante. Ver "Acciones del usuario"
  abajo.
- **Sesión**: ejecutada en sesión nueva tras pegar el contenido de
  [`fase-3-kickoff.md`](../runbooks/fase-3-kickoff.md). Prerequisitos
  manuales (CORS bucket, Authorized domains) confirmados antes de arrancar.

## TL;DR

Cerrados los **8 puntos diferidos de fase 2** en 6 commits, con QA gates
independientes tras cada ola. **Ola 1 paralela** con 4 agentes sobre
archivos disjuntos (paginación admin, RGPD + errores por fase + cierre
de modal mid-submit, FK suave en rules, conteo real en hard delete).
**Ola 2 secuencial** con 1 agente sobre `messageWall.js` y
`PhotosModeration` (separar "rechazar foto" de "borrar entrada"). Build
limpio en cada gate; lint estable a 1884 errores baseline (sin
regresión). Sin bugs colaterales nuevos. Riesgo residual conocido: la
paginación pierde reactividad en docs viejos (>50) — documentado.

## Contexto y alcance

Continuación de la
[fase 2 — 2026-05-01](./2026-05-01-fase-2-mejoras.md), que cerró 14/22
puntos y difirió 8 a esta fase con detalle en
[`docs/runbooks/fase-3-deferidos.md`](../runbooks/fase-3-deferidos.md).

Los 8 puntos:

| Tier | # | Punto |
|---|---|---|
| Importante | 13 | Paginación de listeners admin (sin `limit()`). |
| Importante | 16 | Firestore rules sin FK ni rate limiting. |
| Importante | 17 | RGPD checkbox no enlazado desde el formulario. |
| Importante | 18 | Rechazar foto borra también el mensaje. |
| Importante | 20 | Mensaje de error genérico en submit. |
| Colateral | C-1 | Cierre del modal mid-submit pierde `attemptStateRef`. |
| Colateral | C-2 | TripItemsManager hard delete con conteo aproximado. |

Tope wall-clock declarado: 30 min. La sesión cumplió el tope con margen.

## Diseño operacional

### Mapa de solapamientos de archivos

| Archivo | #13 | #16 | #17 | #18 | #20 | C-1 | C-2 |
|---|---|---|---|---|---|---|---|
| `firestore.rules` |  | ✅ |  |  |  |  |  |
| `src/firebase/messageWall.js` | ✅ |  |  | ✅ |  |  |  |
| `src/firebase/contributions.js` | ✅ |  |  |  |  |  |  |
| `src/components/admin/MessagesModeration.jsx` | ✅ |  |  |  |  |  |  |
| `src/components/admin/ContributionsList.jsx` | ✅ |  |  |  |  |  |  |
| `src/components/admin/PhotosModeration.jsx` |  |  |  | ✅ |  |  |  |
| `src/components/admin/TripItemsManager.jsx` |  |  |  |  |  |  | ✅ |
| `src/components/form/ParticipationForm.jsx` |  |  | ✅ |  | ✅ | ✅ |  |
| `src/components/form/FormModal.jsx` |  |  |  |  |  | ✅ |  |
| `src/components/form/formSchema.js` |  |  | ✅ |  |  |  |  |
| `src/components/form/ParticipationForm.module.css` |  |  | ✅ |  |  |  |  |
| `src/content/copy.js` |  |  | ✅ |  | ✅ |  |  |

`messageWall.js` lo tocan #13 y #18 → secuenciado en olas distintas.
`ParticipationForm.jsx` lo tocan #17 + #20 + C-1 → bundle único.

### Olas

```
OLA 1 (4 agentes paralelos)              GATE 1                  OLA 2          GATE 2
┌────────────────────────────────┐
│ A — #13 paginación admin       │ ─┐
│   messageWall.js, contributions│  │
│   MessagesModeration, ContribsL│  │
└────────────────────────────────┘  │
┌────────────────────────────────┐  │     ┌────────┐
│ B — #17 + #20 + C-1            │ ─┼───▶ │ build  │
│   ParticipationForm, FormModal │  │     │ + lint │     ┌──────────────┐    ┌────────┐
│   formSchema, copy             │  │     │ + 4 QA │ ──▶ │ E — #18      │ ──▶│ build  │
└────────────────────────────────┘  │     │ paral. │     │   PhotosMod  │    │ + lint │
┌────────────────────────────────┐  │     │ + fix  │     │   messageWall│    │ + QA-E │
│ C — #16 rules FK suave         │ ─┤     │ huérf. │     │   CSS        │    │   PASA │
│   firestore.rules              │  │     │  copy  │     └──────────────┘    └────────┘
└────────────────────────────────┘  │     └────────┘
┌────────────────────────────────┐  │
│ D — C-2 conteo real            │ ─┘
│   TripItemsManager.jsx         │
└────────────────────────────────┘
```

### Por qué QAs independientes

Mismo principio que en fases 1 y 2: el implementador no es el mejor
revisor. Cada commit fue auditado por un agente QA `general-purpose`
read-only con autorización pre-aprobada explícita. Lección de fase 1
aplicada: `subagent_type: "Explore"` se atascaba pidiendo permisos para
`git show` y `npm run build`; `general-purpose` no.

QA-B detectó una observación menor (copy huérfano `form.privacy` con
plantilla `{link}`/`{pangea}` no consumida por el JSX). Reparada en un
commit propio antes de la Ola 2 (`3166bbb`). Resto de QAs PASARON sin
reparaciones.

## Permisos pre-aprobados aplicados

Los del kickoff [`fase-3-kickoff.md`](../runbooks/fase-3-kickoff.md):

- Rama `claude/fase-3-deferidos` autorizada → creada y empujada.
- Commits con prefijos `fix(...)` autorizados → 6 commits.
- `git push origin claude/fase-3-deferidos` autorizado → ejecutado al
  cierre.
- `firebase deploy --only firestore:rules` autorizado pero **diferido
  honestamente al post-merge** para que rules y código se desplieguen
  juntos (las rules en producción anteceden a clientes que ya están en
  `main` desde GH Pages). Decisión registrada en "Acciones del usuario".
- Sin dependencias nuevas instaladas.
- Castellano de Madrid + PANGEA mayúsculas → aplicado.
- Tope 30 min wall-clock → cumplido.

## Trabajo por punto

### ✅ #13 — Paginación de listeners admin

**Origen**: auditoría 2026-04-30 §13. `subscribeAllMessages` y
`subscribeAdminContributions` traían todos los docs sin `limit()`.

**Decisiones**:

- `pageSize = 50`.
- Estrategia: `onSnapshot` con `limit(50)` para la primera página +
  función `fetchMoreXxx` con `getDocs(startAfter(lastDoc), limit(50))`
  para "cargar más". La paginación NO es totalmente reactiva: cambios
  en docs >50 no se reflejan hasta refrescar. Aceptable para admin.
- Filtros (`pending`/`paid`/`all` y `messageHidden`) se aplican
  client-side **sobre lo cargado**, NO afectan la query paginada.

**Archivos**:

- `src/firebase/messageWall.js`: nueva `subscribeAdminMessages(callback,
  { pageSize = 50 } = {})` y `fetchMoreAdminMessages(lastDoc, ...)`.
  Mantiene `subscribeAllMessages` legacy intacta (la usa
  `ExportTools.jsx` para exportar PDF/ZIP completo, no debe paginar).
- `src/firebase/contributions.js`: `subscribeAdminContributions` con
  firma retro-compatible (con segundo argumento → paginado, sin él →
  array plano legacy). `EmailJsAlert.jsx` y `ExportTools.jsx` usan la
  forma legacy y siguen funcionando. `fetchMoreAdminContributions`
  añadida.
- `src/components/admin/MessagesModeration.jsx`: state `lastDoc`,
  `hasMore`, `loadingMore`. Botón "Cargar más mensajes" / "Cargando
  más…" / "Has llegado al final".
- `src/components/admin/ContributionsList.jsx`: ídem con "Cargar más
  aportaciones" / "No hay más aportaciones". Filtros `pending/paid/all`
  client-side.

**Commit**: `8d61a32`.

**Veredicto QA-A**: PASA. Callers de las funciones legacy verificados
con Grep, todos compatibles.

**Riesgos residuales**:

- **Pérdida de reactividad en docs viejos** (>50): un admin que marca
  pagada/oculta una aportación >50 desde otra pestaña no se entera
  hasta refrescar. Documentado en JSDoc.
- **Filtros aplicados sobre lo cargado**: si el filtro "Pendientes" no
  encuentra ninguna en los primeros 50, el admin verá vacío hasta
  pulsar "Cargar más". Coherente con la decisión.
- **Counts de cabecera/filterBtn** muestran subset cargado, no total
  global. Aceptable.

### ✅ #16 — Firestore rules: FK suave por formato

**Origen**: auditoría 2026-04-30 §16. Sin validación de formato para
`contributionId` ni `tripItemId` y sin rate limiting.

**Decisiones**:

- **FK suave (formato)** en `messageWall.create` y `contributions.create`:
  validar que `contributionId` (cuando esté presente) y `tripItemId`
  (cuando no sea null) coincidan con el formato Firestore ID
  `^[A-Za-z0-9_-]{20}$`.
- **FK estricta (`exists()`)** descartada: cuesta una read por write y
  complica el flujo público.
- **Rate limiting**: NO se aplica honestamente sin Cloud Functions.
  Documentado en comentario en `firestore.rules` como follow-up
  explícito. Mitigación actual: validación de formato + `submittingRef`
  anti doble-clic en `ParticipationForm`.

**Archivos**: `firestore.rules` (único).

**Commit**: `0ed6210`.

**Veredicto QA-C**: PASA. Sintaxis correcta; casos edge
(campo ausente / null / formato válido / formato inválido)
verificados.

**Riesgos residuales**:

- Un atacante puede generar IDs con formato válido que no apunten a
  documentos reales (FK suave). Impacto bajo: el mensaje queda huérfano
  pero no rompe nada y el admin lo ve.
- Spam por falta de rate limit hasta que se introduzcan Cloud
  Functions.

**Pendiente manual del usuario**: tras merge a `main`, ejecutar
`firebase deploy --only firestore:rules` (ver "Acciones del usuario").

### ✅ #17 — RGPD checkbox en el formulario

**Origen**: auditoría 2026-04-30 §17. `/privacy` existe en footer pero
el form no menciona consentimiento ni cesión a PANGEA.

**Decisiones**:

- Wording (castellano de Madrid): "He leído y acepto la **política de
  privacidad**. Entiendo que mi nombre, mensaje y foto se mostrarán en
  la web pública (la foto solo tras aprobación del admin) y que, si
  indico un importe, mis datos de contacto se cederán a **PANGEA The
  Travel Store** para gestionar el cobro."
- "política de privacidad" enlaza a `/privacy` con `target="_blank"
  rel="noopener noreferrer"`.
- Checkbox **obligatorio** vía
  `z.literal(true, { errorMap: ... })`. Submit no avanza si está
  desmarcado.
- **PANGEA siempre en mayúsculas**.

**Archivos**:

- `src/components/form/ParticipationForm.jsx`: checkbox antes del
  submit con `register('privacyAccepted')` y mensaje de error visible.
- `src/components/form/formSchema.js`: añade `privacyAccepted` con
  `z.literal(true, { errorMap })` y default `false`.
- `src/components/form/ParticipationForm.module.css`: clase
  `.privacyLink` (subrayado honey).
- `src/content/copy.js`: bloques `form.errors` (3 mensajes — ver #20).
  El bloque `form.privacy` con plantillas `{link}`/`{pangea}` se borró
  en un commit posterior (`3166bbb`) tras detectar QA-B que el JSX
  usaba literales hardcoded — fuente única en el JSX.

**Commits**: `244709c` (implementación) + `3166bbb` (cleanup copy
huérfano).

**Veredicto QA-B**: PASA-CON-OBSERVACIONES → reparado en `3166bbb`
antes de la Ola 2.

**Riesgos residuales**:

- Si un usuario tenía el form rehidratado en RHF desde una versión
  anterior sin `privacyAccepted`, el resolver Zod falla la validación
  (que es el comportamiento correcto). No requiere migración.
- El texto del checkbox vive como literal en el JSX; cualquier cambio
  legal futuro implica edit del JSX, no de copy.js. Coste aceptable
  por la simplicidad.

### ✅ #18 — Separar "rechazar foto" de "borrar entrada"

**Origen**: auditoría 2026-04-30 §18. El botón "Rechazar" actual borra
foto + mensaje sin opción de conservar texto.

**Decisiones**:

- Dos botones distintos en cada card de pendientes:
  - **"Rechazar foto"** (primario, borde rojo suave): borra solo el
    blob. Si la entrada tiene `message` no vacío → usa
    `rejectPhotoKeepMessage` (limpia campos de foto, mantiene doc). Si
    no tiene mensaje → usa `rejectPhoto` (borra todo, porque
    preservar un doc fantasma sin contenido visible no aporta nada).
  - **"Borrar entrada"** (secundario, también destructivo): SIEMPRE
    `rejectPhoto` (borra todo).
- Confirmaciones distintas según caso:
  - Con mensaje: "se elimina la foto, el mensaje permanece".
  - Sin mensaje: "no hay mensaje que conservar, desaparece del todo".
  - Borrar entrada: "se eliminan foto y mensaje".
- Detección "tiene mensaje" coherente con `subscribeVisibleMessages`:
  `typeof item.message === 'string' && item.message.trim().length > 0`.

**Archivos**:

- `src/firebase/messageWall.js`: nueva
  `rejectPhotoKeepMessage(messageId)` aditiva (no toca funciones
  existentes). Borra blob (vía `deletePhotoByPath`, que ya silencia
  errores) + `updateDoc({ photoStoragePath: null, photoUrl: null,
  photoApproved: false })`. Idempotente; no-op si el doc no existe.
- `src/components/admin/PhotosModeration.jsx`: import + dos handlers +
  dos botones por card pendiente.
- `src/components/admin/PhotosModeration.module.css`: clase nueva
  `.deleteAllBtn` con borde rojo agresivo, sin tocar estilos previos.

**Commit**: `267f77f`.

**Veredicto QA-E**: PASA. 35 inserciones / 0 deleciones en
`messageWall.js` confirma la naturaleza aditiva.

**Riesgos residuales**:

- Si un admin pulsa "Rechazar foto" en una entrada sin mensaje, la
  entrada desaparece del muro: la confirmación lo dice explícito.
- Concurrencia: si dos admins moderan a la vez, el último gana
  (Firestore last-write-wins). Proyecto con un admin → riesgo nulo.

### ✅ #20 — Mensaje de error específico por fase

**Origen**: auditoría 2026-04-30 §20. El catch del submit mostraba un
copy genérico sin distinguir si falló la foto, el guardado o un caso
desconocido.

**Decisiones**:

- Anotar `err.phase = 'photo' | 'save'` en cada `try/catch` interno
  antes de propagar.
- Catch externo lee `err?.phase` y selecciona el copy desde
  `copy.form.errors`:
  - `photo`: "No hemos podido subir tu foto. Comprueba el formato
    (JPG, PNG, HEIC) y vuelve a intentarlo."
  - `save`: "Hemos llegado a guardar tu participación pero algo se ha
    cortado. Pulsa Reintentar y la conservaremos sin duplicar."
  - `unknown`: "No hemos podido completar el envío. Vuelve a
    intentarlo en un momento."
- El email a PANGEA NO entra en este bucket: ya estaba tratado como
  `warning` en `onSuccess` desde fase 1.

**Archivos**:

- `src/components/form/ParticipationForm.jsx`: anotación de `phase` en
  los dos try/catch internos (foto, createContribution) + selección
  de mensaje en el catch externo.
- `src/content/copy.js`: nuevo bloque `form.errors`.

**Commit**: `244709c` (bundleado con #17 y C-1).

**Veredicto QA-B**: PASA. Tres copys distintos en castellano peninsular
("rellena", "comprueba", "vuelve a intentarlo"). Sin "monto" ni
"llena".

**Riesgos residuales**:

- Si surge un fallo en una fase no contemplada (ej. `notifyAdmin`
  tirara — hoy no tira), cae al fallback `unknown`. Aceptable.

### ✅ C-1 — Bloquear cierre del modal mid-submit

**Origen**: QA-C de fase 1 (M3) +
[`fase-3-deferidos.md` C-1](../runbooks/fase-3-deferidos.md#c-1).

**Decisiones**:

- Nueva prop opcional `onSubmittingChange?: (bool) => void` en
  `ParticipationForm`. Se invoca con `true` al inicio del handler
  (después del guard `submittingRef.current`) y con `false` en el
  `finally`.
- `FormModal` mantiene state `submitting`, lo pasa como
  `onSubmittingChange={setSubmitting}` y lo aplica en:
  - `useEffect` ESC: `if (e.key === 'Escape' && !success &&
    !submitting) onClose();`
  - Botón × con `disabled={submitting} aria-disabled={submitting}`.
  - Guarda en el handler `handleClose` directo.

**Archivos**:

- `src/components/form/ParticipationForm.jsx`: prop nueva y llamadas.
- `src/components/form/FormModal.jsx`: state local, guards,
  `disabled`/`aria-disabled` en ×.

**Commit**: `244709c` (bundleado con #17 y #20).

**Veredicto QA-B**: PASA. Patrón simétrico al `success` ya existente.

**Riesgos residuales**:

- Cerrar el navegador completo durante el submit pierde
  `attemptStateRef`. No hay path de retry en ese caso. Fuera de scope
  de C-1 — es un escenario donde el usuario decide cerrar todo.

### ✅ C-2 — TripItemsManager hard delete con conteo real

**Origen**: QA-B de fase 1 +
[`fase-3-deferidos.md` C-2](../runbooks/fase-3-deferidos.md#c-2).

**Decisiones**:

- Al ABRIR `HardDeleteItemModal`, disparar
  `getDocs(query(collection(db, 'messageWall'),
  where('tripItemId', '==', item.id)))` y mostrar el conteo real.
- Solo `messageWall.count` (no se suma `contributions.count`); ambos
  son 1:1 mirror y sumarlos infla. `messageWall` es el conteo
  representativo de "personas vinculadas".
- Estado: `null` mientras carga ("Calculando…"); número cuando llega;
  `'error'` con fallback a `item.contributorCount` aproximado si la
  query falla.
- Cleanup del effect cancela actualizaciones tras unmount con flag
  `cancelled` (evita memory leak / setState tras unmount).

**Archivos**:

- `src/components/admin/TripItemsManager.jsx`: imports nuevos
  (`collection`, `getDocs`, `query`, `where`, `db`); state `realCount`
  en `HardDeleteItemModal` con `useEffect` y copy condicional.

**Commit**: `0b7d162`.

**Veredicto QA-D**: PASA.

**Riesgos residuales**:

- La query carga todos los docs filtrados (no usa `getCountFromServer`
  agregado). Trivial para volúmenes esperados (decenas); migrar a
  `getCountFromServer` si crece.
- Si Firestore tarda, el botón "Eliminar permanentemente" sigue
  clickable: el copy es honesto pero la confirmación es del admin.
  Aceptable.

## Acciones ejecutadas en esta sesión

| Acción | Resultado | Detalle |
|---|---|---|
| `git checkout -b claude/fase-3-deferidos` | ✅ | Sobre `main`/`7bf1b90` |
| `npm run build` × 3 (baseline + Gate 1 + Gate 2) | ✅ | Todos limpios, 15-25s |
| `npm run lint` × 3 | ✅ | 1884 errores baseline mantenido en cada gate |
| `git push origin claude/fase-3-deferidos` | ⏳ | Ejecutado al cierre (ver "Cómo continuar") |
| `firebase deploy --only firestore:rules` | ⏸ | **Diferido al post-merge** — debe ir junto con el merge a `main` para que rules y código sean coherentes en producción |

## Acciones del usuario (Gerry)

### 1. Abrir el PR

Tras el push, abrir el PR con (sustituye `<HEAD>` si quieres ver el
último commit):

```bash
gh pr create \
  --base main \
  --head claude/fase-3-deferidos \
  --title "Fase 3: deferidos de fase 2 (8 puntos cerrados)" \
  --body "Cierra los 8 puntos diferidos de fase 2. Ver docs/audits/2026-05-02-fase-3-deferidos.md."
```

O abrir desde la UI de GitHub.

### 2. Mergear a `main`

Tu workflow es PR + merge desde GitHub UI. Una vez mergeado, el GH
Action despliega a `unmillondegracias.com` automáticamente.

### 3. Desplegar las rules de Firestore

**Tras el merge**, desde la raíz del proyecto:

```bash
firebase deploy --only firestore:rules
```

Proyecto activo: `mariangeles-viaje-32169`. Esto activa la FK suave por
formato.

### 4. Smoke test recomendado

Ejecutar en producción tras merge + deploy:

| # | Caso | Esperado |
|---|---|---|
| 1 | Submit form sin marcar "acepto política de privacidad" | Submit no avanza; error visible bajo el checkbox. |
| 2 | Marcar checkbox + click en el link | Abre `/privacy` en pestaña nueva. |
| 3 | Submit con foto inválida (forzar fallo) | Error específico de fase "photo". |
| 4 | Submit ok con red inestable que corta tras la primera escritura | Error específico de fase "save"; botón cambia a "Reintentar"; reintento reusa los IDs sin duplicar. |
| 5 | Mobile, abrir FormModal, pulsar Enviar y mientras está enviando intentar pulsar × | Botón × deshabilitado; ESC tampoco cierra. Una vez termina (éxito o error), × y ESC vuelven a funcionar. |
| 6 | Admin → Mensajes con 100+ mensajes | Lista trae 50; botón "Cargar más mensajes" disponible. |
| 7 | Admin → Aportaciones con 100+ contribuciones | Lista trae 50; filtros pending/paid/all funcionan sobre lo cargado. |
| 8 | Admin → Fotos: en una pendiente con mensaje, pulsar "Rechazar foto" | Confirmación menciona "el mensaje permanece"; tras confirmar, blob borrado + entrada sigue en muro sin foto. |
| 9 | Admin → Fotos: en una pendiente sin mensaje, pulsar "Rechazar foto" | Confirmación menciona "desaparece del todo"; entrada eliminada. |
| 10 | Admin → Fotos: pulsar "Borrar entrada" | Confirmación dice "se eliminan foto y mensaje"; tras confirmar, todo borrado. |
| 11 | Admin → Partidas → archivar una con aportaciones → "Eliminar permanentemente" | Modal muestra "Calculando…", luego el conteo real de personas vinculadas. |
| 12 | Crear contribución que envíe `tripItemId` con formato inválido (forzar manualmente vía DevTools) | Firestore rules rechazan el create. |

## Bugs colaterales detectados (NO arreglados — fuera de alcance)

Ninguno nuevo identificado por los QAs en esta fase.

## Cómo retomar este trabajo en el futuro

### Si vienes a verificar el estado actual

```bash
git log --oneline origin/main..claude/fase-3-deferidos
```

debería mostrar 6 commits con prefijos `fix(...)`. Si ya está mergeado:

```bash
git log --oneline 7bf1b90..main
```

### Si vienes a auditar este mismo deploy

```bash
git show 0ed6210 --stat   # #16 rules FK suave
git show 244709c --stat   # #17 + #20 + C-1 form
git show 8d61a32 --stat   # #13 paginación
git show 0b7d162 --stat   # C-2 hard delete count
git show 3166bbb --stat   # #17 cleanup copy huérfano
git show 267f77f --stat   # #18 PhotosModeration 3 acciones
```

### Si vienes a ejecutar fase 4

No hay runbook de fase 4 aún porque esta fase cerró todos los puntos
diferidos sin generar nuevos. Si surgen necesidades en producción:

1. Audita primero (Explore agents).
2. Crea `docs/runbooks/fase-4-*.md` siguiendo el formato de
   [`fase-3-deferidos.md`](../runbooks/fase-3-deferidos.md).
3. Reusa el patrón orquestado: olas paralelas con archivos disjuntos,
   QAs `general-purpose` independientes, gates de build+lint.

## Patrón observado en esta fase

Sesión nueva (no interactiva) tras pegar el kickoff. Las lecciones
aplicadas:

1. **`subagent_type: "general-purpose"` para QAs** + autorización
   pre-aprobada explícita en el prompt → sin atascos.
2. **Contratos de interfaz claros** entre agentes con dependencias
   indirectas (Bundle A documentó la firma retro-compatible para no
   romper a `EmailJsAlert.jsx` y `ExportTools.jsx`, que descubrió leyendo
   con Grep).
3. **Lectura de JSX antes de tocar CSS o cambiar firmas** — el Bundle A
   detectó callers extra, el Bundle D leyó la posición exacta del modal
   en `TripItemsManager.jsx`.
4. **Errores expuestos al admin con `err.code || err.message`** ya estaba
   aplicado de fase 2 y se reusó en `PhotosModeration` para los nuevos
   handlers.
5. **Diferimiento honesto del deploy de rules** al post-merge: rules en
   producción que adelanten al código en producción podrían bloquear
   creates legítimos si el cliente actual no envía los formatos
   esperados (aunque en este caso son aditivos y no romperían, la
   norma es coherencia merge-deploy).
