const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

// Inicializar el SDK de Firebase Admin para acceso con privilegios elevados
admin.initializeApp();
const db = admin.firestore();

/**
 * Inicializar el cliente de MercadoPago.
 * Lee la clave secreta directamente de las variables de entorno de Firebase Secrets Manager
 * o de la configuración tradicional (fallback).
 */
const getMpClient = () => {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN variable de entorno no configurada.');
  }
  return new MercadoPagoConfig({ accessToken });
};

/**
 * Cloud Function: createPreference
 * 
 * Crea una preferencia de pago en MercadoPago para redirigir al usuario.
 * Acepta solicitudes POST con el cuerpo:
 * {
 *   "type": "booking" | "product",
 *   "id": "ID de reserva o producto",
 *   "title": "Nombre del servicio o producto",
 *   "price": 28000,
 *   "quantity": 1,
 *   "branchId": "branch-1",
 *   "successUrl": "URL de retorno al completar",
 *   "failureUrl": "URL de retorno al fallar"
 * }
 */
exports.createPreference = onRequest({ secrets: ['MERCADOPAGO_ACCESS_TOKEN'] }, (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método no permitido. Utilizar POST.' });
    }

    try {
      const client = getMpClient();
      const { type, id, title, price, quantity = 1, branchId = 'branch-1', successUrl, failureUrl } = req.body;

      if (!id || !title || !price) {
        return res.status(400).json({ error: 'Faltan parámetros obligatorios: id, title, price.' });
      }

      // El webhook de producción debe apuntar a la URL pública de esta Cloud Function.
      // Si estás en desarrollo local con emuladores, puedes mapearla usando túneles como ngrok.
      const functionBase = `https://${req.get('host')}`;
      const webhookUrl = `${functionBase}/paymentWebhook`;

      // Construir la referencia externa: "tipo:documentId[:extraParams]"
      let externalReference = '';
      if (type === 'booking') {
        externalReference = `booking:${id}`;
      } else {
        externalReference = `sale:${id}:${quantity}:${branchId}`;
      }

      const preference = new Preference(client);
      const response = await preference.create({
        body: {
          items: [
            {
              id: id,
              title: title,
              unit_price: Number(price),
              quantity: Number(quantity),
              currency_id: 'COP'
            }
          ],
          external_reference: externalReference,
          notification_url: webhookUrl,
          back_urls: {
            success: successUrl || 'http://localhost:5173',
            failure: failureUrl || 'http://localhost:5173',
            pending: successUrl || 'http://localhost:5173'
          },
          auto_return: 'approved'
        }
      });

      console.log(`Preferencia creada con éxito. ID: ${response.id}, Referencia: ${externalReference}`);
      return res.status(200).json({
        preferenceId: response.id,
        initPoint: response.init_point
      });

    } catch (error) {
      console.error('Error al crear preferencia de MercadoPago:', error);
      return res.status(500).json({ error: error.message || 'Error interno del servidor.' });
    }
  });
});

/**
 * Cloud Function: paymentWebhook
 * 
 * Recibe notificaciones instantáneas de pago (IPN / Webhooks) de MercadoPago.
 * Valida el pago y actualiza Firestore en consecuencia de forma segura.
 */
exports.paymentWebhook = onRequest({ secrets: ['MERCADOPAGO_ACCESS_TOKEN'] }, async (req, res) => {
  // MercadoPago suele enviar notificaciones con query params, ej: topic=payment & id=PAYMENT_ID
  // O en el body: action=payment.created & data.id=PAYMENT_ID
  const paymentId = req.query.id || (req.body.data && req.body.data.id);
  const topic = req.query.topic || req.body.type;

  if (topic !== 'payment' && topic !== 'payment.created' && req.body.action !== 'payment.created') {
    // Si no es un evento de pago, retornamos 200 OK inmediatamente (requerido por MP)
    return res.status(200).send('Ignored: Not a payment status event.');
  }

  if (!paymentId) {
    return res.status(400).send('Error: Missing payment transaction ID.');
  }

  try {
    const client = getMpClient();
    const payment = new Payment(client);
    const paymentData = await payment.get({ id: paymentId });

    const status = paymentData.status; // 'approved', 'pending', 'rejected', etc.
    const externalReference = paymentData.external_reference; // "booking:ID" o "sale:ID:QTY:BRANCH"

    console.log(`Webhook de Pago Recibido. Transacción: ${paymentId}. Estado: ${status}. Referencia: ${externalReference}`);

    if (status === 'approved' && externalReference) {
      const parts = externalReference.split(':');
      const refType = parts[0];

      if (refType === 'booking') {
        const bookingId = parts[1];
        const bookingRef = db.collection('bookings').doc(bookingId);
        
        await db.runTransaction(async (transaction) => {
          const bookingSnap = await transaction.get(bookingRef);
          if (bookingSnap.exists) {
            transaction.update(bookingRef, {
              paymentStatus: 'paid',
              paymentMethod: 'card',
              updatedAt: new Date().toISOString()
            });
            console.log(`Firestore: Cita ${bookingId} marcada como PAGADA con tarjeta.`);
          }
        });
      } 
      
      else if (refType === 'sale') {
        const productId = parts[1];
        const quantity = Number(parts[2]) || 1;
        const branchId = parts[3] || 'branch-1';

        const productRef = db.collection('products').doc(productId);
        
        await db.runTransaction(async (transaction) => {
          const productSnap = await transaction.get(productRef);
          if (productSnap.exists()) {
            const productData = productSnap.data();
            const currentStock = productData.stock || 0;
            const newStock = Math.max(0, currentStock - quantity);
            
            // 1. Decrementar stock del producto en la base de datos
            transaction.update(productRef, { stock: newStock });
            
            // 2. Registrar la venta en Firestore
            const saleRef = db.collection('sales').doc();
            const localISO = new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000).toISOString().slice(0, -1);
            
            transaction.set(saleRef, {
              productId,
              productName: productData.name,
              price: productData.price,
              quantity,
              total: (productData.price || 0) * quantity,
              branchId,
              date: localISO,
              paymentStatus: 'paid',
              paymentMethod: 'card',
              paymentId: paymentId
            });
            
            console.log(`Firestore: Venta registrada y stock del producto ${productData.name} actualizado. Nuevo stock: ${newStock}`);
          }
        });
      }
    }

    // MercadoPago requiere una respuesta 200/201 OK para confirmar la recepción del webhook
    return res.status(200).send('OK: Payment Webhook Processed Successfully.');

  } catch (error) {
    console.error('Error procesando Webhook de MercadoPago:', error);
    // Devolvemos 500 para indicarle a MP que reintente la notificación más tarde
    return res.status(500).send('Error Internal Server: Webhook processing failed.');
  }
});
