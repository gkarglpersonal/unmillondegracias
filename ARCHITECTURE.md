# ARCHITECTURE.md — unmillondegracias.com

Documento de arquitectura técnica para el regalo de jubilación de MªÁngeles.
Basado en el brief de abril 2026. Este documento es la fuente de verdad técnica
hasta que se apruebe e iniciemos el código.

---

## 1. Stack técnico (decisiones)

| Capa | Elección | Justificación |
|---|---|---|
| Framework | **Vite + React 18** | El brief permite vanilla o React. Con datos en tiempo real (contadores, termómetros, feed), múltiples vistas (público + /admin) y formularios complejos, React reduce drásticamente la complejidad. Vite genera estático puro, ideal para GitHub Pages. |
| Lenguaje | **JavaScript (JSX)**, no TypeScript | Proyecto de 1 año, un solo desarrollador, sin equipo que mantenga tipos. JSDoc puntual donde aporte. |
| Routing | **React Router v6** | Solo dos rutas: `/` y `/admin`. |
| Estilos | **CSS variables + CSS Modules** | Tokens de diseño en `:root`, scoping por componente vía CSS Modules. Sin Tailwind (curva de aprendizaje innecesaria) ni styled-components (overhead). |
| Formularios | **react-hook-form + zod** | Validación declarativa, tipado de errores, mínimo re-render. |
| Estado global | **React Context + Firestore listeners** | No hace falta Redux/Zustand. Firestore `onSnapshot` ya es estado reactivo. |
| Backend / BD | **Firebase Firestore** (proyecto `mariangeles-viaje`) | Ya creado por Gerry. |
| Almacenamiento de fotos | **Firebase Storage** | Misma cuenta. |
| Autenticación | **Firebase Auth (Email+Password)** | Un solo usuario admin: Gerry. |
| Email transaccional | **EmailJS (cliente)** | Confirmado. Plan free (200 emails/mes). Ver §6. |
| Hosting | **GitHub Pages** + dominio custom (CNAME `unmillondegracias.com`) | Gratis, dominio ya comprado en Namecheap. |
| Deploy | **GitHub Actions** (push a `main` → build Vite → publish a `gh-pages`) | Automatizado. |
| Export PDF | **pdf-lib** (cliente) | Genera PDF maquetado en el navegador. |
| Export ZIP | **JSZip** (cliente) | Empaqueta fotos descargadas desde Storage. |
| Imagen masonry | **react-masonry-css** | Ligero, sin dependencias pesadas. |
| Optimización imagen | **browser-image-compression** | Resize/compress antes de subir a Storage (<2 MB, máx 2400 px). |
| Robots / SEO | `<meta name="robots" content="noindex">` + sin sitemap | Es una sorpresa: no debe aparecer en Google. |

---

## 2. Estructura de carpetas

