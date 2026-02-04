import axios from 'axios';

// ─── Configuración Whapi.cloud ──────────────────────────────────────────────
const WHAPI_TOKEN = process.env.WHAPI_TOKEN;
const WHAPI_BASE_URL = process.env.WHAPI_BASE_URL || 'https://gate.whapi.cloud';

// ─── Servicios del salón ───────────────────────────────────────────────────
export const serviceDurations = {
  'unas-gel':       { duracion: 60,  nombre: 'Uñas de Gel',             precio: 450  },
  'unas-acrilicas': { duracion: 90,  nombre: 'Uñas Acrílicas',          precio: 600  },
  'pedicure':       { duracion: 90,  nombre: 'Pedicure Premium',        precio: 500  },
  'keratina':       { duracion: 180, nombre: 'Tratamiento de Keratina', precio: 1200 },
  'tinte':          { duracion: 180, nombre: 'Tinte Profesional',       precio: 800  },
  'pestanas':       { duracion: 60,  nombre: 'Extensión de Pestaña',    precio: 900  },
  'cejas':          { duracion: 30,  nombre: 'Diseño de Cejas',         precio: 350  }
};

// ─── Helper: formatear fecha ───────────────────────────────────────────────
const formatearFecha = (fecha) => {
  const [year, month, day] = fecha.split('-').map(Number);
  const fechaObj = new Date(year, month - 1, day);
  return fechaObj.toLocaleDateString('es-MX', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    year:    'numeric'
  });
};

// ─── Helper: formatear teléfono para Whapi ────────────────────────────────
// Whapi usa formato: 521234567890@s.whatsapp.net
const formatearTelefonoWhapi = (telefono) => {
  let num = telefono.replace(/\D/g, '');
  if (num.length === 10) num = '52' + num; // Agregar código de país México
  return `${num}@s.whatsapp.net`;
};

