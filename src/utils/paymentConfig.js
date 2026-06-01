/**
 * Configuración de la Pasarela de Pagos (MercadoPago)
 * 
 * - Si `IS_PAYMENT_SIMULATION` es true, la aplicación utilizará los formularios locales
 *   de tarjeta de crédito simulada (diseño premium y loaders simulados) sin hacer cobros reales.
 * - Si es false, se activará la integración real con redirección a MercadoPago Checkout Pro,
 *   para lo cual debes configurar tu llave pública y desplegar las Firebase Cloud Functions.
 */
export const paymentConfig = {
  IS_PAYMENT_SIMULATION: true,
  MERCADOPAGO_PUBLIC_KEY: 'YOUR_MERCADOPAGO_PUBLIC_KEY',
  FIREBASE_FUNCTIONS_BASE_URL: 'https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net'
};
