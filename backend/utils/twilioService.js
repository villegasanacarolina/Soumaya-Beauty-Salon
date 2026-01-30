import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
const salonPhone = process.env.SALON_PHONE_NUMBER;

console.log('🔧 Twilio Config:', {
  sid: accountSid?.slice(0, 10),
  phone: twilioPhone,
  salon: salonPhone
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

const formatearTelefono = (tel) => {
  // Remover espacios y caracteres especiales
  let limpio = tel.replace(/\D/g, '');
  
  // Si empieza con 52 (México), agregar +
  if (limpio.startsWith('52')) {
    return `+${limpio}`;
  }
  
  // Si no tiene código de país, agregar +52
  if (limpio.length === 10) {
    return `+52${limpio}`;
  }
  
  // Si ya tiene +, dejarlo
  if (tel.startsWith('+')) {
    return tel;
  }
  
  return `+${limpio}`;
};

export const enviarConfirmacionCita = async (telefono, nombreCliente, servicio, fecha, hora) => {
  console.log('📱 ========== ENVÍO WHATSAPP ==========');
  
  try {
    const servicioInfo = serviceDurations[servicio];
    
    const [year, month, day] = fecha.split('-').map(Number);
    const fechaObj = new Date(year, month - 1, day);
    const fechaFormateada = fechaObj.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const mensajeCliente = `Hola ${nombreCliente}! 🌸

Tu cita en Soumaya Beauty Bar:

📅 ${fechaFormateada}
⏰ ${hora}
💅 ${servicioInfo.nombre}

¡Te esperamos! 💖`;

    const mensajeSalon = `🔔 Nueva cita

👤 ${nombreCliente}
📱 ${telefono}
📅 ${fechaFormateada}
⏰ ${hora}
💅 ${servicioInfo.nombre}`;

    const telCliente = formatearTelefono(telefono);
    const telSalon = formatearTelefono(salonPhone);

    console.log('📞 Cliente:', telCliente);
    console.log('📞 Salón:', telSalon);

    // Cliente
    const msg1 = await client.messages.create({
      body: mensajeCliente,
      from: `whatsapp:${twilioPhone}`,
      to: `whatsapp:${telCliente}`
    });
    console.log('✅ Cliente:', msg1.sid);

    // Salón
    const msg2 = await client.messages.create({
      body: mensajeSalon,
      from: `whatsapp:${twilioPhone}`,
      to: `whatsapp:${telSalon}`
    });
    console.log('✅ Salón:', msg2.sid);

    console.log('==========================================');
    return { success: true };
  } catch (error) {
    console.error('❌ ERROR:', error.code, error.message);
    console.error('==========================================');
    return { success: false };
  }
};

export const enviarRecordatorio = async (telefono, nombreCliente, servicio, fecha, hora) => {
  const servicioInfo = serviceDurations[servicio];
  
  const [year, month, day] = fecha.split('-').map(Number);
  const fechaObj = new Date(year, month - 1, day);
  const fechaFormateada = fechaObj.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  const mensaje = `⏰ RECORDATORIO

Mañana: ${fechaFormateada}
Hora: ${hora}
Servicio: ${servicioInfo.nombre}

¡No olvides asistir! 💖

Soumaya Beauty Bar`;

  try {
    const tel = formatearTelefono(telefono);
    
    await client.messages.create({
      body: mensaje,
      from: `whatsapp:${twilioPhone}`,
      to: `whatsapp:${tel}`
    });
    
    return { success: true };
  } catch (error) {
    console.error('❌ Recordatorio error:', error);
    return { success: false };
  }
};