import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ─── Números y URLs ────────────────────────────────────────────────────────
// SANDBOX: usa +14155238886 (número compartido de Twilio para testing)
// PRODUCCIÓN: cuando registres tu propio WhatsApp Sender, cambia a tu número
const WHATSAPP_FROM   = process.env.WHATSAPP_FROM || 'whatsapp:+14155238886';
const FRONTEND_URL    = process.env.FRONTEND_URL  || 'https://soumaya-beauty-salon.vercel.app';

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

// ─── Helper: formatear teléfono con prefijo whatsapp: ─────────────────────
const formatearWhatsapp = (telefono) => {
  let num = telefono.replace(/\D/g, '');
  if (num.length === 10) num = '52' + num;
  return `whatsapp:+${num}`;
};

// ─── Generar deep link para que la clienta abra WhatsApp prellenado ────────
// Este link abre la app de WhatsApp con el número del sandbox y el mensaje
// "join <keyword>" ya prellenado. Al enviarlo, la clienta se conecta al sandbox
// y Twilio puede enviarle mensajes.
//
// Formato: https://api.whatsapp.com/send?phone=<sandbox_number>&text=<join_keyword>
export const generarWhatsappDeepLink = () => {
  const sandboxNumber = process.env.WHATSAPP_SANDBOX_NUMBER || '14155238886';
  const sandboxKeyword = process.env.WHATSAPP_SANDBOX_KEYWORD || 'join valley-rhyme';

  const encodedText = encodeURIComponent(sandboxKeyword);
  return `https://api.whatsapp.com/send?phone=${sandboxNumber}&text=${encodedText}`;
};

// ─── WhatsApp: Confirmación automática + encuesta de cancelación ───────────
// Se envía DESPUÉS de que la clienta se conecte al sandbox (webhook confirma esto)
export const enviarConfirmacionWhatsApp = async (reserva) => {
  try {
    const info     = serviceDurations[reserva.servicio];
    const fecha    = formatearFecha(reserva.fecha);
    const destino  = formatearWhatsapp(reserva.telefonoCliente);

    const mensaje =
      `Hola ${reserva.nombreCliente}! 🌸\n\n` +
      `✅ Tu cita está confirmada\n\n` +
      `📅 ${fecha}\n` +
      `⏰ ${reserva.horaInicio} - ${reserva.horaFin}\n` +
      `💅 ${info.nombre}\n` +
      `💰 $${info.precio} MXN\n\n` +
      `📍 Soumaya Beauty Bar\n\n` +
      `¡Te esperamos! 💖\n\n` +
      `─────────────────\n` +
      `¿Desea cancelar su cita?\n` +
      `Responde *Sí* o *No*`;

    await client.messages.create({
      body: mensaje,
      from: WHATSAPP_FROM,
      to:   destino
    });

    console.log('✅ WhatsApp de confirmación + encuesta enviado a:', destino);
    return { success: true };
  } catch (error) {
    console.error('❌ Error enviando WhatsApp de confirmación:', error.message);
    return { success: false, error: error.message };
  }
};

// ─── WhatsApp: Confirmación de cancelación + pregunta de reagendar ─────────
export const enviarWhatsAppCancelado = async (reserva) => {
  try {
    const fecha   = formatearFecha(reserva.fecha);
    const destino = formatearWhatsapp(reserva.telefonoCliente);
    const info    = serviceDurations[reserva.servicio];

    const mensaje =
      `✅ Tu cita de ${info.nombre} el ${fecha} a las ${reserva.horaInicio} ha sido cancelada.\n\n` +
      `El evento también fue eliminado de tu calendario.\n\n` +
      `─────────────────\n` +
      `¿Desea reagendar una nueva cita? 🌸\n` +
      `Responde *Sí* o *No*`;

    await client.messages.create({
      body: mensaje,
      from: WHATSAPP_FROM,
      to:   destino
    });

    console.log('✅ WhatsApp de cancelación + pregunta reagendar enviado');
    return { success: true };
  } catch (error) {
    console.error('❌ Error enviando WhatsApp de cancelación:', error.message);
    return { success: false, error: error.message };
  }
};

