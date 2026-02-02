import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const SALON_PHONE   = process.env.SALON_PHONE_NUMBER || '+523511270276';
const FRONTEND_URL  = process.env.FRONTEND_URL || 'https://soumaya-beauty-salon.vercel.app';

export const serviceDurations = {
  'unas-gel':       { duracion: 60,  nombre: 'Uñas de Gel',              precio: 450  },
  'unas-acrilicas': { duracion: 90,  nombre: 'Uñas Acrílicas',           precio: 600  },
  'pedicure':       { duracion: 90,  nombre: 'Pedicure Premium',         precio: 500  },
  'keratina':       { duracion: 180, nombre: 'Tratamiento de Keratina',  precio: 1200 },
  'tinte':          { duracion: 180, nombre: 'Tinte Profesional',        precio: 800  },
  'pestanas':       { duracion: 60,  nombre: 'Extensión de Pestañas',    precio: 900  },
  'cejas':          { duracion: 30,  nombre: 'Diseño de Cejas',          precio: 350  }
};

// ─── Helper: formatear fecha ──────────────────────────────────────────────
const formatearFecha = (fecha) => {
  const [year, month, day] = fecha.split('-').map(Number);
  const fechaObj = new Date(year, month - 1, day);
  return fechaObj.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// ─── Helper: formatear teléfono con código de país ────────────────────────
const formatearTelefono = (telefono) => {
  let num = telefono.replace(/\D/g, '');
  if (num.length === 10) num = '52' + num;
  return `+${num}`;
};

// ─── SMS: Confirmación automática + encuesta de cancelación ───────────────
// Se envía automáticamente al crear la reserva.
// Al final incluye la pregunta: ¿Desea cancelar su cita? Responde Sí o No
export const enviarConfirmacionSMS = async (reserva) => {
  try {
    const info     = serviceDurations[reserva.servicio];
    const fecha    = formatearFecha(reserva.fecha);
    const telefono = formatearTelefono(reserva.telefonoCliente);

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
      `Responde Sí o No`;

    await client.messages.create({
      body: mensaje,
      from: SALON_PHONE,
      to: telefono
    });

    console.log('✅ SMS de confirmación + encuesta enviado a:', telefono);
    return { success: true };
  } catch (error) {
    console.error('❌ Error enviando SMS de confirmación:', error.message);
    return { success: false };
  }
};

// ─── SMS: Confirmación de cancelación + pregunta de reagendar ─────────────
// Se envía automáticamente cuando la clienta responde "Sí" a la encuesta.
export const enviarSMSCancelado = async (reserva) => {
  try {
    const fecha    = formatearFecha(reserva.fecha);
    const telefono = formatearTelefono(reserva.telefonoCliente);
    const servicio = serviceDurations[reserva.servicio];

    const mensaje =
      `✅ Tu cita de ${servicio.nombre} el ${fecha} a las ${reserva.horaInicio} ha sido cancelada.\n\n` +
      `─────────────────\n` +
      `¿Desea reagendar una nueva cita? 🌸\n` +
      `Responde Sí o No`;

    await client.messages.create({
      body: mensaje,
      from: SALON_PHONE,
      to: telefono
    });

    console.log('✅ SMS de cancelación + pregunta reagendar enviado a:', telefono);
    return { success: true };
  } catch (error) {
    console.error('❌ Error enviando SMS de cancelación:', error.message);
    return { success: false };
  }
};

// ─── SMS: Enlace para reagendar ────────────────────────────────────────────
// Se envía cuando la clienta responde "Sí" a la pregunta de reagendar.
export const enviarEnlaceReagendar = async (telefono) => {
  try {
    const tel = formatearTelefono(telefono);
    const reagendarURL = `${FRONTEND_URL}/reservaciones`;

    const mensaje =
      `¡Genial! 🌸\n\n` +
      `Abre el siguiente enlace para agendar tu nueva cita:\n\n` +
      `${reagendarURL}\n\n` +
      `Selecciona el horario que prefieras. ¡Te esperamos! 💖`;

    await client.messages.create({
      body: mensaje,
      from: SALON_PHONE,
      to: tel
    });

    console.log('✅ Enlace de reagendamiento enviado a:', tel);
    return { success: true };
  } catch (error) {
    console.error('❌ Error enviando enlace de reagendar:', error.message);
    return { success: false };
  }
};

// ─── SMS: Notificación al salón (nueva cita) ──────────────────────────────
export const notificarSalon = async (reserva) => {
  try {
    const info  = serviceDurations[reserva.servicio];
    const fecha = formatearFecha(reserva.fecha);

    const mensaje =
      `🔔 NUEVA CITA AGENDADA\n\n` +
      `👤 Cliente: ${reserva.nombreCliente}\n` +
      `📱 Teléfono: ${reserva.telefonoCliente}\n` +
      `📅 Fecha: ${fecha}\n` +
      `⏰ Hora: ${reserva.horaInicio} - ${reserva.horaFin}\n` +
      `💅 Servicio: ${info.nombre}\n` +
      `💰 Precio: $${info.precio} MXN`;

    await client.messages.create({
      body: mensaje,
      from: SALON_PHONE,
      to: SALON_PHONE
    });

    console.log('✅ Notificación enviada al salón');
    return { success: true };
  } catch (error) {
    console.error('❌ Error notificando al salón:', error.message);
    return { success: false };
  }
};

// ─── SMS: Notificación al salón (cita cancelada) ──────────────────────────
export const notificarSalonCancelacion = async (reserva) => {
  try {
    const info  = serviceDurations[reserva.servicio];
    const fecha = formatearFecha(reserva.fecha);

    const mensaje =
      `🔔 CITA CANCELADA\n\n` +
      `👤 Cliente: ${reserva.nombreCliente}\n` +
      `📱 Teléfono: ${reserva.telefonoCliente}\n` +
      `📅 Fecha: ${fecha}\n` +
      `⏰ Hora: ${reserva.horaInicio}\n` +
      `💅 Servicio: ${info.nombre}\n\n` +
      `El cliente canceló desde SMS (encuesta).`;

    await client.messages.create({
      body: mensaje,
      from: SALON_PHONE,
      to: SALON_PHONE
    });

    console.log('✅ Notificación de cancelación enviada al salón');
    return { success: true };
  } catch (error) {
    console.error('❌ Error notificando cancelación al salón:', error.message);
    return { success: false };
  }
};

// ─── SMS: Recordatorio diario (cron) ──────────────────────────────────────
export const enviarRecordatorio = async (telefono, nombreCliente, servicio, fecha, hora) => {
  try {
    const info       = serviceDurations[servicio];
    const fechaTexto = formatearFecha(fecha);
    const tel        = formatearTelefono(telefono);

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
      from: SALON_PHONE,
      to: tel
    });

    console.log('✅ Recordatorio enviado a:', telefono);
    return { success: true };
  } catch (error) {
    console.error('❌ Error recordatorio:', error.message);
    return { success: false };
  }
};