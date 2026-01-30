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
  
  // Formatear fecha
  const [year, month, day] = fecha.split('-').map(Number);
  const fechaObj = new Date(year, month - 1, day);
  const fechaFormateada = fechaObj.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Mensaje para el cliente
  const mensajeCliente = `Hola ${nombreCliente}! 🌸

¡Tu cita en Soumaya Beauty Bar ha sido confirmada!

📅 Fecha: ${fechaFormateada}
⏰ Hora: ${hora}
💅 Servicio: ${servicioInfo.nombre}
⏱️ Duración: ${servicioInfo.duracion} minutos

¡Te esperamos! 💖

Si necesitas cancelar o reprogramar, por favor contáctanos con anticipación.`;

  // Mensaje para el salón
  const mensajeSalon = `🔔 Nueva cita agendada

👤 Cliente: ${nombreCliente}
📱 Teléfono: ${telefono}
📅 Fecha: ${fechaFormateada}
⏰ Hora: ${hora}
💅 Servicio: ${servicioInfo.nombre}
⏱️ Duración: ${servicioInfo.duracion} minutos`;

  try {
    // Enviar mensaje al cliente
    console.log('📤 Enviando WhatsApp al cliente:', telefono);
    await client.messages.create({
      body: mensajeCliente,
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:${telefono}`
    });
    console.log('✅ Mensaje enviado al cliente');

    // Enviar mensaje al salón
    console.log('📤 Enviando WhatsApp al salón:', process.env.SALON_PHONE_NUMBER);
    await client.messages.create({
      body: mensajeSalon,
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:${process.env.SALON_PHONE_NUMBER}`
    });
    console.log('✅ Mensaje enviado al salón');

    return { success: true };
  } catch (error) {
    console.error('❌ Error enviando WhatsApp:', error.message);
    console.error('Detalles:', error);
    throw error;
  }
};

export const enviarRecordatorio = async (telefono, nombreCliente, servicio, fecha, hora) => {
  const servicioInfo = serviceDurations[servicio];
  
  // Formatear fecha
  const [year, month, day] = fecha.split('-').map(Number);
  const fechaObj = new Date(year, month - 1, day);
  const fechaFormateada = fechaObj.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const mensaje = `Hola ${nombreCliente}! 🌸

⏰ RECORDATORIO

Mañana tienes tu cita en Soumaya Beauty Bar:

📅 ${fechaFormateada}
⏰ ${hora}
💅 ${servicioInfo.nombre}

¡No olvides asistir! Si necesitas reagendar, contáctanos. 💖`;

  try {
    await client.messages.create({
      body: mensaje,
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:${telefono}`
    });
    console.log('✅ Recordatorio enviado a:', telefono);
    return { success: true };
  } catch (error) {
    console.error('❌ Error enviando recordatorio:', error);
    throw error;
  }
};