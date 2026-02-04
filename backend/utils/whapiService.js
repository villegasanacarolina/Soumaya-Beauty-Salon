import axios from 'axios';

// Configuración
const WHAPI_TOKEN = process.env.WHAPI_TOKEN || 'ZdQjekBjA6iOZcVegteeznnuMXTOqQef';
const WHAPI_BASE_URL = process.env.WHAPI_BASE_URL || 'https://gate.whapi.cloud';

// Servicios
export const serviceDurations = {
  'unas-gel':       { duracion: 60,  nombre: 'Uñas de Gel',             precio: 450  },
  'unas-acrilicas': { duracion: 90,  nombre: 'Uñas Acrílicas',          precio: 600  },
  'pedicure':       { duracion: 90,  nombre: 'Pedicure Premium',        precio: 500  },
  'keratina':       { duracion: 180, nombre: 'Tratamiento de Keratina', precio: 1200 },
  'tinte':          { duracion: 180, nombre: 'Tinte Profesional',       precio: 800  },
  'pestanas':       { duracion: 60,  nombre: 'Extensión de Pestaña',    precio: 900  },
  'cejas':          { duracion: 30,  nombre: 'Diseño de Cejas',         precio: 350  }
};

// Helper: Formatear fecha
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

// Helper: Formatear teléfono para Whapi (¡CORREGIDO!)
// WhatsApp necesita: 521234567890@s.whatsapp.net
const formatearTelefonoWhapi = (telefono) => {
  console.log('📞 Teléfono original para WhatsApp:', telefono);
  
  // 1. Eliminar todo excepto números
  let numeros = telefono.replace(/\D/g, '');
  
  console.log('📞 Solo números:', numeros);
  
  // IMPORTANTE: Siempre tomar los últimos 10 dígitos (para México)
  // WhatsApp y Whapi.cloud agregan automáticamente el +52
  if (numeros.length > 10) {
    numeros = numeros.slice(-10);
  }
  
  // Verificar que sean exactamente 10 dígitos
  if (numeros.length !== 10) {
    console.error('❌ Error: Teléfono no tiene 10 dígitos:', numeros);
    throw new Error('Teléfono debe tener 10 dígitos');
  }
  
  console.log('📞 Teléfono formateado para Whapi (10 dígitos):', numeros);
  
  // Whapi requiere: 521234567890@s.whatsapp.net (52 + 10 dígitos)
  return `52${numeros}@s.whatsapp.net`;
};

