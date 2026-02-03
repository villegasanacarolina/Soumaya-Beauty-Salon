import Reservation from '../models/Reservation.js';
import {
  enviarConfirmacionWhatsApp,
  enviarWhatsAppCancelado,
  enviarEnlaceReagendar,
  notificarSalonCancelacion
} from '../utils/whatsappService.js';
import { eliminarEventoCalendar } from '../utils/googleCalendarService.js';
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const WHATSAPP_FROM = process.env.WHATSAPP_FROM || 'whatsapp:+14155238886';
const FRONTEND_URL  = process.env.FRONTEND_URL  || 'https://soumaya-beauty-salon.vercel.app';

// ─── Helper: extraer últimos 10 dígitos del teléfono ────────────────────────
const ultimosDiezeDigitos = (numero) => {
  const solo = numero.replace(/\D/g, '');
  return solo.slice(-10);
};

// ─── Helper: buscar reserva pendiente de conexión (deep link) ───────────────
// Se busca cuando la clienta envía "join <keyword>" por primera vez
const buscarReservaPendienteConexion = async (numero) => {
  const ultimos10 = ultimosDiezeDigitos(numero);

  const reservas = await Reservation.find({
    estadoEncuesta: 'pendiente_conexion'
  }).sort({ createdAt: -1 });

  return reservas.find(r => {
    const telReserva = ultimosDiezeDigitos(r.telefonoCliente || '');
    return telReserva === ultimos10;
  }) || null;
};

// ─── Helper: buscar reserva pendiente de encuesta de cancelación ────────────
const buscarReservaPendienteEncuesta = async (numero) => {
  const ultimos10 = ultimosDiezeDigitos(numero);

  const reservas = await Reservation.find({
    estado:         'confirmada',
    estadoEncuesta: 'encuesta_cancelacion_pendiente'
  }).sort({ createdAt: -1 });

  return reservas.find(r => {
    const telReserva = ultimosDiezeDigitos(r.telefonoCliente || '');
    return telReserva === ultimos10;
  }) || null;
};

// ─── Helper: buscar reserva pendiente de reagendar ──────────────────────────
const buscarReservaPendienteReagendar = async (numero) => {
  const ultimos10 = ultimosDiezeDigitos(numero);

  const reservas = await Reservation.find({
    estado:         'cancelada',
    estadoEncuesta: 'encuesta_reagendar_pendiente'
  }).sort({ createdAt: -1 });

  return reservas.find(r => {
    const telReserva = ultimosDiezeDigitos(r.telefonoCliente || '');
    return telReserva === ultimos10;
  }) || null;
};

// ─── Helper: detectar si el mensaje es "join <algo>" ───────────────────────
const esMensajeJoin = (texto) => {
  return texto.toLowerCase().trim().startsWith('join ');
};

// ─── Helper: detectar respuesta afirmativa ─────────────────────────────────
const esRespuestaSi = (texto) => {
  const t = texto.toLowerCase().trim().replace(/[.*]/g, '');
  return ['sí', 'si', 'yes', 'y', 'ok', 'sip'].includes(t);
};

// ─── Helper: detectar respuesta negativa ───────────────────────────────────
const esRespuestaNo = (texto) => {
  const t = texto.toLowerCase().trim().replace(/[.*]/g, '');
  return ['no', 'nope', 'non'].includes(t);
};

// ─── Handler principal: recibe WhatsApp de Twilio ──────────────────────────
// Twilio llama a este endpoint cuando la clienta envía un mensaje.
// URL en Twilio Sandbox: https://soumaya-beauty-salon.onrender.com/api/whatsapp/webhook
//
// FLUJO:
// A) Cliente envía "join <keyword>" → Twilio llama aquí
//    → Detectamos que es un "join" → buscamos reserva con pendiente_conexion
//    → Enviamos el WhatsApp de confirmación + encuesta
//
// B) Cliente responde "Sí" a cancelar
//    → Cancelar en MongoDB → Eliminar de Google Calendar → Preguntar reagendar
//
// C) Cliente responde "No" a cancelar
//    → Confirmar que la cita sigue activa
//
// D) Cliente responde "Sí" a reagendar
//    → Enviar link a /reservaciones
//
// E) Cliente responde "No" a reagendar
//    → Mensaje de despedida

