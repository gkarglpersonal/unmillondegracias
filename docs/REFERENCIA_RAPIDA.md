# unmillondegracias.com — Tarjeta de referencia rápida

*Para consulta rápida al inicio de cualquier conversación · actualizado 6 mayo 2026 (post-lanzamiento · PR 1 admin desplegado y verificado en producción)*

---

## El proyecto en una línea

Página web de crowdfunding estilo lista de bodas para regalar un viaje a Argentina a Mariángeles, profesora de infantil del Colegio Everest (Madrid), en su jubilación tras 40+ años.

## URLs y accesos

| Recurso | Valor |
|---|---|
| Página pública | https://unmillondegracias.com |
| Panel admin | https://unmillondegracias.com/admin |
| Repo GitHub | github.com/gkarglpersonal/unmillondegracias |
| Firebase proyecto | mariangeles-viaje-32169 |
| Firebase console | console.firebase.google.com |
| Google Cloud (CORS) | console.cloud.google.com/?project=mariangeles-viaje-32169 |
| EmailJS service | service_gr3xvsg |
| EmailJS templates | template_pangea / template_admin |

## Contactos del proyecto

| Quién | Qué | Cómo |
|---|---|---|
| Gerry (admin) | Organizador | gerardo.kargl@gmail.com / gkargl@outlook.com |
| Irene Banchero | PANGEA pagos | irene.banchero@pangea.es / 910837976 |
| María Ulloa | Colegas del cole | Via Colegio Everest |
| Carla | Alumni exalumnos | Via red de Alumni |

## Stack en 30 segundos

React 18 + Vite + CSS Modules → GitHub Pages  
Firebase Firestore (datos) + Storage (fotos) + Auth (admin)  
EmailJS (emails) + GoDaddy (dominio)  
Sin TypeScript. Sin Tailwind. Sin pagos en la web.

## Comandos más usados

```bash
# Deploy manual (GitHub Actions no es fiable)
npm run build && npx gh-pages -d dist && git push

# Forzar redeploy sin cambios
git commit --allow-empty -m "Trigger redeploy" && git push

# Deploy de reglas Firebase
firebase deploy --only firestore:rules,storage

# Aplicar CORS (si se resetea el bucket)
gsutil cors set cors.json gs://mariangeles-viaje-32169.firebasestorage.app
```

## Reglas inamovibles

- JS no TS · CSS Modules no Tailwind · react-hook-form + zod
- **PANGEA en mayúsculas siempre**
- Castellano de Madrid: importe, rellena, ha dado (no monto/llena/dio)
- Un commit por fix, prefijo claro: `fix(N):` / `docs(audits):`
- Rama → PR GitHub → merge UI → GH Action despliega

## Estado al 6 mayo 2026

✅ Página en producción con contenido real  
✅ Formulario funcional (emails a Gerry y PANGEA, form sidebar se limpia tras enviar)  
✅ Admin funcional (mensajes, fotos, aportaciones, partidas, exportar)  
✅ CORS configurado · Authorized domains configurado  
✅ **Fase 1, 2, 3 completadas + auditoría pre-lanzamiento aplicada** (8 hallazgos cerrados: C1, C2, C3, I2, I4, I6, I7, I12)  
✅ Plan EmailJS subido a 2.000 emails/mes · 3 reintentos con backoff · `pangea_status` en correo al admin si fallan  
✅ Rules de `contributions` validan `message.size() <= 2000` · ErrorBoundary global con fallback en castellano  
✅ Hooks de Firestore sin timeout 2s (estado vacío engañoso en redes lentas eliminado) · `error` expuesto para feedback futuro  
✅ Touch targets ≥44 px en CTA Regalar y closeBtn · `submittingRef` síncrono en ManualContributionForm · `overflow-wrap` en mensajes  
✅ **Fix urgente bug regex tripItemId** (Fase 3 dejó `{20}` que rechazaba IDs deterministas `tripItem-01..29`) — relajado a `{6,64}` (commit `7f27511`)  
✅ **Fix urgente confirmación de escritura** (`setDoc` de Firestore resuelve contra cache local; sin `waitForPendingWrites` la UI podía decir "guardado" cuando el dato nunca llegó al servidor) — timeout 15 s + copy honesto (commit `4fb74bc`)  
✅ **Primera participación real confirmada en Firestore + admin** tras los dos fixes urgentes (smoke test E2E completo)  
✅ **Subida manual de fotos desde admin** (pestaña "Subir foto") con `excludeFromFeed: true` para no notificar al feed del hero — commit `2ba44e6`  
🎉 **Lanzamiento ejecutado el lunes 5 mayo 2026** — campaña activa, contribuciones reales en producción.  
✅ **PR 1 admin mergeado y desplegado (6 mayo 2026, merge commit `da54859`)**: 3 tarjetas en tiempo real (Total recaudado · Asignado a partidas · Sin asignar) sobre `contributions` pagadas, montadas en la cabecera del panel admin entre header y tabs. Reusa `subscribeAdminContributions(callback)` legacy (sin listener nuevo). Indicador "Importe privado" como pill visible bajo el importe en `ContributionsList` (sustituye al icono Lock con tooltip). PR de solo lectura — sin tocar `firestore.rules` ni el flujo público. Verificado en producción.

