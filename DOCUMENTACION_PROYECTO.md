# 📋 Documentación Técnica — BarberNike Shop

> **Versión:** 1.0 (Mayo 2026)  
> **Stack:** React 19 + Vite + Firebase (Auth, Firestore, Storage) + Tailwind CSS 4  
> **Proyecto:** `barbernikeshop-d2cff` (Firebase)

---

## 📌 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Tecnologías Utilizadas](#tecnologías-utilizadas)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Colecciones Firestore](#colecciones-firestore)
5. [Sistema de Roles](#sistema-de-roles)
6. [Módulos del Frontend](#módulos-del-frontend)
7. [Integración de Pagos (MercadoPago)](#integración-de-pagos-mercadopago)
8. [Backend — Firebase Cloud Functions](#backend--firebase-cloud-functions)
9. [Reglas de Seguridad Firestore](#reglas-de-seguridad-firestore)
10. [Servicios Externos](#servicios-externos)
11. [Scripts y Comandos](#scripts-y-comandos)
12. [Variables de Configuración](#variables-de-configuración)
13. [Despliegue en Producción](#despliegue-en-producción)
14. [Mantenimiento y Extensibilidad](#mantenimiento-y-extensibilidad)

---

## 📖 Descripción General

**BarberNike Shop** es una aplicación web full-stack para la gestión de una cadena de barberías premium. Permite a los clientes reservar citas online, comprar productos de cuidado personal, y a los administradores gestionar el negocio en tiempo real: personal, agenda, inventario, finanzas y reportes.

### Características Principales

| Área | Funcionalidad |
|------|--------------|
| **Clientes** | Registro/Login, reservas online, compra de productos, verificación de correo, perfil |
| **Barberos/Staff** | Panel personalizado de citas asignadas, gestión de disponibilidad |
| **Administrador** | Dashboard completo: reportes, finanzas, cierre de caja, comisiones, inventario, usuarios |
| **Pagos** | Simulación local o redirección segura a MercadoPago Checkout Pro |
| **Notificaciones** | Centro de notificaciones en tiempo real + correos confirmación (EmailJS) |

---

## 🔧 Tecnologías Utilizadas

### Frontend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| **React** | 19.x | Framework principal de UI |
| **Vite** | 8.x | Bundler y servidor de desarrollo |
| **Tailwind CSS** | 4.x | Sistema de diseño (dark mode glassmorphic) |
| **React Router DOM** | 7.x | Navegación SPA |
| **Chart.js / react-chartjs-2** | 4.x / 5.x | Gráficos en el dashboard |
| **jsPDF + jspdf-autotable** | 4.x | Exportación de reportes en PDF |
| **XLSX** | 0.18.x | Exportación de datos a Excel |

### Backend / Cloud
| Tecnología | Uso |
|-----------|-----|
| **Firebase Auth** | Autenticación de usuarios |
| **Firebase Firestore** | Base de datos NoSQL en tiempo real |
| **Firebase Storage** | Almacenamiento de imágenes de usuarios y productos |
| **Firebase Cloud Functions** | Backend serverless para pagos y webhooks |
| **Firebase Hosting** | Hosting de la SPA |

### Pagos
| Servicio | Uso |
|---------|-----|
| **MercadoPago SDK v2** | Creación de preferencias de pago y webhooks |

---

## 🗂 Estructura del Proyecto

```
BarbarNikeShop/
├── 📁 dist/                        # Build de producción (auto-generado)
├── 📁 functions/                   # Firebase Cloud Functions (Node.js 18)
│   ├── index.js                    # Endpoints: createPreference, paymentWebhook
│   └── package.json                # Dependencias del backend
├── 📁 public/                      # Activos públicos (favicon, etc.)
├── 📁 src/
│   ├── App.jsx                     # Raíz: rutas y providers de contexto
│   ├── main.jsx                    # Punto de entrada
│   ├── index.css                   # Estilos globales y variables CSS
│   │
│   ├── 📁 Components/
│   │   ├── AdminDashboard.jsx      # Panel completo de administración
│   │   ├── BarberDashboard.jsx     # Panel del barbero (agenda del día)
│   │   ├── BookingModal.jsx        # Modal de reserva de citas (7 pasos)
│   │   ├── Catalog.jsx             # Catálogo de servicios con filtros
│   │   ├── ClientDashboard.jsx     # Dashboard del cliente
│   │   ├── ClosuresModule.jsx      # Módulo de cierre de caja
│   │   ├── CommissionsModule.jsx   # Módulo de comisiones del personal
│   │   ├── Dashboard.jsx           # Componente dispatcher de dashboards
│   │   ├── Footer.jsx              # Pie de página
│   │   ├── ImageUploadField.jsx    # Campo de carga de imágenes a Storage
│   │   ├── Main.jsx                # Sección Hero de la página principal
│   │   ├── NotificationCenter.jsx  # Centro de notificaciones
│   │   ├── ProductsSection.jsx     # Tienda de productos + CheckoutModal
│   │   ├── ProfileModal.jsx        # Modal de edición de perfil
│   │   ├── ReportsModule.jsx       # Módulo de reportes financieros
│   │   ├── ReservaButton.jsx       # Botón flotante de reserva
│   │   ├── ServiceDetailModal.jsx  # Modal de detalle de servicio
│   │   └── WorkerDashboard.jsx     # Dashboard del trabajador (barber/stylist)
│   │
│   ├── 📁 Page/
│   │   ├── DashboardPage.jsx       # Página de dashboard (protegida)
│   │   ├── ForgotPassword.jsx      # Página de recuperación de contraseña
│   │   ├── Header.jsx              # Cabecera con navegación y notificaciones
│   │   ├── Home.jsx                # Página principal (landing)
│   │   ├── Login.jsx               # Página de inicio de sesión
│   │   ├── Register.jsx            # Página de registro de usuario
│   │   └── ResetPassword.jsx       # Página para restablecer contraseña
│   │
│   ├── 📁 context/
│   │   ├── AuthContext.jsx         # Contexto de autenticación y usuario
│   │   ├── AppContext.jsx          # Contexto de datos (workers, products, etc.)
│   │   └── BookingContext.jsx      # Contexto de citas y notificaciones
│   │
│   ├── 📁 data/
│   │   └── mockData.js             # Datos fallback iniciales (barberos, servicios)
│   │
│   ├── 📁 firebase/
│   │   └── config.js               # Configuración e inicialización de Firebase
│   │
│   ├── 📁 hooks/
│   │   └── useAvailability.js      # Hook para consultar disponibilidad de citas
│   │
│   └── 📁 utils/
│       ├── emailService.js         # Servicio de envío de correos (EmailJS)
│       ├── format.js               # Formateador de moneda COP
│       ├── imageHelper.js          # Compresión y carga de imágenes a Storage
│       └── paymentConfig.js        # Configuración de la pasarela de pagos
│
├── eslint.config.js                # Configuración de ESLint
├── firebase.json                   # Configuración de Firebase Hosting + Functions
├── firestore.rules                 # Reglas de seguridad de Firestore
├── index.html                      # HTML base
├── package.json                    # Dependencias del frontend
├── vercel.json                     # Configuración para despliegue en Vercel
├── vite.config.js                  # Configuración de Vite (minificación, build)
├── PAYMENT_INTEGRATION_GUIDE.md    # Guía para activar pagos reales
└── README.md
```

---

## 🗄 Colecciones Firestore

### `users` — Usuarios del sistema
```javascript
{
  uid: string,           // UID de Firebase Auth
  name: string,          // Nombre completo
  email: string,
  phone: string,
  role: 'client' | 'admin' | 'barber' | 'stylist' | 'manicurist',
  active: boolean,       // false = cuenta deshabilitada
  image: string,         // URL de foto de perfil (Storage)
  emailVerified: boolean
}
```

### `workers` — Personal / Barberos
```javascript
{
  name: string,
  role: 'barber' | 'stylist' | 'manicurist',
  specialty: string,
  branchId: string,      // Sede a la que pertenece
  image: string,
  active: boolean,
  userId: string         // uid del usuario vinculado (opcional)
}
```

### `services` — Servicios ofrecidos
```javascript
{
  name: string,
  category: 'men' | 'women',
  subcategory: string,   // 'corte', 'barba', 'coloracion', 'unas', etc.
  price: number,         // En pesos colombianos (COP)
  duration: number,      // En minutos
  description: string,
  image: string,
  active: boolean
}
```

### `products` — Inventario de tienda
```javascript
{
  name: string,
  category: 'capilar' | 'maquinas' | 'accesorios',
  price: number,         // COP
  stock: number,
  description: string,
  image: string
}
```

### `bookings` — Reservas de citas
```javascript
{
  clientId: string,      // UID del cliente
  clientName: string,
  clientEmail: string,
  branchId: string,
  branchName: string,
  workerId: string,
  workerName: string,
  service: string,
  servicePrice: number,
  category: 'men' | 'women',
  date: string,          // YYYY-MM-DD
  time: string,          // HH:MM
  notes: string,
  paymentMethod: 'local' | 'card',
  paymentStatus: 'pending' | 'paid',
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled',
  createdAt: string,     // ISO 8601
  cancelReason: string   // (opcional)
}
```

### `sales` — Registro de ventas
```javascript
{
  productId: string,
  productName: string,
  price: number,
  quantity: number,
  total: number,
  branchId: string,
  date: string,
  paymentStatus: 'pending' | 'paid',
  paymentMethod: 'efectivo' | 'transferencia' | 'card',
  paymentId: string      // ID de transacción MercadoPago (si aplica)
}
```

### `expenses` — Gastos operativos
```javascript
{
  description: string,
  amount: number,
  category: string,
  branchId: string,
  date: string,
  addedBy: string        // UID del admin
}
```

### `notifications` — Centro de notificaciones
```javascript
{
  userId: string,        // 'admin' para notificaciones del admin
  title: string,
  message: string,
  type: 'booking_new' | 'booking_cancelled' | 'booking_updated',
  read: boolean,
  createdAt: string
}
```

### `branches` — Sedes
```javascript
{
  name: string,
  address: string,
  phone: string,
  active: boolean
}
```

### `closures` — Cierres de caja
```javascript
{
  branchId: string,
  date: string,
  totalSales: number,
  totalExpenses: number,
  balance: number,
  createdBy: string,     // UID del admin
  notes: string
}
```

---

## 👥 Sistema de Roles

| Rol | Acceso | Dashboard |
|-----|--------|-----------|
| `client` | Solo sus propias citas, tienda, perfil | `ClientDashboard` |
| `barber` | Sus citas asignadas, agenda personal | `WorkerDashboard` |
| `stylist` | Sus citas asignadas, agenda personal | `WorkerDashboard` |
| `manicurist` | Sus citas asignadas, agenda personal | `WorkerDashboard` |
| `admin` | Acceso total al sistema | `AdminDashboard` |

> **Nota:** El rol se define en Firestore en la colección `users`. El Staff (barber/stylist/manicurist) recibe un descuento automático del 20% en la compra de productos.

---

## 🧩 Módulos del Frontend

### `BookingModal.jsx` — Reserva de Citas (7 Pasos)

| Paso | Pantalla |
|------|---------|
| 0 | Selección de sede |
| 1 | Selección de categoría (Hombres / Mujeres) |
| 2 | Selección de especialista |
| 3 | Selección de servicio |
| 4 | Selección de fecha y hora (con disponibilidad real) |
| 5 | Confirmación del resumen |
| 6 | Pago (simulación o redirección MercadoPago) |
| 7 | Pantalla de éxito + notificación WhatsApp |

### `ProductsSection.jsx` — Tienda + Checkout (3 Pasos)

| Paso | Pantalla |
|------|---------|
| 1 | Datos del cliente, método de entrega, método de pago |
| 2 | Formulario de tarjeta (simulación) o banner de redirección (real) |
| 3 | Confirmación de éxito + coordinación por WhatsApp |

### `AdminDashboard.jsx` — Panel Administrador

Incluye los siguientes módulos accesibles por pestañas:
- **Agenda**: Todas las citas de todas las sedes
- **Usuarios**: Gestión de cuentas y roles
- **Personal**: CRUD de barberos y especialistas
- **Servicios**: CRUD de servicios ofrecidos
- **Productos**: CRUD de inventario
- **Sedes**: Gestión de sucursales
- **Reportes**: Gráficos de ingresos, servicios populares, distribución por sede
- **Finanzas**: Registro de gastos y balance
- **Comisiones**: Cálculo de comisiones por barbero/período
- **Cierres**: Módulo de cierre de caja diario/mensual

---

## 💳 Integración de Pagos (MercadoPago)

### Archivo de Configuración

📄 [`src/utils/paymentConfig.js`](file:///c:/Users/zulet/Desktop/BarbarNikeShop/src/utils/paymentConfig.js)

```javascript
export const paymentConfig = {
  IS_PAYMENT_SIMULATION: true,        // true = simulación, false = producción real
  MERCADOPAGO_PUBLIC_KEY: 'APP_USR-...', 
  FIREBASE_FUNCTIONS_BASE_URL: 'https://us-central1-barbernikeshop-d2cff.cloudfunctions.net'
};
```

### Modos de Operación

#### Modo Simulación (`IS_PAYMENT_SIMULATION: true`)
- Se muestra el formulario premium de tarjeta de crédito con diseño glassmorphic
- El pago se procesa localmente de forma instantánea (sin cobro real)
- Ideal para demos, pruebas y desarrollo

#### Modo Real (`IS_PAYMENT_SIMULATION: false`)
- Se muestra un banner de redirección con SSL badge
- El usuario es redirigido a MercadoPago Checkout Pro
- Al completar el pago, un Webhook actualiza automáticamente Firestore
- El stock se descuenta y la venta se registra vía Admin SDK (sin permisos de cliente)

### Flujo de Pago Real

```
[Usuario selecciona pago con tarjeta]
         ↓
[Frontend llama a createPreference (Cloud Function)]
         ↓
[MercadoPago genera URL de pago]
         ↓
[Usuario completa pago en MercadoPago]
         ↓
[MercadoPago envía Webhook a paymentWebhook (Cloud Function)]
         ↓
[Admin SDK actualiza Firestore: paymentStatus → 'paid' / stock decrementado]
         ↓
[Usuario regresa a la app con toast de confirmación]
```

---

## ⚙️ Backend — Firebase Cloud Functions

📄 [`functions/index.js`](file:///c:/Users/zulet/Desktop/BarbarNikeShop/functions/index.js)

### Endpoint `createPreference` (POST)

Crea una preferencia de pago en MercadoPago y devuelve la URL de redirección.

**Request body:**
```json
{
  "type": "booking" | "product",
  "id": "ID del documento Firestore",
  "title": "Nombre del servicio o producto",
  "price": 28000,
  "quantity": 1,
  "branchId": "branch-1",
  "successUrl": "https://tu-app.com/dashboard?payment=success",
  "failureUrl": "https://tu-app.com/dashboard?payment=failure"
}
```

**Response:**
```json
{
  "preferenceId": "...",
  "initPoint": "https://www.mercadopago.com.co/checkout/v1/redirect?pref_id=..."
}
```

### Endpoint `paymentWebhook` (POST/GET)

Recibe notificaciones IPN de MercadoPago, valida el pago usando el SDK y actualiza Firestore.

- Para **citas** (`booking:ID`): actualiza `paymentStatus` → `'paid'`
- Para **productos** (`sale:ID:QTY:BRANCH`): registra la venta y decrementa el stock en una transacción atómica

---

## 🔒 Reglas de Seguridad Firestore

📄 [`firestore.rules`](file:///c:/Users/zulet/Desktop/BarbarNikeShop/firestore.rules)

| Colección | Cliente | Staff | Admin | Webhook (Admin SDK) |
|-----------|---------|-------|-------|---------------------|
| `users` | Lee/escribe la suya | Lee todas | Todo | — |
| `workers` | Lee | Lee | Todo | — |
| `services` | Lee | Lee | Todo | — |
| `products` | Lee | Lee | Todo | Escribe |
| `bookings` | Crea/lee las suyas | Lee/actualiza todas | Todo | Actualiza |
| `sales` | ❌ | ❌ | Todo | Escribe |
| `expenses` | ❌ | ❌ | Todo | — |
| `notifications` | Lee las suyas | Lee todas | Todo | — |
| `branches` | Lee | Lee | Todo | — |

> El Admin SDK (en Cloud Functions) omite todas las reglas de seguridad. Esto es intencional para los webhooks de pago.

---

## 🌐 Servicios Externos

### Firebase (Google)
- **Proyecto:** `barbernikeshop-d2cff`
- **Auth domain:** `barbernikeshop-d2cff.firebaseapp.com`
- **Storage bucket:** `barbernikeshop-d2cff.firebasestorage.app`
- **Hosting URL:** Configurable vía `firebase.json`

### MercadoPago (Modo Producción)
- Requiere cuenta activa con credenciales de producción
- Access Token: guardado como secreto de Firebase Functions (`MERCADOPAGO_ACCESS_TOKEN`)
- Webhook URL: `https://us-central1-barbernikeshop-d2cff.cloudfunctions.net/paymentWebhook`

### EmailJS (Opcional — Correos de confirmación)
📄 [`src/utils/emailService.js`](file:///c:/Users/zulet/Desktop/BarbarNikeShop/src/utils/emailService.js)
- Configurar con: `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`
- Si no está configurado, el sistema funciona sin correos (usa WhatsApp como alternativa)

### WhatsApp Business
- Número de contacto: `+57 304 544 9644`
- Usado para coordinación de pedidos y notificaciones de citas

---

## 🚀 Scripts y Comandos

### Desarrollo Local
```bash
# Instalar dependencias del frontend
npm install

# Iniciar servidor de desarrollo (http://localhost:5173)
npm run dev

# Verificar errores de código
npm run lint

# Compilar para producción
npm run build

# Previsualizar el build de producción localmente
npm run preview
```

### Firebase Cloud Functions
```bash
# Entrar a la carpeta de funciones
cd functions
npm install

# Desplegar solo las funciones
firebase deploy --only functions

# Agregar el token secreto de MercadoPago
firebase functions:secrets:set MERCADOPAGO_ACCESS_TOKEN="TU_ACCESS_TOKEN"

# Iniciar emuladores locales (para pruebas)
firebase emulators:start --only functions
```

### Firebase Hosting
```bash
# Desplegar todo (hosting + functions)
firebase deploy

# Desplegar solo el hosting
firebase deploy --only hosting
```

---

## 🔑 Variables de Configuración

### Frontend (`src/utils/paymentConfig.js`)
```javascript
IS_PAYMENT_SIMULATION: true          // Cambiar a false para producción
MERCADOPAGO_PUBLIC_KEY: 'APP_USR-...' // Clave pública de MercadoPago
FIREBASE_FUNCTIONS_BASE_URL: 'https://us-central1-barbernikeshop-d2cff.cloudfunctions.net'
```

### Frontend (`src/firebase/config.js`)
```javascript
apiKey: "AIzaSyDeK1nA0lXFA2dusnnAT8U-lpOqUELF0kw"
authDomain: "barbernikeshop-d2cff.firebaseapp.com"
projectId: "barbernikeshop-d2cff"
storageBucket: "barbernikeshop-d2cff.firebasestorage.app"
```

### Backend (`functions/` — Firebase Secret Manager)
```bash
MERCADOPAGO_ACCESS_TOKEN   # Token privado de acceso a MercadoPago (nunca exponer en código)
```

### EmailJS (`src/utils/emailService.js`)
```javascript
EMAILJS_SERVICE_ID   // ID del servicio de EmailJS
EMAILJS_TEMPLATE_ID  // ID de la plantilla de correo
EMAILJS_PUBLIC_KEY   // Clave pública de EmailJS
```

---

## 🌍 Despliegue en Producción

### Opción A — Firebase Hosting (Recomendado)
```bash
npm run build
firebase deploy
```

### Opción B — Vercel
Configuración incluida en [`vercel.json`](file:///c:/Users/zulet/Desktop/BarbarNikeShop/vercel.json):
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```

### Checklist Pre-Producción
- [ ] Cambiar `IS_PAYMENT_SIMULATION` a `false` en `paymentConfig.js`
- [ ] Configurar credenciales reales de MercadoPago
- [ ] Ejecutar `firebase functions:secrets:set MERCADOPAGO_ACCESS_TOKEN="..."`
- [ ] Configurar EmailJS para correos automáticos
- [ ] Actualizar URLs de callback de éxito/fallo en `BookingModal.jsx` y `ProductsSection.jsx`
- [ ] Actualizar las reglas de Firestore si es necesario
- [ ] Hacer `npm run build` y verificar que no haya errores
- [ ] Ejecutar `firebase deploy --only functions` antes del hosting

---

## 🔧 Mantenimiento y Extensibilidad

### Agregar un Nuevo Rol de Usuario
1. Agregar el rol en `AuthContext.jsx` en el objeto `baseUser`
2. Agregar la regla correspondiente en `firestore.rules`
3. Crear el componente de dashboard en `src/Components/`
4. Agregarlo al dispatcher en `DashboardPage.jsx`

### Agregar una Nueva Categoría de Servicios
1. Agregar en `src/data/mockData.js` los servicios iniciales
2. Los servicios en Firestore se sincronizan en tiempo real automáticamente

### Agregar una Sede Nueva
1. Ir al AdminDashboard → Módulo "Sedes" → Crear sede
2. La sede aparecerá automáticamente en el proceso de reserva

### Personalizar el Diseño
- El sistema de colores usa variables CSS en `src/index.css`
- Los colores principales: `orange-500` (acento), `neutral-900/950` (fondos oscuros)
- El diseño sigue un sistema glassmorphic con bordes `border-white/5` y fondos translúcidos

### Modificar las Reglas de Seguridad
Editar `firestore.rules` y desplegar:
```bash
firebase deploy --only firestore:rules
```

---

## 📊 Build y Rendimiento

```
dist/index.html                1.09 kB  │ gzip: 0.54 kB
dist/assets/index.css         96.66 kB  │ gzip: 13.42 kB
dist/assets/index.js       1,126.23 kB  │ gzip: 317.56 kB  (principal, incluye Firebase SDK)
dist/assets/jspdf.es.min     403.21 kB  │ gzip: 129.12 kB  (generación de PDFs)
dist/assets/xlsx             418.12 kB  │ gzip: 140.07 kB  (exportación Excel)
```

> ⚠️ El bundle principal es grande principalmente por los SDKs de Firebase, jsPDF y XLSX. Para mejorar la performance, considera lazy imports para los módulos del admin.

---

*Documentación generada el 26 de Mayo de 2026.*
