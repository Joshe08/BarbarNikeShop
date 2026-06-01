# Guía de Integración de Pagos (MercadoPago)

Esta guía detalla cómo pasar del modo de simulación local al procesamiento de cobros reales con **MercadoPago Checkout Pro** (redirección a pasarela segura) para citas y productos.

---

## Requisitos Previos

1. **Plan Firebase Blaze (Pago por Uso)**:
   - Firebase requiere el plan Blaze para realizar peticiones HTTP externas (a MercadoPago) desde Cloud Functions.
   - **Nota**: El plan Blaze incluye una amplia capa gratuita mensual, por lo que las primeras miles de ejecuciones no tendrán costo.

2. **Cuenta de MercadoPago**:
   - Una cuenta activa en MercadoPago.
   - Credenciales de producción o de prueba (Sandbox). Puedes encontrarlas en el panel de desarrolladores de MercadoPago (Sección *Credenciales*).
     - **Access Token**: Token privado que empieza por `APP_USR-...`
     - **Public Key**: Llave pública que empieza por `APP_USR-...`

---

## Paso 1: Configurar Credenciales Secretas de Firebase

Por motivos de seguridad, el Token de Acceso Secreto de MercadoPago nunca debe guardarse en el código fuente. Se utiliza el administrador de secretos de Firebase para inyectarlo en las funciones durante el despliegue.

1. Abre tu terminal en la raíz del proyecto.
2. Ejecuta el siguiente comando para guardar tu access token:
   ```bash
   firebase functions:secrets:set MERCADOPAGO_ACCESS_TOKEN="TU_MERCADOPAGO_ACCESS_TOKEN_REAL"
   ```
3. Para validar que se guardó correctamente, puedes listar los secretos:
   ```bash
   firebase functions:secrets:list
   ```

---

## Paso 2: Instalar Dependencias del Backend y Desplegar Functions

1. Entra a la carpeta de funciones (`functions`):
   ```bash
   cd functions
   npm install
   ```
2. Despliega las Cloud Functions a tu proyecto de Firebase:
   ```bash
   firebase deploy --only functions
   ```
3. Una vez completado el despliegue, la CLI de Firebase te mostrará la URL pública de tus funciones en la consola, algo como:
   `https://us-central1-tu-proyecto.cloudfunctions.net/createPreference`
   `https://us-central1-tu-proyecto.cloudfunctions.net/paymentWebhook`

---

## Paso 3: Configurar el Frontend

Abre el archivo [paymentConfig.js](file:///c:/Users/zulet/Desktop/BarbarNikeShop/src/utils/paymentConfig.js) e ingresa tus datos:

```javascript
export const paymentConfig = {
  // Cambia a false para desactivar la simulación y procesar cobros reales
  IS_PAYMENT_SIMULATION: false,

  // Tu clave pública de MercadoPago
  MERCADOPAGO_PUBLIC_KEY: 'TU_MERCADOPAGO_PUBLIC_KEY_REAL',

  // La URL base de tus Cloud Functions (sin el nombre de la función)
  FIREBASE_FUNCTIONS_BASE_URL: 'https://us-central1-tu-proyecto.cloudfunctions.net'
};
```

---

## Paso 4: Configurar los Webhooks en MercadoPago (Opcional)

Nuestras Cloud Functions envían dinámicamente la URL del Webhook (`notification_url`) en cada preferencia de pago creada. Sin embargo, para mayor robustez, puedes registrar la URL del webhook de forma fija en el panel de MercadoPago:

1. Ve a **Panel de Desarrolladores de MercadoPago** > **Notificaciones Webhooks**.
2. Selecciona tu aplicación o crea una nueva.
3. En la sección de URL de producción, ingresa tu endpoint de webhook:
   `https://us-central1-tu-proyecto.cloudfunctions.net/paymentWebhook`
4. Selecciona los eventos que deseas recibir (obligatorio marcar **Pagos / payments**).
5. Guarda los cambios.

---

## Flujo de Trabajo en Producción

### Reservas de Citas
1. El usuario selecciona su servicio, fecha y barbero.
2. Selecciona **Pago Online** y pulsa **Confirmar y Pagar**.
3. El frontend crea el documento de cita en Firestore con estado `paymentStatus: 'pending'`.
4. El backend genera la preferencia de pago en MercadoPago.
5. El usuario es redirigido a MercadoPago para realizar el pago de forma segura.
6. Una vez completado, MercadoPago lo redirige de vuelta a `/dashboard?payment=success` (o `failure` si falló).
7. La Cloud Function `paymentWebhook` recibe la notificación asíncrona oficial de MercadoPago, verifica la transacción usando el SDK y actualiza el estado de la cita en Firestore a `paymentStatus: 'paid'`.

### Venta de Productos
1. El usuario selecciona el producto, método de entrega (recogida/domicilio) y pulsa **Pagar con MercadoPago**.
2. El backend genera la preferencia de pago.
3. El usuario realiza la transacción en la pasarela.
4. Una vez aprobado, el Webhook oficial de MercadoPago reduce automáticamente el stock del producto en la base de datos (con transacciones Firestore que previenen condiciones de carrera) e inserta la venta en la colección `sales` con estado `paymentStatus: 'paid'`.
5. El usuario regresa a la tienda con una notificación de éxito.