```
unmillondegracias.com/
├── ARCHITECTURE.md
├── README.md
├── package.json
├── vite.config.js
├── index.html
├── .env.local                # claves Firebase + EmailJS (gitignored)
├── .env.example
├── firebase.json             # config storage + firestore rules
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── public/
│   ├── CNAME                 # contenido: unmillondegracias.com
│   └── placeholders/         # imágenes placeholder hasta tener fotos reales
├── .github/
│   └── workflows/
│       └── deploy.yml        # GH Actions: build + deploy a gh-pages
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── routes.jsx
    │
    ├── pages/
    │   ├── Home.jsx
    │   ├── Admin.jsx
    │   └── AdminLogin.jsx
    │
    ├── components/
    │   ├── layout/
    │   │   ├── Layout.jsx
    │   │   ├── StickySidebar.jsx        # form en desktop
    │   │   └── FloatingCTA.jsx          # botón en mobile
    │   ├── hero/
    │   │   ├── HeroSection.jsx
    │   │   ├── ContributorCounter.jsx   # "67 personas..."
    │   │   └── RecentContributionsFeed.jsx
    │   ├── history/
    │   │   ├── HistorySection.jsx
    │   │   └── TimelineItem.jsx
    │   ├── trip/
    │   │   ├── TripIntro.jsx
    │   │   └── TripTransition.jsx       # "Ahora es su turno..."
    │   ├── thermometers/
    │   │   ├── ThermometersGrid.jsx
    │   │   ├── TripItemCard.jsx
    │   │   └── ThermometerBar.jsx
    │   ├── messages/
    │   │   ├── MessagesWall.jsx
    │   │   └── MessageCard.jsx
    │   ├── gallery/
    │   │   ├── PhotoGallery.jsx
    │   │   └── PhotoLightbox.jsx
    │   ├── form/
    │   │   ├── ParticipationForm.jsx
    │   │   ├── FormModal.jsx            # mobile
    │   │   ├── TripItemPicker.jsx       # dropdown desktop / tags mobile
    │   │   ├── PhotoUploader.jsx
    │   │   └── SuccessOverlay.jsx
    │   └── admin/
    │       ├── AdminLayout.jsx
    │       ├── ContributionsList.jsx
    │       ├── ContributionRow.jsx      # con botón "Marcar pagado"
    │       ├── MessagesModeration.jsx
    │       ├── PhotosModeration.jsx
    │       ├── TripItemsManager.jsx
    │       └── ExportTools.jsx
    │
    ├── firebase/
    │   ├── config.js                    # initializeApp + exports
    │   ├── auth.js                      # signIn / signOut / onAuth
    │   ├── contributions.js             # CRUD contribuciones
    │   ├── messageWall.js               # CRUD muro público
    │   ├── tripItems.js                 # CRUD partidas
    │   ├── storage.js                   # upload de fotos
    │   └── email.js                     # disparo EmailJS
    │
    ├── hooks/
    │   ├── useAuth.js
    │   ├── useTripItems.js              # listener tiempo real
    │   ├── useMessageWall.js
    │   ├── useContributorCount.js
    │   ├── useRecentContributions.js
    │   └── useAdminContributions.js
    │
    ├── utils/
    │   ├── formatDate.js                # "hace 2 horas" en es
    │   ├── formatCurrency.js
    │   ├── compressImage.js
    │   ├── exportPdf.js                 # mensajes → PDF
    │   └── exportZip.js                 # fotos → ZIP
    │
    ├── styles/
    │   ├── tokens.css                   # variables: colores, type, spacing
    │   ├── reset.css
    │   ├── globals.css
    │   └── animations.css
    │
    └── content/
        ├── copy.js                      # textos placeholder en español
        └── seedTripItems.js             # 20-25 partidas placeholder
```

---

## 3. Modelo de datos en Firestore

**Decisión clave:** dividimos en colecciones públicas vs privadas porque Firestore
no permite filtrar campos por reglas de seguridad. El email y el monto exacto
son privados (solo admin). Nombre, mensaje y foto son públicos.

### Colección `contributions/` (privada, admin-only read)

Toda la información completa de cada participación.

```
contributions/{contributionId}
  name: string                      # obligatorio
  email: string                     # obligatorio, privado
  message: string | null
  photoStoragePath: string | null   # ruta en Storage, no URL pública
  tripItemId: string | null         # null = "sin preferencia / fondo general"
  amount: number | null             # null si no contribuye económicamente
  paymentStatus: 'pending' | 'paid' | 'cancelled'
  publicMessageId: string           # FK a messageWall/{id}
  createdAt: timestamp
  paidAt: timestamp | null
  adminNotes: string                # uso interno
```

**Reglas:**
- `create`: cualquiera puede crear si los campos obligatorios pasan validación.
- `read`, `update`, `delete`: solo admin autenticado.

### Colección `messageWall/` (pública)

Mirror público de cada participación. Se crea junto con `contributions/{id}`.

```
messageWall/{publicMessageId}
  contributionId: string                   # FK a contributions/{id}
  name: string                             # nombre visible
  message: string | null
  photoUrl: string | null                  # URL pública (solo si aprobada)
  photoStoragePath: string | null          # path interno (para borrar)
  tripItemId: string | null
  photoApproved: boolean                   # default false
  messageHidden: boolean                   # admin puede ocultar mensaje
  paid: boolean                            # mirror de paymentStatus === 'paid'
  createdAt: timestamp
```

**Reglas:**
- `create`: cualquiera, con shape validado.
- `read`: cualquiera.
- `update`, `delete`: solo admin.

**Por qué duplicar:** la página pública nunca lee `contributions/`, así emails
y montos quedan inaccesibles desde cliente sin admin auth.

### Colección `tripItems/` (pública)

Las 20-25 partidas del viaje.