// Función principal para enviar mensajes
const enviarMensajeWhapi = async (telefono, mensaje) => {
  try {
    const to = formatearTelefonoWhapi(telefono);
    
    console.log('📤 Enviando WhatsApp a:', to);
    console.log('📝 Mensaje:', mensaje.substring(0, 100) + '...');
    
    const response = await axios.post(
      `${WHAPI_BASE_URL}/messages/text`,
      {
        to: to,
        body: mensaje
      },
      {
        headers: {
          'Authorization': `Bearer ${WHAPI_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    console.log('✅ WhatsApp enviado exitosamente');
    return { success: true, data: response.data };
    
  } catch (error) {
    console.error('❌ ERROR enviando WhatsApp:');
    console.error('Telefono:', telefono);
    console.error('Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

// 1. CONFIRMACIÓN AL CLIENTE
export const enviarConfirmacionCita = async (reserva) => {
  try {
    const info = serviceDurations[reserva.servicio];
    if (!info) throw new Error('Servicio no encontrado');
    
    const fechaFormateada = formatearFecha(reserva.fecha);
    
    const mensaje = 
`🌸 *SOUMAYA BEAUTY BAR* 🌸

Hola ${reserva.nombreCliente}!

✅ *TU CITA HA SIDO CONFIRMADA*

📅 *Fecha:* ${fechaFormateada}
⏰ *Hora:* ${reserva.horaInicio} - ${reserva.horaFin}
💅 *Servicio:* ${info.nombre}
💰 *Precio:* $${info.precio} MXN

📍 *Ubicación:* Soumaya Beauty Bar

¡Te esperamos! 💖

─────────────────
*¿Necesitas cancelar o modificar?*

Responde *SÍ* para cancelar
Responde *NO* para mantenerla

_Responder a este mensaje con SÍ o NO_`;

    const resultado = await enviarMensajeWhapi(reserva.telefonoCliente, mensaje);
    
    if (resultado.success) {
      console.log(`✅ Confirmación enviada a ${reserva.telefonoCliente}`);
    }
    
    return resultado;
    
  } catch (error) {
    console.error('❌ ERROR enviando confirmación:', error.message);
    return { success: false, error: error.message };
  }
};

// 2. NOTIFICACIÓN AL SALÓN
export const notificarSalonNuevaCita = async (reserva) => {
  try {
    const info = serviceDurations[reserva.servicio];
    if (!info) throw new Error('Servicio no encontrado');
    
    const fechaFormateada = formatearFecha(reserva.fecha);
    const salonPhone = process.env.SALON_PHONE_NUMBER || '3511270276';
    
    const mensaje =
`🔔 *NUEVA CITA AGENDADA* 🔔

👤 *Cliente:* ${reserva.nombreCliente}
📱 *Teléfono:* ${reserva.telefonoCliente}
📅 *Fecha:* ${fechaFormateada}
⏰ *Hora:* ${reserva.horaInicio} - ${reserva.horaFin}
💅 *Servicio:* ${info.nombre}
💰 *Precio:* $${info.precio} MXN
🆔 *ID:* ${reserva._id}

✅ *Google Calendar:* Evento creado
✅ *WhatsApp:* Confirmación enviada al cliente

📍 Soumaya Beauty Bar`;

    const resultado = await enviarMensajeWhapi(salonPhone, mensaje);
    
    if (resultado.success) {
      console.log(`✅ Salón notificado: ${salonPhone}`);
    }
    
    return resultado;
    
  } catch (error) {
    console.error('❌ ERROR notificando salón:', error.message);
    return { success: false, error: error.message };
  }
};

// 3. RECORDATORIO (para cron job)
export const enviarRecordatorio = async (telefono, nombreCliente, servicio, fecha, hora) => {
  try {
    const info = serviceDurations[servicio];
    if (!info) throw new Error('Servicio no encontrado');
    
    const fechaFormateada = formatearFecha(fecha);
    
    const mensaje =
`⏰ *RECORDATORIO DE CITA* ⏰

Hola ${nombreCliente}!

Te recordamos que *MAÑANA* tienes tu cita:

📅 *Fecha:* ${fechaFormateada}
⏰ *Hora:* ${hora}
💅 *Servicio:* ${info.nombre}

📍 *Ubicación:* Soumaya Beauty Bar

¡No olvides asistir! 💖

─────────────────
*¿Necesitas cancelar?*

Responde *SÍ* para cancelar
Responde *NO* para mantenerla

_Responder a este mensaje con SÍ o NO_`;

    const resultado = await enviarMensajeWhapi(telefono, mensaje);
    
    if (resultado.success) {
      console.log(`✅ Recordatorio enviado a ${telefono}`);
    }
    
    return resultado;
    
  } catch (error) {
    console.error('❌ ERROR enviando recordatorio:', error.message);
    return { success: false, error: error.message };
  }
};

// 4. CONFIRMACIÓN DE CANCELACIÓN AL CLIENTE
export const enviarMensajeCancelacionConfirmada = async (reserva) => {
  try {
    const info = serviceDurations[reserva.servicio];
    if (!info) throw new Error('Servicio no encontrado');
    
    const fechaFormateada = formatearFecha(reserva.fecha);
    
    const mensaje =
`✅ *CITA CANCELADA* ✅

Hola ${reserva.nombreCliente},

Tu cita ha sido cancelada exitosamente:

💅 *Servicio:* ${info.nombre}
📅 *Fecha:* ${fechaFormateada}
⏰ *Hora:* ${reserva.horaInicio}

✅ El evento fue eliminado de Google Calendar
✅ El horario está disponible para nuevas reservas

📍 Soumaya Beauty Bar

¡Esperamos verte pronto! 🌸`;

    const resultado = await enviarMensajeWhapi(reserva.telefonoCliente, mensaje);
    
    if (resultado.success) {
      console.log(`✅ Cancelación confirmada a ${reserva.telefonoCliente}`);
    }
    
    return resultado;
    
  } catch (error) {
    console.error('❌ ERROR enviando confirmación de cancelación:', error.message);
    return { success: false, error: error.message };
  }
};

// 5. NOTIFICACIÓN DE CANCELACIÓN AL SALÓN
export const notificarSalonCancelacion = async (reserva) => {
  try {
    const info = serviceDurations[reserva.servicio];
    if (!info) throw new Error('Servicio no encontrado');
    
    const fechaFormateada = formatearFecha(reserva.fecha);
    const salonPhone = process.env.SALON_PHONE_NUMBER || '3511270276';
    
    const mensaje =
`❌ *CITA CANCELADA* ❌

👤 *Cliente:* ${reserva.nombreCliente}
📱 *Teléfono:* ${reserva.telefonoCliente}
📅 *Fecha:* ${fechaFormateada}
⏰ *Hora:* ${reserva.horaInicio}
💅 *Servicio:* ${info.nombre}
🆔 *ID:* ${reserva._id}

✅ *Google Calendar:* Evento eliminado
✅ *Horario liberado* para nuevas reservas

📍 Soumaya Beauty Bar`;

    const resultado = await enviarMensajeWhapi(salonPhone, mensaje);
    
    if (resultado.success) {
      console.log(`✅ Salón notificado de cancelación: ${salonPhone}`);
    }
    
    return resultado;
    
  } catch (error) {
    console.error('❌ ERROR notificando cancelación al salón:', error.message);
    return { success: false, error: error.message };
  }
};

// 6. PROCESAR MENSAJES ENTRANTES (para webhook)
export const procesarMensajeEntrante = (mensaje) => {
  try {
    const from = mensaje.from; // Formato: 521234567890@s.whatsapp.net
    const texto = mensaje.text?.body?.toLowerCase().trim() || '';
    
    console.log('📨 Mensaje entrante de:', from);
    console.log('📝 Texto:', texto);
    
    // Extraer solo números del remitente
    const numeros = from.replace(/\D/g, '');
    
    // Tomar solo los últimos 10 dígitos
    let telefono = numeros;
    if (numeros.length > 10) {
      telefono = numeros.slice(-10);
    }
    
    console.log('📱 Teléfono extraído (10 dígitos):', telefono);
    
    // Determinar respuesta
    const esAfirmativo = ['si', 'sí', 'yes', 'cancelar', 'cancela'].some(palabra => 
      texto.includes(palabra)
    );
    
    const esNegativo = ['no', 'mantener', 'seguir', 'confirmar'].some(palabra => 
      texto.includes(palabra)
    );
    
    return {
      telefono,
      texto,
      esAfirmativo,
      esNegativo
    };
    
  } catch (error) {
    console.error('❌ ERROR procesando mensaje:', error);
    return null;
  }
};