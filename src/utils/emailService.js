/**
 * Servicio de Notificaciones por Correo Electrónico
 * 
 * Este servicio permite enviar correos electrónicos de confirmación y cancelación
 * utilizando la API REST de EmailJS de forma nativa (sin requerir dependencias adicionales).
 * 
 * Para activar los envíos reales, reemplaza las constantes de abajo con tus credenciales de EmailJS.
 */

// Credenciales de configuración de EmailJS (Reemplazar para producción)
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';

/**
 * Envia una notificación por correo electrónico.
 * Si las credenciales no están configuradas, simula el envío imprimiendo en la consola.
 * 
 * @param {Object} bookingData - Datos completos de la cita.
 * @param {'confirmacion' | 'cancelacion'} type - Tipo de correo a enviar.
 */
export async function sendBookingEmail(bookingData, type = 'confirmacion') {
  const isConfigured = 
    EMAILJS_SERVICE_ID !== 'YOUR_SERVICE_ID' &&
    EMAILJS_TEMPLATE_ID !== 'YOUR_TEMPLATE_ID' &&
    EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY';

  const templateParams = {
    to_name: bookingData.clientName,
    to_email: bookingData.clientEmail,
    client_phone: bookingData.clientPhone || 'No registrado',
    branch_name: bookingData.branchName,
    worker_name: bookingData.workerName,
    service_name: bookingData.service,
    service_price: new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(bookingData.servicePrice || 0),
    date: bookingData.date,
    time: bookingData.time,
    notes: bookingData.notes || 'Ninguna',
    subject: type === 'confirmacion' 
      ? 'Reserva Confirmada - Barber Kalvin' 
      : 'Reserva Cancelada - Barber Kalvin',
    type_message: type === 'confirmacion'
      ? 'Tu cita ha sido agendada con éxito. A continuación te presentamos el detalle de tu reserva:'
      : 'Lamentamos informarte que tu cita ha sido cancelada. A continuación te presentamos el detalle del registro cancelado:'
  };

  if (!isConfigured) {
    // Simulación elegante por consola para propósitos de prueba / desarrollo
    console.log(
      `%c[EmailJS Simulado] Enviando correo de ${type.toUpperCase()} a ${bookingData.clientEmail}`,
      'background: #1e293b; color: #f97316; padding: 6px 12px; border-radius: 6px; font-weight: bold;'
    );
    console.log('Datos del Correo:', templateParams);
    return { success: true, simulated: true };
  }

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: templateParams
      })
    });

    if (response.ok) {
      console.log(`%c[EmailJS] Correo de ${type} enviado exitosamente a ${bookingData.clientEmail}`, 'color: #4ade80; font-weight: bold;');
      return { success: true };
    } else {
      const errText = await response.text();
      console.error('[EmailJS] Error al enviar el correo:', errText);
      return { success: false, error: errText };
    }
  } catch (error) {
    console.error('[EmailJS] Error de conexión:', error);
    return { success: false, error: error.message };
  }
}