```
tripItems/{tripItemId}
  name: string                             # "Cena bajo las estrellas en Mendoza"
  description: string                      # texto emotivo breve
  targetAmount: number                     # importe objetivo en EUR
  raisedAmount: number                     # incrementado al marcar pagado
  contributorCount: number                 # nº de pagados a esta partida
  order: number                            # orden de visualización
  active: boolean                          # admin puede ocultar sin borrar
```

**Reglas:**
- `read`: cualquiera.
- `create`, `update`, `delete`: solo admin.

### Documento `config/general` (público)

Configuración global editable.

```
config/general
  totalTripCost: number                    # placeholder inicial: 15000 (EUR), ajustable desde admin
  totalRaised: number                      # suma incremental
  totalContributors: number                # incremental al pagar
  heroTitle: string                        # editable desde admin (futuro)
  heroSubtitle: string
```

**Reglas:**
- `read`: cualquiera.
- `update`: solo admin.

### Storage

```
photos/
  {contributionId}-{uuid}.{ext}            # subido al crear contribución
```

**Reglas:**
- `create`: cualquiera, máx 5 MB, content-type `image/*`.
- `read`: cualquiera (URLs públicas).
- `delete`: solo admin.

---

## 4. Mapa de componentes (público)

```
App
└─ Layout
   ├─ <main>  (scroll único)
   │  ├─ HeroSection
   │  │  ├─ ContributorCounter         ← config/general.totalContributors
   │  │  └─ CTA "Participar"
   │  ├─ RecentContributionsFeed       ← messageWall (orderBy createdAt desc, limit 5)
   │  ├─ HistorySection
   │  │  └─ TimelineItem × N
   │  ├─ TripIntro + TripTransition
   │  ├─ ThermometersGrid              ← tripItems
   │  │  └─ TripItemCard × N
   │  │     ├─ ThermometerBar
   │  │     └─ contributors list       ← messageWall.where(tripItemId)
   │  ├─ MessagesWall                  ← messageWall.where(messageHidden==false, message!=null)
   │  └─ PhotoGallery                  ← messageWall.where(photoApproved==true)
   │
   ├─ StickySidebar  (desktop, lg+)
   │  └─ ParticipationForm (inline)
   │
   └─ FloatingCTA  (mobile, <lg)
      └─ FormModal
         └─ ParticipationForm
            └─ SuccessOverlay
```

## 5. Mapa de componentes (admin)

```
AdminLogin   /admin
  └─ Firebase Auth signIn

AdminLayout  (autenticado)
  ├─ Tab "Aportaciones"     → ContributionsList
  │   └─ ContributionRow × N (acciones: marcar pagado, editar, borrar)
  ├─ Tab "Mensajes"         → MessagesModeration (eliminar/ocultar)
  ├─ Tab "Fotos"            → PhotosModeration (aprobar/rechazar)
  ├─ Tab "Partidas"         → TripItemsManager (CRUD)
  ├─ Tab "Aportaciones manuales" → form simple para añadir manuales
  └─ Tab "Exportar"         → ExportTools (PDF mensajes, ZIP fotos)
```

---

## 6. Flujo de emails

**Lógica condicional clave:** el monto es opcional. Solo se notifica a PANGEA si
el participante indicó un monto. Si solo deja mensaje y/o foto, únicamente se
notifica a Gerry.

```
┌──────────────────┐
│  Usuario rellena │
│    formulario    │
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│ 1. Cliente comprime + sube foto a Storage       │
│ 2. Cliente crea doc en contributions/           │
│ 3. Cliente crea doc en messageWall/             │
│ 4. Cliente dispara EmailJS:                     │
│                                                 │
│    Si amount > 0:                               │
│    a) → laura.estaun@pangea.es                  │
│       (datos para gestionar cobro)              │
│       CC: gkargl@outlook.com                    │
│    b) → gkargl@outlook.com                      │
│       (notificación admin con link a /admin)    │
│                                                 │
│    Si amount es null/0 (solo mensaje y/o foto): │
│    b) → gkargl@outlook.com                      │
│       (notificación admin: mensaje/foto nuevo)  │
│                                                 │
│ 5. Cliente muestra SuccessOverlay               │
└─────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ PANGEA contacta al participante,        │
│ envía link de pago directo              │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ PANGEA notifica a Gerry: pago realizado │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Gerry entra a /admin                    │
│ Marca contribución como "pagada":       │
│  - contributions.paymentStatus = paid   │
│  - messageWall.paid = true              │
│  - tripItems.raisedAmount += amount     │
│  - tripItems.contributorCount += 1      │
│  - config.totalRaised += amount         │
│  - config.totalContributors += 1        │
│ (todo en una transacción Firestore)     │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Termómetro y contador se actualizan en  │
│ tiempo real para todos los visitantes   │
│ vía onSnapshot                          │
└─────────────────────────────────────────┘
```