export const handleIncomingWhatsApp = async (req, res) => {
  console.log('📨 ========== WHATSAPP RECIBIDO ==========');

  const from = req.body.From || '';        // whatsapp:+5231234567890
  const body = (req.body.Body || '').trim();

  console.log('De:', from);
  console.log('Mensaje:', body);

  // Responder inmediatamente a Twilio (requerido para evitar timeout)
  res.type('text/xml');
  res.send('<Response></Response>');

  // ─── Procesar de forma asíncrona ──────────────────────────────────────
  try {

    // ══════════════════════════════════════════════════════════════════════
    // CASO A: El mensaje es "join <keyword>" — la clienta se conectó
    // ══════════════════════════════════════════════════════════════════════
    if (esMensajeJoin(body)) {
      console.log('🔗 Mensaje de JOIN detectado');

      const reservaPendiente = await buscarReservaPendienteConexion(from);

      if (reservaPendiente) {
        console.log('🔍 Reserva encontrada con pendiente_conexion:', reservaPendiente._id);

        // Cambiar estado a "esperando respuesta de encuesta"
        reservaPendiente.estadoEncuesta = 'encuesta_cancelacion_pendiente';
        await reservaPendiente.save();

        // Enviar el WhatsApp de confirmación + encuesta
        await enviarConfirmacionWhatsApp(reservaPendiente);
        console.log('✅ WhatsApp de confirmación enviado tras conexión');
      } else {
        // No hay reserva pendiente, es un join genérico
        console.log('⚠️ JOIN recibido pero no hay reserva pendiente de conexión');
        // No enviar nada extra, Twilio ya envió su confirmación de join
      }

      console.log('==========================================');
      return;
    }

    // ══════════════════════════════════════════════════════════════════════
    // CASO D/E: Verificar si hay reserva esperando respuesta de REAGENDAR
    // (se verifica primero porque es un estado más específico)
    // ══════════════════════════════════════════════════════════════════════
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

        // Mensaje de despedida
        await client.messages.create({
          body:
            `De acuerdo 🌸 Si en algún momento deseas agendar una cita, no dudes en visitar:\n\n` +
            `${FRONTEND_URL}/reservaciones\n\n` +
            `¡Que tengas un día genial! 💖\n` +
            `Soumaya Beauty Bar`,
          from: WHATSAPP_FROM,
          to:   from
        });
        console.log('✅ Mensaje de despedida enviado');

      } else {
        // Respuesta no reconocida → recordar opciones
        await client.messages.create({
          body: `No entendí tu respuesta 😊\n\n¿Desea reagendar una nueva cita?\nPor favor responde *Sí* o *No*`,
          from: WHATSAPP_FROM,
          to:   from
        });
        console.log('⚠️ Respuesta no reconocida en encuesta reagendar');
      }

      console.log('==========================================');
      return;
    }

    // ══════════════════════════════════════════════════════════════════════
    // CASO B/C: Verificar si hay reserva esperando respuesta de CANCELAR
    // ══════════════════════════════════════════════════════════════════════
    const reservaCancelar = await buscarReservaPendienteEncuesta(from);

    if (reservaCancelar) {
      console.log('🔍 Reserva encontrada en estado encuesta cancelación pendiente:', reservaCancelar._id);

      if (esRespuestaSi(body)) {
        // La clienta quiere CANCELAR su cita
        console.log('🔓 Cliente confirmó cancelación');

        // ── Cancelar en MongoDB ───────────────────────────────────────
        reservaCancelar.estado         = 'cancelada';
        reservaCancelar.estadoEncuesta = 'encuesta_reagendar_pendiente';
        reservaCancelar.cancelToken    = null;
        await reservaCancelar.save();
        console.log('✅ Reserva cancelada en DB:', reservaCancelar._id);

        // ── Eliminar de Google Calendar ───────────────────────────────
        if (reservaCancelar.googleCalendarEventId) {
          try {
            await eliminarEventoCalendar(reservaCancelar.googleCalendarEventId);
            console.log('✅ Evento eliminado de Google Calendar');
          } catch (e) {
            console.error('⚠️ Error eliminando de Google Calendar:', e.message);
          }
        }

        // ── Notificar al salón ────────────────────────────────────────
        try {
          await notificarSalonCancelacion(reservaCancelar);
        } catch (e) {
          console.error('⚠️ Error notificando salón:', e.message);
        }

        // ── Enviar WhatsApp de cancelación + pregunta de reagendar ────
        try {
          await enviarWhatsAppCancelado(reservaCancelar);
        } catch (e) {
          console.error('⚠️ Error enviando WhatsApp de cancelación:', e.message);
        }

      } else if (esRespuestaNo(body)) {
        // La clienta NO quiere cancelar → cerrar encuesta
        reservaCancelar.estadoEncuesta = 'completada';
        await reservaCancelar.save();

        await client.messages.create({
          body: `¡Genial! 🌸 Tu cita sigue confirmada. ¡Te esperamos! 💖\nSoumaya Beauty Bar`,
          from: WHATSAPP_FROM,
          to:   from
        });
        console.log('✅ Cliente confirmó que NO cancela');

      } else {
        // Respuesta no reconocida → recordar opciones
        await client.messages.create({
          body: `No entendí tu respuesta 😊\n\n¿Desea cancelar su cita?\nPor favor responde *Sí* o *No*`,
          from: WHATSAPP_FROM,
          to:   from
        });
        console.log('⚠️ Respuesta no reconocida en encuesta cancelación');
      }

      console.log('==========================================');
      return;
    }

    // ══════════════════════════════════════════════════════════════════════
    // CASO DEFAULT: No se encontró reserva pendiente
    // ══════════════════════════════════════════════════════════════════════
    console.log('⚠️ No se encontró reserva con encuesta pendiente para este número');

    // Solo enviar respuesta si NO es un mensaje "join" (ya lo manejamos arriba)
    await client.messages.create({
      body:
        `Hola! 👋 Soy el asistente de Soumaya Beauty Bar 🌸\n\n` +
        `No encontré una cita pendiente asociada a tu número.\n\n` +
        `Si deseas agendar una cita, visita:\n` +
        `${FRONTEND_URL}/reservaciones\n\n` +
        `¿En qué te puedo ayudar? 💖`,
      from: WHATSAPP_FROM,
      to:   from
    });

  } catch (error) {
    console.error('❌ Error procesando WhatsApp entrante:', error);
  }

  console.log('==========================================');
};