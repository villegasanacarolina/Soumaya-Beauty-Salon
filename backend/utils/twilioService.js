import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const serviceDurations = {
  'unas-gel': { duracion: 60, nombre: 'Uñas de Gel' },
  'unas-acrilicas': { duracion: 90, nombre: 'Uñas Acrílicas' },
  'pedicure': { duracion: 90, nombre: 'Pedicure Premium' },
  'keratina': { duracion: 180, nombre: 'Tratamiento de Keratina' },
  'tinte': { duracion: 180, nombre: 'Tinte Profesional' },
  'pestanas': { duracion: 60, nombre: 'Extensión de Pestañas' },
  'cejas': { duracion: 30, nombre: 'Diseño de Cejas' }
};

export const enviarConfirmacionCita = async (telefono, nombreCliente, servicio, fecha, hora) => {
  const servicioInfo = serviceDurations[servicio];
  const fechaFormateada = new Date(fecha).toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const mensaje = `Hola ${nombreCliente}! 🌸\n\nTu cita en Soumaya Beauty Bar ha sido confirmada:\n\n📅 Fecha: ${fechaFormateada}\n⏰ Hora: ${hora}\n💅 Servicio: ${servicioInfo.nombre}\n⏱️ Duración: ${servicioInfo.duracion} min\n\n¡Te esperamos! 💖`;

  try {
    await client.messages.create({
      body: mensaje,
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:${telefono}`
    });

    const mensajeSalon = `Nueva cita agendada:\n\n👤 Cliente: ${nombreCliente}\n📱 Teléfono: ${telefono}\n📅 ${fechaFormateada}\n⏰ ${hora}\n💅 ${servicioInfo.nombre}`;
    
    await client.messages.create({
      body: mensajeSalon,
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:${process.env.SALON_PHONE_NUMBER}`
    });

    console.log('✅ Mensajes de confirmación enviados');
    return true;
  } catch (error) {
    console.error('❌ Error enviando WhatsApp:', error);
    throw error;
  }
};

export const enviarRecordatorio = async (telefono, nombreCliente, servicio, fecha, hora) => {
  const servicioInfo = serviceDurations[servicio];
  const fechaFormateada = new Date(fecha).toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const mensaje = `Hola ${nombreCliente}! 🌸\n\n⏰ RECORDATORIO\n\nMañana tienes tu cita en Soumaya Beauty Bar:\n\n📅 ${fechaFormateada}\n⏰ ${hora}\n💅 ${servicioInfo.nombre}\n\n¡No olvides asistir! Si necesitas reagendar, contáctanos. 💖`;

  try {
    await client.messages.create({
      body: mensaje,
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:${telefono}`
    });
    console.log('✅ Recordatorio enviado');
    return true;
  } catch (error) {
    console.error('❌ Error enviando recordatorio:', error);
    throw error;
  }
};