**EmailJS confirmado (plan free, 200 emails/mes).** Se necesitarán 2 templates:
- `template_pangea`: a PANGEA The Travel Store, CC Gerry, con datos de cobro.
- `template_admin`: a Gerry, con tipo de submission (contribución / mensaje / foto) y link a `/admin`.

---

## 7. Swim lanes para desarrollo paralelo

Cada lane es ejecutable de forma independiente por un agente o sesión separada
una vez que **Lane A** está terminado. Lanes B/C/D/E pueden ir en paralelo.

### Lane A — Cimientos (bloqueante, secuencial)
**Output:** repo arrancable con Firebase conectado y tokens de diseño.
1. `npm create vite` con plantilla React-JS.
2. Instalar deps: `firebase`, `react-router-dom`, `react-hook-form`, `zod`,
   `@emailjs/browser`, `pdf-lib`, `jszip`, `browser-image-compression`,
   `react-masonry-css`.
3. `src/firebase/config.js` con `initializeApp`.
4. `firestore.rules` y `storage.rules` deployables.
5. `src/styles/tokens.css` con la paleta del brief (eucalipto/oliva, dorado/honey,
   beige cálido, off-white cálido, charcoal cálido) + tipografía (sugerencia:
   *Fraunces* o *Playfair Display* para titulares, *Inter* para texto).
6. `Layout` con grid responsivo y rutas básicas.
7. GitHub Action de deploy.
8. Seed inicial de Firestore (script Node con `firebase-admin`).

### Lane B — Página pública narrativa
**Output:** Hero + Historia + Trip + Transición renderizadas con placeholders.
- HeroSection con ContributorCounter (lee `config/general`).
- RecentContributionsFeed (lee `messageWall`).
- HistorySection con TimelineItem (3 épocas, fotos placeholder).
- TripIntro y TripTransition (textos placeholder en `content/copy.js`).
- Diseño tipográfico y espaciado al estilo Apple/Microsoft.

### Lane C — Formulario y submission flow
**Output:** alguien puede enviar una contribución end-to-end.
- ParticipationForm (validación, react-hook-form + zod).
- TripItemPicker (dropdown desktop / tags mobile).
- PhotoUploader con compresión cliente.
- StickySidebar (desktop) y FloatingCTA + FormModal (mobile).
- Submission a Firestore (transacción que crea ambos docs).
- Disparo de los 2 emails vía EmailJS.
- SuccessOverlay manual-dismiss.

### Lane D — Superficies de datos en vivo
**Output:** termómetros, muro y galería leyendo Firestore en tiempo real.
- ThermometersGrid + TripItemCard + ThermometerBar.
- Lista de contribuidores por partida.
- MessagesWall en masonry, ordenada por fecha.
- PhotoGallery en masonry con lightbox.

### Lane E — Panel admin completo
**Output:** Gerry puede gestionar todo el contenido.
- AdminLogin + AuthContext + ProtectedRoute.
- ContributionsList con marcar-pagado (transacción).
- MessagesModeration (ocultar/mostrar/borrar).
- PhotosModeration (aprobar/rechazar).
- TripItemsManager (CRUD).
- Aportaciones manuales (form admin).
- ExportTools: PDF de mensajes con `pdf-lib`, ZIP de fotos con `JSZip`.

### Lane F — Pulido y QA (final, después de A-E)
- Animaciones de entrada (intersection observer).
- Tests manuales del flujo completo en mobile real (iOS Safari + Android Chrome).
- Verificar emails llegan a PANGEA y a Gerry.
- Verificar que /admin no es indexable.
- Verificar contraste de colores accesible (WCAG AA).
- Configurar dominio en Namecheap (CNAME → GitHub Pages).

---

## 8. Decisiones técnicas no especificadas en el brief

