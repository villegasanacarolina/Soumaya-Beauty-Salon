import Reservation from '../models/Reservation.js';
import {
  procesarMensajeEntrante,
  enviarMensajeCancelacionConfirmada,
  notificarSalonCancelacion
} from '../utils/whapiService.js';
import { eliminarEventoCalendar } from '../utils/googleCalendarService.js';

// ═══════════════════════════════════════════════════════════════════════════
// WEBHOOK: RECIBIR MENSAJES DE WHAPI.CLOUD
// ═══════════════════════════════════════════════════════════════════════════

const buscarReservaPendiente = async (telefono) => {
  try {
    console.log('🔍 ========== BUSCANDO RESERVA PENDIENTE ==========');
    console.log('🔍 Teléfono recibido:', telefono);
    
    // Asegurar que el teléfono tenga exactamente 10 dígitos
    let telefono10 = telefono.replace(/\D/g, '');
    
    // Si tiene código de país, quitarlo
    if (telefono10.length === 12 && telefono10.startsWith('52')) {
      telefono10 = telefono10.slice(2);
    } else if (telefono10.length === 13 && telefono10.startsWith('521')) {
      telefono10 = telefono10.slice(3);
    } else if (telefono10.length > 10) {
      telefono10 = telefono10.slice(-10);
    }
    
    console.log('🔍 Teléfono normalizado (10 dígitos):', telefono10);
    
    if (telefono10.length !== 10) {
      console.log('⚠️ Teléfono no válido (no tiene 10 dígitos):', telefono10);
      return null;
    }

    // Buscar la reserva confirmada más reciente de este teléfono
    // que esté esperando respuesta
    // NOTA: En la DB guardamos solo 10 dígitos, así que buscamos directamente
    const reservas = await Reservation.find({
      telefonoCliente: telefono10, // Búsqueda exacta de 10 dígitos
      estado: 'confirmada',
      esperandoRespuesta: true
    }).sort({ createdAt: -1 }).limit(1);

    if (reservas.length === 0) {
      console.log('ℹ️ No hay reservas pendientes para:', telefono10);
      console.log('🔍 =============================================');
      return null;
    }

    console.log('✅ Reserva encontrada:', reservas[0]._id);
    console.log('🔍 =============================================');
    return reservas[0];
  } catch (error) {
    console.error('❌ Error buscando reserva:', error);
    return null;
  }
};

export const handleWhapiWebhook = async (req, res) => {
  console.log('');
  console.log('📨 ========== WEBHOOK WHAPI RECIBIDO ==========');
  console.log('📨 Timestamp:', new Date().toISOString());

  try {
    // Whapi envía los mensajes en req.body.messages
    const messages = req.body.messages || [];
    
    if (messages.length === 0) {
      console.log('⚠️ No hay mensajes en el webhook');
      return res.status(200).json({ success: true, message: 'No messages' });
    }

    console.log(`📬 ${messages.length} mensaje(s) recibido(s)`);

    // Procesar cada mensaje
    for (const mensaje of messages) {
      console.log('');
      console.log('─────────────────────────────────────────────');
      console.log('─── Procesando mensaje ───');
      
      const datos = procesarMensajeEntrante(mensaje);
      
      if (!datos) {
        console.log('⚠️ No se pudo procesar el mensaje');
        continue;
      }

      console.log('📱 Teléfono extraído (10 dígitos):', datos.telefono);
      console.log('📝 Texto del mensaje:', datos.texto);
      console.log('✅ ¿Quiere cancelar (Sí)?:', datos.esAfirmativo);
      console.log('❌ ¿Quiere mantener (No)?:', datos.esNegativo);

      // Buscar reserva pendiente de respuesta
      const reserva = await buscarReservaPendiente(datos.telefono);

      if (!reserva) {
        console.log('⚠️ No hay reserva pendiente para este número');
        // Podrías enviar un mensaje de ayuda aquí
        continue;
      }

      console.log('🎯 Reserva encontrada:');
      console.log('   🆔 ID:', reserva._id);
      console.log('   👤 Cliente:', reserva.nombreCliente);
      console.log('   📱 Teléfono en DB:', reserva.telefonoCliente);
      console.log('   💅 Servicio:', reserva.servicio);
      console.log('   📅 Fecha:', reserva.fecha);
      console.log('   ⏰ Hora:', reserva.horaInicio);

      // ─── RESPUESTA: SÍ (quiere cancelar) ───────────────────────────────
      if (datos.esAfirmativo) {
        console.log('');
        console.log('🔴 ========== CANCELANDO CITA ==========');

        // Cancelar en MongoDB
        reserva.estado = 'cancelada';
        reserva.esperandoRespuesta = false;
        await reserva.save();

        console.log('✅ Reserva cancelada en MongoDB');

        // Eliminar de Google Calendar
        if (reserva.googleCalendarEventId) {
          try {
            await eliminarEventoCalendar(reserva.googleCalendarEventId);
            console.log('✅ Evento eliminado de Google Calendar');
          } catch (e) {
            console.error('⚠️ Error eliminando de Google Calendar:', e.message);
          }
        }

        // Notificar al salón
        try {
          await notificarSalonCancelacion(reserva);
          console.log('✅ Salón notificado de la cancelación');
        } catch (e) {
          console.error('⚠️ Error notificando al salón:', e.message);
        }

        // Confirmar cancelación al cliente
        try {
          await enviarMensajeCancelacionConfirmada(reserva);
          console.log('✅ Mensaje de cancelación enviado al cliente');
        } catch (e) {
          console.error('⚠️ Error enviando confirmación:', e.message);
        }
        
        console.log('🔴 ========================================');
      }
      // ─── RESPUESTA: NO (mantiene la cita) ─────────────────────────────
      else if (datos.esNegativo) {
        console.log('');
        console.log('✅ ========== MANTENIENDO CITA ==========');

        reserva.esperandoRespuesta = false;
        await reserva.save();

        console.log('✅ Cliente confirmó que MANTIENE la cita');
        console.log('✅ Estado actualizado en MongoDB');
        console.log('✅ ========================================');
        
        // Opcional: Enviar mensaje de confirmación de mantenimiento
        // await enviarMensajeWhapi(datos.telefono, '✅ Perfecto, mantendremos tu cita. ¡Te esperamos!');
      }
      // ─── RESPUESTA NO RECONOCIDA ───────────────────────────────────────
      else {
        console.log('⚠️ Respuesta no reconocida, se ignora');
        console.log('⚠️ Texto recibido:', datos.texto);
        // Opcional: Enviar mensaje de ayuda
        // await enviarMensajeWhapi(datos.telefono, 'Por favor responde SÍ para cancelar o NO para mantener tu cita.');
      }
    }

    console.log('');
    console.log('📨 ========== FIN WEBHOOK ==========');
    console.log('');
    res.status(200).json({ success: true, processed: messages.length });

  } catch (error) {
    console.error('❌ Error en webhook:', error);
    console.error('Stack:', error.stack);
    console.log('==========================================');
    console.log('');
    res.status(500).json({ success: false, error: error.message });
  }
};