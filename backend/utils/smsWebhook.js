import Reservation from '../models/Reservation.js';
import {
  enviarSMSCancelado,
  enviarEnlaceReagendar,
  notificarSalonCancelacion
} from '../utils/smsService.js';
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const SALON_PHONE = process.env.SALON_PHONE_NUMBER || '+523511270276';

// ─── Helper: extraer últimos 10 dígitos del teléfono ──────────────────────
const ultimosDiezeDigitos = (numero) => {
  const solo = numero.replace(/\D/g, '');
  return solo.slice(-10);
};

// ─── Helper: buscar reserva confirmada por teléfono ───────────────────────
// Busca la reserva más reciente en estado "confirmada" con encuesta pendiente
const buscarReservaPendienteEncuesta = async (numero) => {
  const ultimos10 = ultimosDiezeDigitos(numero);

  // Buscar reservas con encuesta pendiente (cancelacion o reagendar)
  const reservas = await Reservation.find({
    estado: 'confirmada',
    estadoEncuesta: 'encuesta_cancelacion_pendiente'
  }).sort({ createdAt: -1 });

  return reservas.find(r => {
    const telReserva = ultimosDiezeDigitos(r.telefonoCliente || '');
    return telReserva === ultimos10;
  }) || null;
};

// Busca reserva que ya fue cancelada y espera respuesta de reagendar
const buscarReservaPendienteReagendar = async (numero) => {
  const ultimos10 = ultimosDiezeDigitos(numero);

  const reservas = await Reservation.find({
    estado: 'cancelada',
    estadoEncuesta: 'encuesta_reagendar_pendiente'
  }).sort({ createdAt: -1 });

  return reservas.find(r => {
    const telReserva = ultimosDiezeDigitos(r.telefonoCliente || '');
    return telReserva === ultimos10;
  }) || null;
};

// ─── Helper: detectar respuesta afirmativa ────────────────────────────────
const esRespuestaSi = (texto) => {
  const t = texto.toLowerCase().trim();
  return t === 'sí' || t === 'si' || t === 'yes' || t === 'y' || t === 'sí.' || t === 'si.';
};

const esRespuestaNo = (texto) => {
  const t = texto.toLowerCase().trim();
  return t === 'no' || t === 'no.' || t === 'nope';
};

// ─── Handler principal: recibe SMS de Twilio ──────────────────────────────
// Twilio llama a este endpoint cuando la clienta responde al SMS.
// URL en Twilio: https://soumaya-beauty-salon.onrender.com/api/sms/webhook
export const handleIncomingSMS = async (req, res) => {
  console.log('📨 ========== SMS RECIBIDO ==========');

  const from = req.body.From || '';        // +5231234567890
  const body = (req.body.Body || '').trim();

  console.log('De:', from);
  console.log('Mensaje:', body);

  // Responder inmediatamente a Twilio (requerido para evitar timeout)
  res.type('text/xml');
  res.send('<Response></Response>');

  // ─── Procesar de forma asíncrona ────────────────────────────────────────
  try {
    // ── 1) Verificar si hay una reserva esperando respuesta de REAGENDAR ──
    // (se verifica primero porque es un estado más específico)
    const reservaReagendar = await buscarReservaPendienteReagendar(from);

    if (reservaReagendar) {
      console.log('🔍 Reserva encontrada en estado reagendar pendiente:', reservaReagendar._id);

      if (esRespuestaSi(body)) {
        // La clienta quiere reagendar → enviar enlace
        reservaReagendar.estadoEncuesta = 'completada';
        await reservaReagendar.save();

        await enviarEnlaceReagendar(reservaReagendar.telefonoCliente);
        console.log('✅ Enlace de reagendamiento enviado');
      } else if (esRespuestaNo(body)) {
        // La clienta no quiere reagendar → cerrar encuesta
        reservaReagendar.estadoEncuesta = 'completada';
        await reservaReagendar.save();

        // Enviar mensaje de despedida
        await client.messages.create({
          body: `De acuerdo 🌸 Si en algún momento deseas agendar una cita, no dudes en visitar:\n\nhttps://soumaya-beauty-salon.vercel.app/reservaciones\n\n¡Que tengas un día genial! 💖\nSoumaya Beauty Bar`,
          from: SALON_PHONE,
          to: from
        });
        console.log('✅ Mensaje de despedida enviado');
      } else {
        // Respuesta no reconocida → recordar opciones
        await client.messages.create({
          body: `No entendí tu respuesta 😊\n\n¿Desea reagendar una nueva cita?\nPor favor responde Sí o No`,
          from: SALON_PHONE,
          to: from
        });
        console.log('⚠️ Respuesta no reconocida en encuesta reagendar');
      }

      console.log('==========================================');
      return;
    }

    // ── 2) Verificar si hay una reserva esperando respuesta de CANCELAR ───
    const reservaCancelar = await buscarReservaPendienteEncuesta(from);

    if (reservaCancelar) {
      console.log('🔍 Reserva encontrada en estado encuesta cancelación pendiente:', reservaCancelar._id);

      if (esRespuestaSi(body)) {
        // La clienta quiere CANCELAR su cita
        console.log('🔓 Cliente confirmó cancelación');

        // Cancelar la reserva en la base de datos
        reservaCancelar.estado = 'cancelada';
        reservaCancelar.estadoEncuesta = 'encuesta_reagendar_pendiente';
        reservaCancelar.cancelToken = null; // invalidar token del link antiguo
        await reservaCancelar.save();

        console.log('✅ Reserva cancelada en DB:', reservaCancelar._id);

        // Notificar al salón
        try {
          await notificarSalonCancelacion(reservaCancelar);
        } catch (e) {
          console.error('⚠️ Error notificando salón:', e.message);
        }

        // Enviar SMS de cancelación + pregunta de reagendar
        try {
          await enviarSMSCancelado(reservaCancelar);
        } catch (e) {
          console.error('⚠️ Error enviando SMS de cancelación:', e.message);
        }

      } else if (esRespuestaNo(body)) {
        // La clienta NO quiere cancelar → cerrar encuesta
        reservaCancelar.estadoEncuesta = 'completada';
        await reservaCancelar.save();

        await client.messages.create({
          body: `¡Genial! 🌸 Tu cita sigue confirmada. ¡Te esperamos! 💖\nSoumaya Beauty Bar`,
          from: SALON_PHONE,
          to: from
        });
        console.log('✅ Cliente confirmó que NO cancela');

      } else {
        // Respuesta no reconocida → recordar opciones
        await client.messages.create({
          body: `No entendí tu respuesta 😊\n\n¿Desea cancelar su cita?\nPor favor responde Sí o No`,
          from: SALON_PHONE,
          to: from
        });
        console.log('⚠️ Respuesta no reconocida en encuesta cancelación');
      }

      console.log('==========================================');
      return;
    }

    // ── 3) No se encontró reserva pendiente de encuesta ─────────────────
    console.log('⚠️ No se encontró reserva con encuesta pendiente para este número');

    await client.messages.create({
      body: `Hola! 👋 Soy el asistente de Soumaya Beauty Bar 🌸\n\nNo encontré una cita pendiente asociada a tu número.\n\nSi deseas agendar una cita, visita:\nhttps://soumaya-beauty-salon.vercel.app/reservaciones\n\n¿En qué te puedo ayudar? 💖`,
      from: SALON_PHONE,
      to: from
    });

  } catch (error) {
    console.error('❌ Error procesando SMS entrante:', error);
  }

  console.log('==========================================');
};