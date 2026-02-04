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
const formatearTelefonoWhapi = (telefono) => {
  let num = telefono.replace(/\D/g, '');
  
  // Si ya tiene código de país, mantenerlo
  if (!num.startsWith('52') && num.length === 10) {
    num = '52' + num; // Agregar código de país México
  }
  
  return `${num}@s.whatsapp.net`;
};

// ─── Enviar mensaje por Whapi ─────────────────────────────────────────────
export const enviarMensajeWhapi = async (telefono, mensaje) => {
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
        },
        timeout: 10000 // 10 segundos timeout
      }
    );

    console.log('✅ Mensaje Whapi enviado AUTOMÁTICAMENTE a:', to);
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
    const telefonoMatch = from.match(/\d+/g);
    if (!telefonoMatch) return null;
    
    const telefonoCompleto = telefonoMatch.join('');
    let telefono = telefonoCompleto;
    if (telefonoCompleto.startsWith('52') && telefonoCompleto.length === 12) {
      telefono = telefonoCompleto.slice(2);
    }
    
    const texto = mensaje.text?.body?.toLowerCase().trim() || '';
    
    const afirmativos = ['si', 'sí', 'yes', 'confirmo', 'acepto', 'ok', 'dale', 'quiero cancelar', 'cancelar'];
    const negativos = ['no', 'nop', 'mantener', 'no quiero cancelar', 'seguir', 'mantengo'];
    
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
      `🌸 *NUEVA CITA AGENDADA - SOUMAYA BEAUTY BAR* 🌸\n\n` +
      `👤 *Cliente:* ${reserva.nombreCliente}\n` +
      `📱 *Teléfono:* ${reserva.telefonoCliente}\n` +
      `📅 *Fecha:* ${fecha}\n` +
      `⏰ *Hora:* ${reserva.horaInicio} - ${reserva.horaFin}\n` +
      `💅 *Servicio:* ${info.nombre}\n` +
      `💰 *Precio:* $${info.precio} MXN\n` +
      `🆔 *ID Reserva:* ${reserva._id}\n\n` +
      `📍 *Ubicación:* Soumaya Beauty Bar\n\n` +
      `✅ *CITA CONFIRMADA AUTOMÁTICAMENTE*\n` +
      `📎 *Google Calendar:* Evento creado\n` +
      `📲 *WhatsApp:* Confirmación enviada al cliente\n\n` +
      `_El horario ya aparece como OCUPADO en el sistema._`;

    const resultado = await enviarMensajeWhapi(salonPhone, mensaje);
    
    if (resultado.success) {
      console.log('📨 Salón notificado AUTOMÁTICAMENTE:', salonPhone);
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
      `✅ *TU CITA HA SIDO CONFIRMADA EXITOSAMENTE*\n\n` +
      `📅 *Fecha:* ${fecha}\n` +
      `⏰ *Hora:* ${reserva.horaInicio} - ${reserva.horaFin}\n` +
      `💅 *Servicio:* ${info.nombre}\n` +
      `💰 *Precio:* $${info.precio} MXN\n\n` +
      `📍 *Ubicación:* Soumaya Beauty Bar\n\n` +
      `*¡Te esperamos!* 💖\n\n` +
      `─────────────────\n` +
      `*¿Necesitas cancelar o modificar tu cita?*\n\n` +
      `Responde *SÍ* para cancelar\n` +
      `Responde *NO* para mantenerla\n\n` +
      `También puedes gestionar tu cita aquí:\n` +
      `${frontendUrl}/reservaciones\n\n` +
      `_Este mensaje fue enviado AUTOMÁTICAMENTE por nuestro sistema._`;

    const resultado = await enviarMensajeWhapi(reserva.telefonoCliente, mensaje);
    
    if (resultado.success) {
      console.log('✅ Confirmación AUTOMÁTICA enviada a cliente:', reserva.telefonoCliente);
    }
    
    return resultado;
  } catch (error) {
    console.error('❌ Error enviando confirmación AUTOMÁTICA:', error.message);
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
      `_Este es un mensaje automático de recordatorio_`;

    const resultado = await enviarMensajeWhapi(telefono, mensaje);
    
    if (resultado.success) {
      console.log('✅ Recordatorio AUTOMÁTICO enviado a:', telefono);
    }
    
    return resultado;
  } catch (error) {
    console.error('❌ Error enviando recordatorio AUTOMÁTICO:', error.message);
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
      `*✅ El evento fue eliminado de Google Calendar*\n` +
      `*✅ El horario ahora está disponible para nuevas citas*\n\n` +
      `¿Deseas reagendar? Puedes hacerlo fácilmente:\n` +
      `${frontendUrl}/reservaciones\n\n` +
      `¡Esperamos verte pronto! 🌸\n\n` +
      `_Este es un mensaje automático de confirmación_`;

    const resultado = await enviarMensajeWhapi(reserva.telefonoCliente, mensaje);
    
    if (resultado.success) {
      console.log('✅ Confirmación de cancelación AUTOMÁTICA enviada:', reserva.telefonoCliente);
    }
    
    return resultado;
  } catch (error) {
    console.error('❌ Error enviando confirmación de cancelación AUTOMÁTICA:', error.message);
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
      `🔔 *CITA CANCELADA - SOUMAYA BEAUTY BAR* 🔔\n\n` +
      `👤 *Cliente:* ${reserva.nombreCliente}\n` +
      `📱 *Teléfono:* ${reserva.telefonoCliente}\n` +
      `📅 *Fecha:* ${fecha}\n` +
      `⏰ *Hora:* ${reserva.horaInicio}\n` +
      `💅 *Servicio:* ${info.nombre}\n` +
      `🆔 *ID Reserva:* ${reserva._id}\n\n` +
      `*Motivo:* Cancelación solicitada por cliente\n\n` +
      `✅ *Evento eliminado de Google Calendar*\n` +
      `✅ *Horario liberado en el sistema*\n` +
      `✅ *Cliente notificado automáticamente*\n\n` +
      `_El horario ahora aparece como DISPONIBLE para nuevos clientes._`;

    const resultado = await enviarMensajeWhapi(salonPhone, mensaje);
    
    if (resultado.success) {
      console.log('✅ Salón notificado AUTOMÁTICAMENTE de cancelación:', salonPhone);
    }
    
    return resultado;
  } catch (error) {
    console.error('❌ Error notificando cancelación al salón:', error.message);
    return { success: false, error: error.message };
  }
};

// ─── Enviar mensaje personalizado (para pruebas) ──────────────────────────
export const enviarMensajePersonalizado = async (telefono, nombre, servicio, fecha, hora) => {
  try {
    const info = serviceDurations[servicio];
    if (!info) throw new Error('Servicio no encontrado');
    
    const fechaTexto = formatearFecha(fecha);
    
    const mensaje =
      `🌸 *SOUMAYA BEAUTY BAR* 🌸\n\n` +
      `Hola ${nombre}!\n\n` +
      `Este es un mensaje de prueba para confirmar\n` +
      `que nuestro sistema de WhatsApp está funcionando.\n\n` +
      `📅 ${fechaTexto}\n` +
      `⏰ ${hora}\n` +
      `💅 ${info.nombre}\n\n` +
      `¡Gracias por confiar en nosotros! 💖`;
    
    return await enviarMensajeWhapi(telefono, mensaje);
  } catch (error) {
    console.error('❌ Error enviando mensaje personalizado:', error);
    return { success: false, error: error.message };
  }
};