import twilio from 'twilio';
import Reservation from '../models/Reservation.js';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER || '+14155238886';
const SALON_PHONE = process.env.SALON_PHONE_NUMBER || '+523511270276';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://soumaya-beauty-salon.vercel.app';

export const serviceDurations = {
  'unas-gel':       { duracion: 60,  nombre: 'Uñas de Gel',              precio: 450  },
  'unas-acrilicas': { duracion: 90,  nombre: 'Uñas Acrílicas',           precio: 600  },
  'pedicure':       { duracion: 90,  nombre: 'Pedicure Premium',         precio: 500  },
  'keratina':       { duracion: 180, nombre: 'Tratamiento de Keratina',  precio: 1200 },
  'tinte':          { duracion: 180, nombre: 'Tinte Profesional',        precio: 800  },
  'pestanas':       { duracion: 60,  nombre: 'Extensión de Pestañas',    precio: 900  },
  'cejas':          { duracion: 30,  nombre: 'Diseño de Cejas',          precio: 350  }
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const extraerNumero = (from) => {
  // from llega como "whatsapp:+523511234567"
  return from.replace('whatsapp:', '').replace('+', '');
};

const ultimosDiezeDigitos = (numero) => {
  const solo = numero.replace(/\D/g, '');
  return solo.slice(-10);
};

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

const buscarReservaPorTelefono = async (numero) => {
  const ultimos10 = ultimosDiezeDigitos(numero);

  // Buscar todas las reservas confirmadas del cliente
  const reservas = await Reservation.find({
    estado: 'confirmada'
  }).sort({ createdAt: -1 });

  // Filtrar por los últimos 10 dígitos del teléfono
  return reservas.find(r => {
    const telReserva = ultimosDiezeDigitos(r.telefonoCliente || '');
    return telReserva === ultimos10;
  }) || null;
};

const buscarReservaPorId = async (reservaId, numero) => {
  const ultimos10 = ultimosDiezeDigitos(numero);

  const reserva = await Reservation.findById(reservaId);
  if (!reserva) return null;

  const telReserva = ultimosDiezeDigitos(reserva.telefonoCliente || '');
  if (telReserva !== ultimos10) return null; // seguridad: solo la propia reserva

  return reserva;
};

// ─── Mensajes ───────────────────────────────────────────────────────────────

const mensajeConfirmacion = (reserva) => {
  const info = serviceDurations[reserva.servicio];
  const fecha = formatearFecha(reserva.fecha);

  return (
    `Hola *${reserva.nombreCliente}*! 🌸\n\n` +
    `✅ *Tu cita está confirmada*\n\n` +
    `📅 *Fecha:* ${fecha}\n` +
    `⏰ *Hora:* ${reserva.horaInicio} - ${reserva.horaFin}\n` +
    `💅 *Servicio:* ${info.nombre}\n` +
    `⏱️ *Duración:* ${info.duracion} minutos\n` +
    `💰 *Precio:* $${info.precio} MXN\n\n` +
    `📍 *Ubicación:* Soumaya Beauty Bar\n\n` +
    `¡Te esperamos! 💖\n\n` +
    `_Si deseas cancelar tu cita escribe: cancelar cita_`
  );
};

const mensajeCancelado = (reserva) => {
  const info = serviceDurations[reserva.servicio];
  const fecha = formatearFecha(reserva.fecha);

  return (
    `✅ *Cita cancelada*\n\n` +
    `Tu cita de *${info.nombre}* el *${fecha}* a las *${reserva.horaInicio}* ha sido cancelada exitosamente.\n\n` +
    `¿Te gustaría reagendar una nueva cita? 🌸\n\n` +
    `Responde *sí* para ir a la página de reservaciones.`
  );
};

// ─── Handler principal ──────────────────────────────────────────────────────

export const handleIncomingWhatsApp = async (req, res) => {
  console.log('📨 ========== MENSAJE WHATSAPP RECIBIDO ==========');

  const from       = req.body.From;        // whatsapp:+523511234567
  const body       = (req.body.Body || '').trim();
  const profileName = req.body.ProfileName;

  console.log('De:', from);
  console.log('Nombre:', profileName);
  console.log('Mensaje:', body);

  const numero = extraerNumero(from);

  try {
    const textLower = body.toLowerCase();

    // ── 1) "Dame mi confirmación de cita" ─────────────────────────────────
    if (textLower.includes('confirmacion') || textLower.includes('confirmación') || textLower.includes('cita')) {

      // Si es "cancelar cita" tiene prioridad → ver bloque 2
      if (textLower.includes('cancelar')) {
        // Caer al bloque de cancelación
      } else {
        const reserva = await buscarReservaPorTelefono(numero);

        if (reserva) {
          await client.messages.create({
            body: mensajeConfirmacion(reserva),
            from: `whatsapp:${TWILIO_PHONE}`,
            to: from
          });
          console.log('✅ Confirmación enviada a cliente');
        } else {
          await client.messages.create({
            body: `Hola! 👋\n\nNo encontramos una cita registrada con este número.\n\n🌐 Agenda tu cita aquí:\n${FRONTEND_URL}/reservaciones\n\n¿Necesitas ayuda? Escríbenos 💖`,
            from: `whatsapp:${TWILIO_PHONE}`,
            to: from
          });
          console.log('⚠️ No se encontró reserva para este número');
        }

        res.type('text/xml');
        res.send('<Response></Response>');
        return;
      }
    }

    // ── 2) "Cancelar cita" ────────────────────────────────────────────────
    if (textLower.includes('cancelar')) {
      const reserva = await buscarReservaPorTelefono(numero);

      if (reserva) {
        // Cancelar en la base de datos
        reserva.estado = 'cancelada';
        await reserva.save();
        console.log('✅ Reserva cancelada desde WhatsApp:', reserva._id);

        // Notificar al salón
        const info = serviceDurations[reserva.servicio];
        await client.messages.create({
          body: `🔔 *CITA CANCELADA*\n\n👤 *Cliente:* ${reserva.nombreCliente}\n📱 *Teléfono:* ${reserva.telefonoCliente}\n📅 *Fecha:* ${formatearFecha(reserva.fecha)}\n⏰ *Hora:* ${reserva.horaInicio}\n💅 *Servicio:* ${info.nombre}\n\n_El cliente canceló desde WhatsApp._`,
          from: `whatsapp:${TWILIO_PHONE}`,
          to: `whatsapp:${SALON_PHONE}`
        });

        // Responder al cliente con opción de reagendar
        await client.messages.create({
          body: mensajeCancelado(reserva),
          from: `whatsapp:${TWILIO_PHONE}`,
          to: from
        });
        console.log('✅ Mensaje de cancelación enviado');
      } else {
        await client.messages.create({
          body: `No encontramos una cita activa para cancelar con este número. 🤔\n\nSi necesitas ayuda, escríbenos 💖`,
          from: `whatsapp:${TWILIO_PHONE}`,
          to: from
        });
      }

      res.type('text/xml');
      res.send('<Response></Response>');
      return;
    }

    // ── 3) Responde "sí" para reagendar ───────────────────────────────────
    if (textLower === 'sí' || textLower === 'si' || textLower === 'yes') {
      await client.messages.create({
        body: `¡Genial! 🌸\n\nTe mando el enlace para agendar tu nueva cita:\n\n🌐 ${FRONTEND_URL}/reservaciones\n\nAbre el enlace y selecciona el horario que prefieras. ¡Te esperamos! 💖`,
        from: `whatsapp:${TWILIO_PHONE}`,
        to: from
      });
      console.log('✅ Enlace de reagendamiento enviado');

      res.type('text/xml');
      res.send('<Response></Response>');
      return;
    }

    // ── 4) Mensaje genérico / no reconocido ───────────────────────────────
    await client.messages.create({
      body: `Hola! 👋 Soy el asistente de *Soumaya Beauty Bar* 🌸\n\nPuedo ayudarte con:\n\n✅ *Ver tu confirmación* → Escribe: confirmación de cita\n❌ *Cancelar tu cita* → Escribe: cancelar cita\n\n¿En qué te puedo ayudar? 💖`,
      from: `whatsapp:${TWILIO_PHONE}`,
      to: from
    });
    console.log('✅ Mensaje genérico enviado');

  } catch (error) {
    console.error('❌ Error procesando mensaje WhatsApp:', error);
  }

  console.log('==========================================');
  res.type('text/xml');
  res.send('<Response></Response>');
};

// ─── Notificar al salón cuando se crea una cita ────────────────────────────

export const notificarSalon = async (reserva) => {
  try {
    const info = serviceDurations[reserva.servicio];
    const fecha = formatearFecha(reserva.fecha);

    await client.messages.create({
      body:
        `🔔 *NUEVA CITA AGENDADA*\n\n` +
        `👤 *Cliente:* ${reserva.nombreCliente}\n` +
        `📱 *Teléfono:* ${reserva.telefonoCliente}\n` +
        `📅 *Fecha:* ${fecha}\n` +
        `⏰ *Hora:* ${reserva.horaInicio} - ${reserva.horaFin}\n` +
        `💅 *Servicio:* ${info.nombre}\n` +
        `⏱️ *Duración:* ${info.duracion} minutos\n` +
        `💰 *Precio:* $${info.precio} MXN`,
      from: `whatsapp:${TWILIO_PHONE}`,
      to: `whatsapp:${SALON_PHONE}`
    });

    console.log('✅ Notificación enviada al salón');
    return { success: true };
  } catch (error) {
    console.error('❌ Error notificando al salón:', error.message);
    return { success: false };
  }
};

// ─── Recordatorio (cron) ────────────────────────────────────────────────────

export const enviarRecordatorio = async (telefono, nombreCliente, servicio, fecha, hora) => {
  try {
    const info = serviceDurations[servicio];
    const fechaTexto = formatearFecha(fecha);

    let num = telefono.replace(/\D/g, '');
    if (num.length === 10) num = '52' + num;

    await client.messages.create({
      body:
        `⏰ *RECORDATORIO DE CITA*\n\n` +
        `Hola *${nombreCliente}*! 🌸\n\n` +
        `Mañana tienes tu cita:\n\n` +
        `📅 ${fechaTexto}\n` +
        `⏰ ${hora}\n` +
        `💅 ${info.nombre}\n\n` +
        `¡No olvides asistir! 💖\n\n` +
        `_Soumaya Beauty Bar_`,
      from: `whatsapp:${TWILIO_PHONE}`,
      to: `whatsapp:+${num}`
    });

    console.log('✅ Recordatorio enviado a:', telefono);
    return { success: true };
  } catch (error) {
    console.error('❌ Error recordatorio:', error.message);
    return { success: false };
  }
};