| # | Decisión | Justificación |
|---|---|---|
| 1 | **Vite + React JS** (no TS) | Brief ofrecía vanilla o React. React simplifica datos en tiempo real. JS sin TS por velocidad. |
| 2 | **Tipografía:** Fraunces (titulares) + Inter (cuerpo) | Encaja con el tono "Apple/Microsoft, cálido y emotivo". Self-hosted vía `@fontsource`. |
| 3 | **Privacidad de email:** colección dual `contributions` (privada) + `messageWall` (pública) | Firestore rules no filtran campos. Splitting es la única forma sin Cloud Functions. |
| 4 | **Termómetros:** se incrementan al marcar como pagado, no al recibir el formulario | Implícito en el brief, lo dejamos explícito. |
| 5 | **Foto en mensaje:** sin foto el mensaje aparece igual; con foto, la foto aparece solo si admin aprueba, pero el mensaje aparece de inmediato | Brief dice "mensaje publica auto, foto requiere aprobación". |
| 6 | **`/admin` no protegida por URL secreta**, solo por Firebase Auth | Una contraseña fuerte basta. URL secreta sería seguridad por oscuridad. |
| 7 | **Seed inicial de partidas:** 25 partidas placeholder con descripciones emotivas en español sobre Argentina (vuelos, hoteles, Patagonia, spa, gastronomía, etc.) | Confirmado por Gerry. Editables/borrables desde admin cuando PANGEA entregue la lista real. |
| 8 | **Transacciones Firestore** al marcar pagado | Atómico: 5 documentos cambian a la vez (contribution, messageWall, tripItem, config × 2 contadores). |
| 9 | **`<meta name="robots" content="noindex">` global** | Es una sorpresa; no debe aparecer en Google. Quitar tras el evento si se quiere. |
| 10 | **Idioma de fechas relativas:** `Intl.RelativeTimeFormat('es')` nativo | Sin librería extra. |
| 11 | **Compresión de imagen:** máx 2400 px lado largo, calidad 0.85, target 1.5 MB | Buena calidad para masonry sin saturar Storage. |
| 12 | **Rate limiting de submission:** del lado cliente (debounce + disabled state) + reglas Firestore con `request.time > resource.data.lastSubmit + duration` | Mitigación simple anti-spam. |
| 13 | **Sin dark mode** | El brief define una paleta cálida única. |
| 14 | **Sin analytics inicial** | Es una sorpresa íntima, no necesita métricas. |
| 15 | **Variables de entorno:** `.env.local` con prefijo `VITE_` para todo lo expuesto al cliente (Firebase config, EmailJS public key) | Estándar Vite. Firebase web config no es secreto, sí lo restringen las rules. |

---

## 9. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| MªÁngeles encuentra la web por buscador | `noindex` + dominio que no contiene su nombre. |
| Spam o mensajes ofensivos en muro auto-publicado | Admin puede ocultar/borrar al instante. Notificación email a Gerry en cada submission. |
| Foto inapropiada subida | Aprobación manual obligatoria antes de mostrar. |
| EmailJS rate limit superado | Volumen esperado ~100 contribuidores × 2 emails = 200 emails, justo en el límite del free tier. Plan B: $7/mes plan personal. |
| Firebase Free Tier excedido | Spark plan: 50k reads/día, 20k writes/día. Margen amplísimo para este uso. |
| Pérdida de datos al expirar dominio | Firestore queda vivo indefinidamente. Solo se cae el frontend. Exportar JSON+ZIP final tras la entrega. |

---

## 10. Próximos pasos (después de aprobación)

**Decisiones cerradas:**
- EmailJS free.
- `totalTripCost` placeholder = 15.000 € (editable desde admin).
- Seed de 25 partidas placeholder con tono emotivo, temática Argentina.
- Repo GitHub público, nombre `unmillondegracias`.
- Tipografías: Fraunces (titulares) + Inter (cuerpo).
- Auth admin: solo email + contraseña fuerte.
- Sin captcha.
- Línea temporal: 3 épocas.
- Monto opcional → email a PANGEA solo si hay monto.
- Sitio público, único protección anti-MªÁngeles: `noindex`.

**Plan de ejecución:**
1. Lane A (cimientos): Vite + React, Firebase config, design tokens, rules, GH Actions, seed de partidas.
2. Lanes B/C/D/E en paralelo.
3. Lane F: pulido, QA, deploy a `unmillondegracias.com`.

---

*Última actualización: 2026-04-27*
