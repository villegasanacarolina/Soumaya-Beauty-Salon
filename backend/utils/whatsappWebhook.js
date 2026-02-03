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

  console.log('🔍 Buscando reserva pendiente_conexion...');
  console.log('   Número completo:', numero);
  console.log('   Últimos 10 dígitos:', ultimos10);

  const reservas = await Reservation.find({
    estadoEncuesta: 'pendiente_conexion'
  }).sort({ createdAt: -1 });

  console.log('📋 Reservas con pendiente_conexion encontradas:', reservas.length);
  
  reservas.forEach((r, index) => {
    const telReserva = ultimosDiezeDigitos(r.telefonoCliente || '');
    console.log(`   ${index + 1}. ID: ${r._id}`);
    console.log(`      Nombre: ${r.nombreCliente}`);
    console.log(`      Tel original: ${r.telefonoCliente}`);
    console.log(`      Tel últimos 10: ${telReserva}`);
    console.log(`      Coincide?: ${telReserva === ultimos10 ? '✅ SÍ' : '❌ NO'}`);
  });

  const reservaEncontrada = reservas.find(r => {
    const telReserva = ultimosDiezeDigitos(r.telefonoCliente || '');
    return telReserva === ultimos10;
  }) || null;

  if (reservaEncontrada) {
    console.log('✅ RESERVA ENCONTRADA:', reservaEncontrada._id);
  } else {
    console.log('❌ NO SE ENCONTRÓ RESERVA COINCIDENTE');
  }

  return reservaEncontrada;
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
  const esJoin = texto.toLowerCase().trim().startsWith('join ');
  console.log(`🔍 ¿Es mensaje JOIN? "${texto}" → ${esJoin ? 'SÍ ✅' : 'NO ❌'}`);
  return esJoin;
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
export const handleIncomingWhatsApp = async (req, res) => {
  console.log('');
  console.log('📨 ========== WHATSAPP RECIBIDO ==========');
  console.log('Timestamp:', new Date().toISOString());

  const from = req.body.From || '';
  const body = (req.body.Body || '').trim();

  console.log('De:', from);
  console.log('Mensaje:', `"${body}"`);
  console.log('Body completo:', JSON.stringify(req.body, null, 2));

  // Responder inmediatamente a Twilio (requerido para evitar timeout)
  res.type('text/xml');
  res.send('<Response></Response>');
  console.log('✅ Respuesta enviada a Twilio');

  // ─── Procesar de forma asíncrona ──────────────────────────────────────
  try {

    // ══════════════════════════════════════════════════════════════════════
    // CASO A: El mensaje es "join <keyword>" — la clienta se conectó
    // ══════════════════════════════════════════════════════════════════════
    if (esMensajeJoin(body)) {
      console.log('🔗 ✅ ES UN MENSAJE DE JOIN');

      const reservaPendiente = await buscarReservaPendienteConexion(from);

      if (reservaPendiente) {
        console.log('');
        console.log('🎯 RESERVA ENCONTRADA:');
        console.log('   ID:', reservaPendiente._id);
        console.log('   Nombre:', reservaPendiente.nombreCliente);
        console.log('   Teléfono:', reservaPendiente.telefonoCliente);
        console.log('   Servicio:', reservaPendiente.servicio);
        console.log('   Fecha:', reservaPendiente.fecha);
        console.log('   Estado actual:', reservaPendiente.estadoEncuesta);

        // Cambiar estado a "esperando respuesta de encuesta"
        console.log('🔄 Cambiando estado a encuesta_cancelacion_pendiente...');
        reservaPendiente.estadoEncuesta = 'encuesta_cancelacion_pendiente';
        await reservaPendiente.save();
        console.log('✅ Estado cambiado exitosamente');

        // Enviar el WhatsApp de confirmación + encuesta
        console.log('📤 Enviando WhatsApp de confirmación...');
        try {
          const resultado = await enviarConfirmacionWhatsApp(reservaPendiente);
          if (resultado.success) {
            console.log('✅ ✅ ✅ WHATSAPP DE CONFIRMACIÓN ENVIADO EXITOSAMENTE');
          } else {
            console.error('❌ ❌ ❌ ERROR AL ENVIAR WHATSAPP:', resultado.error);
          }
        } catch (errorWhatsApp) {
          console.error('❌ ❌ ❌ EXCEPCIÓN AL ENVIAR WHATSAPP:', errorWhatsApp);
          console.error('Stack:', errorWhatsApp.stack);
        }
      } else {
        // No hay reserva pendiente
        console.log('⚠️ ⚠️ ⚠️ JOIN RECIBIDO PERO NO HAY RESERVA PENDIENTE');
        console.log('');
        console.log('🔍 DIAGNÓSTICO:');
        console.log('   Posibles causas:');
        console.log('   1. La reserva no se creó con estadoEncuesta: pendiente_conexion');
        console.log('   2. El número de teléfono no coincide (últimos 10 dígitos)');
        console.log('   3. La reserva ya cambió de estado anteriormente');
        console.log('');
        
        // Buscar TODAS las reservas recientes para debugging
        const todasReservas = await Reservation.find({})
          .sort({ createdAt: -1 })
          .limit(5);
        
        console.log('📋 ÚLTIMAS 5 RESERVAS EN LA BASE DE DATOS:');
        todasReservas.forEach((r, i) => {
          console.log(`   ${i + 1}. ${r.nombreCliente} (${r.telefonoCliente})`);
          console.log(`      Estado: ${r.estado} | Encuesta: ${r.estadoEncuesta}`);
          console.log(`      Fecha: ${r.fecha} | Servicio: ${r.servicio}`);
        });
      }

      console.log('==========================================');
      console.log('');
      return;
    }

    // ══════════════════════════════════════════════════════════════════════
    // CASO D/E: Verificar si hay reserva esperando respuesta de REAGENDAR
    // ══════════════════════════════════════════════════════════════════════
    const reservaReagendar = await buscarReservaPendienteReagendar(from);

    if (reservaReagendar) {
      console.log('🔍 Reserva encontrada en estado reagendar pendiente:', reservaReagendar._id);

      if (esRespuestaSi(body)) {
        reservaReagendar.estadoEncuesta = 'completada';
        await reservaReagendar.save();

        await enviarEnlaceReagendar(reservaReagendar.telefonoCliente);
        console.log('✅ Enlace de reagendamiento enviado');

      } else if (esRespuestaNo(body)) {
        reservaReagendar.estadoEncuesta = 'completada';
        await reservaReagendar.save();

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
        await client.messages.create({
          body: `No entendí tu respuesta 😊\n\n¿Desea reagendar una nueva cita?\nPor favor responde *Sí* o *No*`,
          from: WHATSAPP_FROM,
          to:   from
        });
        console.log('⚠️ Respuesta no reconocida en encuesta reagendar');
      }

      console.log('==========================================');
      console.log('');
      return;
    }

    // ══════════════════════════════════════════════════════════════════════
    // CASO B/C: Verificar si hay reserva esperando respuesta de CANCELAR
    // ══════════════════════════════════════════════════════════════════════
    const reservaCancelar = await buscarReservaPendienteEncuesta(from);

    if (reservaCancelar) {
      console.log('🔍 Reserva encontrada en estado encuesta cancelación pendiente:', reservaCancelar._id);

      if (esRespuestaSi(body)) {
        console.log('🔓 Cliente confirmó cancelación');

        reservaCancelar.estado         = 'cancelada';
        reservaCancelar.estadoEncuesta = 'encuesta_reagendar_pendiente';
        reservaCancelar.cancelToken    = null;
        await reservaCancelar.save();
        console.log('✅ Reserva cancelada en DB:', reservaCancelar._id);

        if (reservaCancelar.googleCalendarEventId) {
          try {
            await eliminarEventoCalendar(reservaCancelar.googleCalendarEventId);
            console.log('✅ Evento eliminado de Google Calendar');
          } catch (e) {
            console.error('⚠️ Error eliminando de Google Calendar:', e.message);
          }
        }

        try {
          await notificarSalonCancelacion(reservaCancelar);
        } catch (e) {
          console.error('⚠️ Error notificando salón:', e.message);
        }

        try {
          await enviarWhatsAppCancelado(reservaCancelar);
        } catch (e) {
          console.error('⚠️ Error enviando WhatsApp de cancelación:', e.message);
        }

      } else if (esRespuestaNo(body)) {
        reservaCancelar.estadoEncuesta = 'completada';
        await reservaCancelar.save();

        await client.messages.create({
          body: `¡Genial! 🌸 Tu cita sigue confirmada. ¡Te esperamos! 💖\nSoumaya Beauty Bar`,
          from: WHATSAPP_FROM,
          to:   from
        });
        console.log('✅ Cliente confirmó que NO cancela');

      } else {
        await client.messages.create({
          body: `No entendí tu respuesta 😊\n\n¿Desea cancelar su cita?\nPor favor responde *Sí* o *No*`,
          from: WHATSAPP_FROM,
          to:   from
        });
        console.log('⚠️ Respuesta no reconocida en encuesta cancelación');
      }

      console.log('==========================================');
      console.log('');
      return;
    }

    // ══════════════════════════════════════════════════════════════════════
    // CASO DEFAULT: No se encontró reserva pendiente
    // ══════════════════════════════════════════════════════════════════════
    console.log('⚠️ No se encontró reserva con encuesta pendiente para este número');

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
    console.error('❌ ❌ ❌ ERROR PROCESANDO WHATSAPP ENTRANTE:', error);
    console.error('Stack completo:', error.stack);
  }

  console.log('==========================================');
  console.log('');
};