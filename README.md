# unmillondegracias.com

Regalo de jubilación colectivo para MªÁngeles, profesora del Colegio Everest
de Monteclaro (Madrid). Dominio: [unmillondegracias.com](https://unmillondegracias.com).

> Es una **sorpresa**. La web tiene `noindex` para evitar Google. No compartir
> en canales públicos hasta que sea el momento.

Documentación técnica completa en [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## Setup local

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar plantilla de variables
cp .env.example .env.local
# Rellenar:
#  - VITE_FIREBASE_*  (Firebase Console → Project Settings → Your apps)
#  - VITE_EMAILJS_*   (https://www.emailjs.com)

# 3. Arrancar dev server
npm run dev
```

Abre <http://localhost:5173>. Admin en <http://localhost:5173/admin>.

## Sembrar Firestore (primera vez)

```bash
# Descargar service account JSON desde Firebase Console
#   → Project Settings → Service accounts → Generate new private key
# Guardarlo como `service-account.json` en la raíz (gitignored).

npm run seed
```

Esto crea las 25 partidas placeholder y `config/general` con
`totalTripCost = 15000 €`.

## Crear el usuario admin

En Firebase Console → **Authentication** → habilitar Email/Password →
añadir manualmente el correo de Gerry con contraseña fuerte.

No hay registro público. Ese único usuario es el admin.

## Deploy

GitHub Actions (`.github/workflows/deploy.yml`) hace build + deploy a GitHub
Pages en cada push a `main`.

**Secrets requeridos** en el repo (Settings → Secrets and variables → Actions):

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_EMAILJS_PUBLIC_KEY
VITE_EMAILJS_SERVICE_ID
VITE_EMAILJS_TEMPLATE_PANGEA
VITE_EMAILJS_TEMPLATE_ADMIN
```

DNS (Namecheap): apuntar `unmillondegracias.com` y `www` a GitHub Pages
(`185.199.108.153`, `.109`, `.110`, `.111`).

## Estructura

```
src/
  pages/          páginas (Home, Admin, AdminLogin)
  components/
    layout/       layout, sidebar, floating CTA
    hero/         hero + contadores
    history/      línea de tiempo
    trip/         intro y transición
    thermometers/ termómetros por partida
    messages/     muro
    gallery/      galería
    form/         formulario (modal + sidebar)
    admin/        panel admin
  firebase/       config + módulos por colección
  hooks/          listeners reactivos
  utils/          formato fechas/moneda, compresión, exports
  styles/         tokens + globals + animations
  content/        copy + seed de partidas
scripts/
  seed.js         seed Firestore con firebase-admin
```

## Lanes de desarrollo

Ver [`ARCHITECTURE.md` §7](./ARCHITECTURE.md#7-swim-lanes-para-desarrollo-paralelo).

- **Lane A** ✅ cimientos (este commit).
- Lanes B/C/D/E pueden ir en paralelo.
- Lane F es pulido + QA + deploy final.
