# unmillondegracias.com — Tarjeta de referencia rápida

*Para consulta rápida al inicio de cualquier conversación*

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

## Estado al 2 mayo 2026

✅ Página en producción con contenido real  
✅ Formulario funcional (emails a Gerry y PANGEA, form sidebar se limpia tras enviar)  
✅ Admin funcional (mensajes, fotos, aportaciones, partidas, exportar)  
✅ CORS configurado · Authorized domains configurado  
✅ **Fase 1, 2 y 3 completadas** (auditoría + 28/30 puntos cerrados, cero diferidos a Fase 4)  
✅ Correcciones post-Fase 3 aplicadas y desplegadas (smoke test del 2 mayo): borrar aportación conserva mensaje y foto, aviso en rojo al eliminar sección con aportaciones, fix `No document to update`  
✅ RGPD checkbox · errores específicos · paginación admin · 2 acciones de moderación de fotos · FK suave en rules  
🚀 **Lanzamiento: lunes 5 mayo 2026 — sin puntos técnicos pendientes bloqueantes**

## Riesgos residuales conocidos (no bloquean)

- Paginación admin no es totalmente reactiva en docs >50 (refrescar para ver cambios en docs viejos)
- FK suave en rules acepta IDs con formato válido sin doc real (impacto bajo)
- Sin rate limiting honesto en rules (requiere Cloud Functions; mitigado por anti doble-clic + RGPD)

## Si algo falla — checklist rápido

**Aprobar fotos falla:** CORS del bucket. Aplicar `gsutil cors set cors.json gs://...`  
**Login admin falla:** Verificar Authorized domains en Firebase Auth  
**Deploy no llega a producción:** Usar deploy manual, no GitHub Actions  
**Contadores descuadrados:** Las transacciones son atómicas dentro de Firestore; Storage es compensatorio  
**Email no llega:** Verificar cuota EmailJS (200/mes en plan free); comprobar templates en EmailJS dashboard
