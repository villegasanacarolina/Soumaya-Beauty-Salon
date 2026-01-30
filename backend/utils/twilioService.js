import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
const salonPhone = process.env.SALON_PHONE_NUMBER;

console.log('🔧 Configuración Twilio:', {
  accountSid: accountSid ? `${accountSid.slice(0, 10)}...` : 'NO CONFIGURADO',
  authToken: authToken ? 'CONFIGURADO' : 'NO CONFIGURADO',
  twilioPhone: twilioPhone || 'NO CONFIGURADO',
  salonPhone: salonPhone || 'NO CONFIGURADO'
});

const client = twilio(accountSid, authToken);

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
  try {
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

¡Te esperamos! 💖`;

    // Mensaje para el salón
    const mensajeSalon = `🔔 Nueva cita agendada

👤 Cliente: ${nombreCliente}
📱 Teléfono: ${telefono}
📅 Fecha: ${fechaFormateada}
⏰ Hora: ${hora}
💅 Servicio: ${servicioInfo.nombre}
⏱️ Duración: ${servicioInfo.duracion} minutos`;

    console.log('📤 Enviando WhatsApp...');
    console.log('Cliente:', telefono);
    console.log('Salón:', salonPhone);

    // Enviar al cliente
    const mensajeClienteEnviado = await client.messages.create({
      body: mensajeCliente,
      from: `whatsapp:${twilioPhone}`,
      to: `whatsapp:${telefono}`
    });
    
    console.log('✅ Mensaje enviado al cliente:', mensajeClienteEnviado.sid);

    // Enviar al salón
    const mensajeSalonEnviado = await client.messages.create({
      body: mensajeSalon,
      from: `whatsapp:${twilioPhone}`,
      to: `whatsapp:${salonPhone}`
    });
    
    console.log('✅ Mensaje enviado al salón:', mensajeSalonEnviado.sid);

    return { success: true };
  } catch (error) {
    console.error('❌ Error completo Twilio:', error);
    console.error('Código:', error.code);
    console.error('Mensaje:', error.message);
    console.error('Detalles:', error.moreInfo);
    throw error;
  }
};

export const enviarRecordatorio = async (telefono, nombreCliente, servicio, fecha, hora) => {
  const servicioInfo = serviceDurations[servicio];
  
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

¡No olvides asistir! 💖`;

  try {
    await client.messages.create({
      body: mensaje,
      from: `whatsapp:${twilioPhone}`,
      to: `whatsapp:${telefono}`
    });
    console.log('✅ Recordatorio enviado');
    return { success: true };
  } catch (error) {
    console.error('❌ Error enviando recordatorio:', error);
    throw error;
  }
};