## Riesgos residuales conocidos (no bloquean)

- Paginación admin no es totalmente reactiva en docs >50 (refrescar para ver cambios en docs viejos)
- FK suave en rules acepta IDs con formato válido sin doc real (impacto bajo)
- Sin rate limiting honesto en rules (requiere Cloud Functions; mitigado por anti doble-clic + RGPD)
- Fallo transitorio puntual de EmailJS: contribución guardada, `notifyAdmin` recibe `pangea_status: 'failed'`; admin atiende manualmente

## Diferidos a post-lanzamiento (no urgente)

I1 (seed.js no preserva contadores), I5 (admin row2 sin media query), I8 (HeroSection 320 px en landscape), I9 (z-index hardcoded), I10 (errores sin handler en setMessageHidden), I11 (paginación admin), M1–M10 (pulido y tech debt menor). Detalle en HISTORIAL_TECNICO.md.

## Si algo falla — checklist rápido

**Aprobar fotos falla:** CORS del bucket. Aplicar `gsutil cors set cors.json gs://...`  
**Login admin falla:** Verificar Authorized domains en Firebase Auth  
**Deploy no llega a producción:** Usar deploy manual, no GitHub Actions  
**Contadores descuadrados:** Las transacciones son atómicas dentro de Firestore; Storage es compensatorio  
**Email no llega a PANGEA:** El cliente reintenta 3 veces con backoff. Si todos fallan, el correo a Gerry incluye `pangea_status: 'failed'` para atender manualmente. Comprobar plan EmailJS (2.000/mes) y templates  
**Pantalla blanca al cargar:** Error en render — el ErrorBoundary muestra fallback "Algo ha fallado" con botón Recargar. Causa real en consola (`ErrorBoundary capturó:`)  
**Termómetros vacíos en mobile:** Ya no debería pasar (timeout 2 s eliminado). Si pasa: red genuinamente caída, `error` del hook lo confirma; en el futuro un consumer puede mostrar "Conexión perdida"  
**Formulario rechaza con `errors.save` o `errors.serverTimeout`:** Si dice "no hemos podido guardar", inspeccionar `firestore.rules` — el regex de `tripItemId` debe permitir tanto IDs deterministas (`tripItem-XX`, 11 chars) como auto-IDs de Firestore (20 chars). Si dice "no hemos podido confirmar que tu participación llegara al servidor", el cliente está offline o muy lento; comprobar la conexión y reintentar (los IDs se conservan, no se duplica)  
**Tras `firebase deploy --only firestore:rules` algo deja de funcionar:** Smoke test E2E manual obligatorio antes de declarar deploy verde — crear al menos una contribución que cubra todas las ramas (`tripItemId: null` y `tripItemId: 'tripItem-XX'`, mensaje vacío y con texto). Las pruebas de admin no detectan bugs de validación del formulario público porque `createManualContribution` es una transacción distinta  
**Aparece spam o entradas no deseadas en el feed del hero:** Si las subiste desde el formulario público, hay que borrarlas de `messageWall` (y la `contributions` asociada por `publicMessageId`) — un script `firebase-admin` puntual con dry-run primero. Si en su lugar quieres subir fotos en nombre de alguien sin spammear el feed, usa la pestaña **"Subir foto"** del admin: marca `excludeFromFeed: true` automáticamente y sigue el flujo de aprobación normal en "Fotos". La galería sí muestra esas fotos al aprobarlas; el feed del hero no