// ─── WhatsApp: Enlace para reagendar ───────────────────────────────────────
export const enviarEnlaceReagendar = async (telefono) => {
  try {
    const destino     = formatearWhatsapp(telefono);
    const reagendarURL = `${FRONTEND_URL}/reservaciones`;

    const mensaje =
      `¡Genial! 🌸\n\n` +
      `Abre el siguiente enlace para agendar tu nueva cita:\n\n` +
      `${reagendarURL}\n\n` +
      `Selecciona el horario que prefieras. ¡Te esperamos! 💖`;

    await client.messages.create({
      body: mensaje,
      from: WHATSAPP_FROM,
      to:   destino
    });

    console.log('✅ Enlace de reagendamiento enviado');
    return { success: true };
  } catch (error) {
    console.error('❌ Error enviando enlace de reagendar:', error.message);
    return { success: false, error: error.message };
  }
};

// ─── WhatsApp: Notificación al salón (nueva cita) ─────────────────────────
export const notificarSalon = async (reserva) => {
  try {
    const info  = serviceDurations[reserva.servicio];
    const fecha = formatearFecha(reserva.fecha);
    const salonWhatsapp = formatearWhatsapp(
      process.env.SALON_PHONE_NUMBER || '3511270276'
    );

    const mensaje =
      `🔔 NUEVA CITA AGENDADA\n\n` +
      `👤 Cliente: ${reserva.nombreCliente}\n` +
      `📱 Teléfono: ${reserva.telefonoCliente}\n` +
      `📅 Fecha: ${fecha}\n` +
      `⏰ Hora: ${reserva.horaInicio} - ${reserva.horaFin}\n` +
      `💅 Servicio: ${info.nombre}\n` +
      `💰 Precio: $${info.precio} MXN\n\n` +
      `📎 Evento agregado a Google Calendar ✅`;

    await client.messages.create({
      body: mensaje,
      from: WHATSAPP_FROM,
      to:   salonWhatsapp
    });

    console.log('✅ Notificación enviada al salón');
    return { success: true };
  } catch (error) {
    console.error('❌ Error notificando al salón:', error.message);
    return { success: false, error: error.message };
  }
};

// ─── WhatsApp: Notificación al salón (cita cancelada) ─────────────────────
export const notificarSalonCancelacion = async (reserva) => {
  try {
    const info  = serviceDurations[reserva.servicio];
    const fecha = formatearFecha(reserva.fecha);
    const salonWhatsapp = formatearWhatsapp(
      process.env.SALON_PHONE_NUMBER || '3511270276'
    );

    const mensaje =
      `🔔 CITA CANCELADA\n\n` +
      `👤 Cliente: ${reserva.nombreCliente}\n` +
      `📱 Teléfono: ${reserva.telefonoCliente}\n` +
      `📅 Fecha: ${fecha}\n` +
      `⏰ Hora: ${reserva.horaInicio}\n` +
      `💅 Servicio: ${info.nombre}\n\n` +
      `El cliente canceló desde WhatsApp (encuesta).\n` +
      `📎 Evento eliminado de Google Calendar ✅`;

    await client.messages.create({
      body: mensaje,
      from: WHATSAPP_FROM,
      to:   salonWhatsapp
    });

    console.log('✅ Notificación de cancelación enviada al salón');
    return { success: true };
  } catch (error) {
    console.error('❌ Error notificando cancelación al salón:', error.message);
    return { success: false, error: error.message };
  }
};

// ─── WhatsApp: Recordatorio diario (cron) ─────────────────────────────────
export const enviarRecordatorio = async (telefono, nombreCliente, servicio, fecha, hora) => {
  try {
    const info       = serviceDurations[servicio];
    const fechaTexto = formatearFecha(fecha);
    const destino    = formatearWhatsapp(telefono);

    const mensaje =
      `⏰ RECORDATORIO DE CITA\n\n` +
      `Hola ${nombreCliente}! 🌸\n\n` +
      `Mañana tienes tu cita:\n\n` +
      `📅 ${fechaTexto}\n` +
      `⏰ ${hora}\n` +
      `💅 ${info.nombre}\n\n` +
      `¡No olvides asistir! 💖\n\n` +
      `Soumaya Beauty Bar`;

    await client.messages.create({
      body: mensaje,
      from: WHATSAPP_FROM,
      to:   destino
    });

    console.log('✅ Recordatorio enviado a:', telefono);
    return { success: true };
  } catch (error) {
    console.error('❌ Error recordatorio:', error.message);
    return { success: false, error: error.message };
  }
};