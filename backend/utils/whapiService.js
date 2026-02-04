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
  
  // Si ya tiene código de país, mantenerlo
  if (!num.startsWith('52') && num.length === 10) {
    num = '52' + num; // Agregar código de país México
  }
  
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

    console.log('✅ Mensaje Whapi enviado a:', to);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Error enviando mensaje Whapi:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

// ─── Helper: Procesar mensaje entrante de Whapi ────────────────────────────
export const procesarMensajeEntrante = async (mensaje) => {
  try {
    // Extraer teléfono del remitente
    const from = mensaje.from;
    // Formato: 521234567890@s.whatsapp.net → extraer solo números
    const telefonoMatch = from.match(/\d+/g);
    if (!telefonoMatch) return null;
    
    const telefonoCompleto = telefonoMatch.join('');
    // Quitar código de país si es necesario (52 para México)
    let telefono = telefonoCompleto;
    if (telefonoCompleto.startsWith('52') && telefonoCompleto.length === 12) {
      telefono = telefonoCompleto.slice(2); // Quitar el 52
    }
    
    // Extraer texto del mensaje
    const texto = mensaje.text?.body?.toLowerCase().trim() || '';
    
    // Determinar si es afirmativo o negativo
    const afirmativos = ['si', 'sí', 'yes', 'confirmo', 'acepto', 'ok', 'dale', 'quiero cancelar'];
    const negativos = ['no', 'nop', 'mantener', 'no quiero cancelar', 'seguir'];
    
    const esAfirmativo = afirmativos.some(palabra => texto.includes(palabra));
    const esNegativo = negativos.some(palabra => texto.includes(palabra));
    
    return {
      telefono,
      texto,
      esAfirmativo,
      esNegativo
    };
  } catch (error) {
    console.error('❌ Error procesando mensaje:', error);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONES EXPORTADAS
// ═══════════════════════════════════════════════════════════════════════════

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
      `💰 *Precio:* $${info.precio} MXN\n` +
      `🆔 *ID Reserva:* ${reserva._id}\n\n` +
      `📎 Evento agregado a Google Calendar ✅\n\n` +
      `_Para cancelar, contacta al cliente directamente._`;

    const resultado = await enviarMensajeWhapi(salonPhone, mensaje);
    
    if (resultado.success) {
      console.log('📨 Salón notificado por WhatsApp:', salonPhone);
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
    const frontendUrl = process.env.FRONTEND_URL || 'https://soumaya-beauty-salon.vercel.app';

    const mensaje =
      `🌸 *SOUMAYA BEAUTY BAR* 🌸\n\n` +
      `Hola ${reserva.nombreCliente}!\n\n` +
      `✅ *TU CITA HA SIDO CONFIRMADA*\n\n` +
      `📅 *Fecha:* ${fecha}\n` +
      `⏰ *Hora:* ${reserva.horaInicio} - ${reserva.horaFin}\n` +
      `💅 *Servicio:* ${info.nombre}\n` +
      `💰 *Precio:* $${info.precio} MXN\n\n` +
      `📍 *Ubicación:* Soumaya Beauty Bar\n\n` +
      `¡Te esperamos! 💖\n\n` +
      `─────────────────\n` +
      `*¿Deseas cancelar o modificar tu cita?*\n\n` +
      `Responde *SÍ* para cancelar\n` +
      `Responde *NO* para mantenerla\n\n` +
      `También puedes gestionar tu cita aquí:\n` +
      `${frontendUrl}/reservaciones`;

    const resultado = await enviarMensajeWhapi(reserva.telefonoCliente, mensaje);
    
    if (resultado.success) {
      console.log('✅ Confirmación enviada a cliente:', reserva.telefonoCliente);
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
    const frontendUrl = process.env.FRONTEND_URL || 'https://soumaya-beauty-salon.vercel.app';

    const mensaje =
      `⏰ *RECORDATORIO DE CITA - SOUMAYA BEAUTY BAR* ⏰\n\n` +
      `Hola ${nombreCliente}! 🌸\n\n` +
      `Te recordamos que *MAÑANA* tienes tu cita:\n\n` +
      `📅 *Fecha:* ${fechaTexto}\n` +
      `⏰ *Hora:* ${hora}\n` +
      `💅 *Servicio:* ${info.nombre}\n` +
      `💰 *Precio:* $${info.precio} MXN\n\n` +
      `📍 *Ubicación:* Soumaya Beauty Bar\n\n` +
      `*¡No olvides asistir!* 💖\n\n` +
      `─────────────────\n` +
      `*¿Necesitas cancelar o modificar?*\n\n` +
      `Responde *SÍ* para cancelar\n` +
      `Responde *NO* para mantenerla\n\n` +
      `También puedes gestionar tu cita aquí:\n` +
      `${frontendUrl}/reservaciones\n\n` +
      `_Este es un mensaje automático_`;

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

// ─── WhatsApp: Confirmación de cancelación ─────────────────
export const enviarMensajeCancelacionConfirmada = async (reserva) => {
  try {
    const info = serviceDurations[reserva.servicio];
    
    if (!info) {
      throw new Error(`Servicio no encontrado: ${reserva.servicio}`);
    }
    
    const fecha = formatearFecha(reserva.fecha);
    const frontendUrl = process.env.FRONTEND_URL || 'https://soumaya-beauty-salon.vercel.app';

    const mensaje =
      `✅ *CITA CANCELADA - SOUMAYA BEAUTY BAR* ✅\n\n` +
      `Hola ${reserva.nombreCliente},\n\n` +
      `Tu cita ha sido cancelada exitosamente:\n\n` +
      `💅 *Servicio:* ${info.nombre}\n` +
      `📅 *Fecha:* ${fecha}\n` +
      `⏰ *Hora:* ${reserva.horaInicio}\n\n` +
      `*El evento ha sido eliminado de nuestro calendario.*\n\n` +
      `¿Deseas reagendar? Puedes hacerlo fácilmente:\n` +
      `${frontendUrl}/reservaciones\n\n` +
      `¡Esperamos verte pronto! 🌸\n\n` +
      `_Este es un mensaje automático_`;

    const resultado = await enviarMensajeWhapi(reserva.telefonoCliente, mensaje);
    
    if (resultado.success) {
      console.log('✅ Confirmación de cancelación enviada:', reserva.telefonoCliente);
    }
    
    return resultado;
  } catch (error) {
    console.error('❌ Error enviando confirmación de cancelación:', error.message);
    return { success: false, error: error.message };
  }
};

// ─── WhatsApp: Notificación de cancelación al salón ───────────────────────
export const notificarSalonCancelacion = async (reserva) => {
  try {
    const info = serviceDurations[reserva.servicio];
    
    if (!info) {
      throw new Error(`Servicio no encontrado: ${reserva.servicio}`);
    }
    
    const fecha = formatearFecha(reserva.fecha);
    const salonPhone = process.env.SALON_PHONE_NUMBER || '3511270276';

    const mensaje =
      `🔔 *CITA CANCELADA*\n\n` +
      `👤 *Cliente:* ${reserva.nombreCliente}\n` +
      `📱 *Teléfono:* ${reserva.telefonoCliente}\n` +
      `📅 *Fecha:* ${fecha}\n` +
      `⏰ *Hora:* ${reserva.horaInicio}\n` +
      `💅 *Servicio:* ${info.nombre}\n` +
      `🆔 *ID Reserva:* ${reserva._id}\n\n` +
      `*Motivo:* Cancelación solicitada por WhatsApp\n\n` +
      `📎 Evento eliminado de Google Calendar ✅\n\n` +
      `_El cliente fue notificado automáticamente._`;

    const resultado = await enviarMensajeWhapi(salonPhone, mensaje);
    
    if (resultado.success) {
      console.log('✅ Salón notificado de cancelación:', salonPhone);
    }
    
    return resultado;
  } catch (error) {
    console.error('❌ Error notificando cancelación al salón:', error.message);
    return { success: false, error: error.message };
  }
};