// ─── Enviar mensaje por Whapi ─────────────────────────────────────────────
const enviarMensajeWhapi = async (telefono, mensaje) => {
  try {
    const to = formatearTelefonoWhapi(telefono);
    
    const response = await axios.post(
      `${WHAPI_BASE_URL}/messages/text`,
      {
        to,
        body: mensaje
      },
      {
        headers: {
          'Authorization': `Bearer ${WHAPI_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Mensaje Whapi enviado:', to);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Error enviando mensaje Whapi:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

// ─── WhatsApp: Notificación de nueva cita al salón ────────────────────────
export const notificarSalonNuevaCita = async (reserva) => {
  try {
    const info = serviceDurations[reserva.servicio];
    
    if (!info) {
      throw new Error(`Servicio no encontrado: ${reserva.servicio}`);
    }
    
    const fecha = formatearFecha(reserva.fecha);
    const salonPhone = process.env.SALON_PHONE_NUMBER || '3511270276';

    const mensaje =
      `🔔 *NUEVA CITA AGENDADA*\n\n` +
      `👤 *Cliente:* ${reserva.nombreCliente}\n` +
      `📱 *Teléfono:* ${reserva.telefonoCliente}\n` +
      `📅 *Fecha:* ${fecha}\n` +
      `⏰ *Hora:* ${reserva.horaInicio} - ${reserva.horaFin}\n` +
      `💅 *Servicio:* ${info.nombre}\n` +
      `💰 *Precio:* $${info.precio} MXN\n\n` +
      `📎 Evento agregado a Google Calendar ✅`;

    const resultado = await enviarMensajeWhapi(salonPhone, mensaje);
    
    if (resultado.success) {
      console.log('📨 Salón notificado por WhatsApp');
    }
    
    return resultado;
  } catch (error) {
    console.error('❌ Error notificando al salón:', error.message);
    return { success: false, error: error.message };
  }
};

// ─── WhatsApp: Confirmación de cita + encuesta ────────────────────────────
export const enviarConfirmacionCita = async (reserva) => {
  try {
    const info = serviceDurations[reserva.servicio];
    
    if (!info) {
      throw new Error(`Servicio no encontrado: ${reserva.servicio}`);
    }
    
    const fecha = formatearFecha(reserva.fecha);

    const mensaje =
      `Hola ${reserva.nombreCliente}! 🌸\n\n` +
      `✅ *Tu cita está confirmada*\n\n` +
      `📅 ${fecha}\n` +
      `⏰ ${reserva.horaInicio} - ${reserva.horaFin}\n` +
      `💅 ${info.nombre}\n` +
      `💰 $${info.precio} MXN\n\n` +
      `📍 Soumaya Beauty Bar\n\n` +
      `¡Te esperamos! 💖\n\n` +
      `─────────────────\n` +
      `¿Deseas cancelar tu cita?\n` +
      `Responde *Sí* o *No*`;

    const resultado = await enviarMensajeWhapi(reserva.telefonoCliente, mensaje);
    
    if (resultado.success) {
      console.log('✅ Confirmación enviada a cliente');
    }
    
    return resultado;
  } catch (error) {
    console.error('❌ Error enviando confirmación:', error.message);
    return { success: false, error: error.message };
  }
};

// ─── WhatsApp: Recordatorio de cita (cron diario) ─────────────────────────
export const enviarRecordatorio = async (telefono, nombreCliente, servicio, fecha, hora) => {
  try {
    const info = serviceDurations[servicio];
    
    if (!info) {
      throw new Error(`Servicio no encontrado: ${servicio}`);
    }
    
    const fechaTexto = formatearFecha(fecha);

    const mensaje =
      `⏰ *RECORDATORIO DE CITA*\n\n` +
      `Hola ${nombreCliente}! 🌸\n\n` +
      `Mañana tienes tu cita:\n\n` +
      `📅 ${fechaTexto}\n` +
      `⏰ ${hora}\n` +
      `💅 ${info.nombre}\n\n` +
      `¡No olvides asistir! 💖\n\n` +
      `─────────────────\n` +
      `¿Deseas cancelar tu cita?\n` +
      `Responde *Sí* o *No*\n\n` +
      `Soumaya Beauty Bar`;

    const resultado = await enviarMensajeWhapi(telefono, mensaje);
    
    if (resultado.success) {
      console.log('✅ Recordatorio enviado a:', telefono);
    }
    
    return resultado;
  } catch (error) {
    console.error('❌ Error enviando recordatorio:', error.message);
    return { success: false, error: error.message };
  }
};

// ─── WhatsApp: Confirmación de cancelación ────────────────────────────────
export const enviarConfirmacionCancelacion = async (reserva) => {
  try {
    const info = serviceDurations[reserva.servicio];
    const fecha = formatearFecha(reserva.fecha);
    const frontendUrl = process.env.FRONTEND_URL || 'https://soumaya-beauty-salon.vercel.app';

    const mensaje =
      `✅ *Tu cita ha sido cancelada*\n\n` +
      `${info.nombre} el ${fecha} a las ${reserva.horaInicio}\n\n` +
      `El evento fue eliminado de tu calendario.\n\n` +
      `¿Deseas reagendar?\n` +
      `Visita: ${frontendUrl}/reservaciones\n\n` +
      `Soumaya Beauty Bar 🌸`;

    return await enviarMensajeWhapi(reserva.telefonoCliente, mensaje);
  } catch (error) {
    console.error('❌ Error enviando confirmación de cancelación:', error.message);
    return { success: false, error: error.message };
  }
};

// ─── WhatsApp: Notificación de cancelación al salón ───────────────────────
export const notificarSalonCancelacion = async (reserva) => {
  try {
    const info = serviceDurations[reserva.servicio];
    const fecha = formatearFecha(reserva.fecha);
    const salonPhone = process.env.SALON_PHONE_NUMBER || '3511270276';

    const mensaje =
      `🔔 *CITA CANCELADA*\n\n` +
      `👤 *Cliente:* ${reserva.nombreCliente}\n` +
      `📱 *Teléfono:* ${reserva.telefonoCliente}\n` +
      `📅 *Fecha:* ${fecha}\n` +
      `⏰ *Hora:* ${reserva.horaInicio}\n` +
      `💅 *Servicio:* ${info.nombre}\n\n` +
      `El cliente canceló desde WhatsApp.\n` +
      `📎 Evento eliminado de Google Calendar ✅`;

    return await enviarMensajeWhapi(salonPhone, mensaje);
  } catch (error) {
    console.error('❌ Error notificando cancelación al salón:', error.message);
    return { success: false, error: error.message };
  }
};