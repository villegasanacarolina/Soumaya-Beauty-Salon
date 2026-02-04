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
    // Limpiar teléfono (solo últimos 10 dígitos)
    const ultimos10 = telefono.replace(/\D/g, '').slice(-10);
    
    if (ultimos10.length !== 10) {
      console.log('⚠️ Teléfono no válido:', telefono);
      return null;
    }

    // Buscar la reserva confirmada más reciente de este teléfono
    // que esté esperando respuesta (ya sea de confirmación o recordatorio)
    const reservas = await Reservation.find({
      telefonoCliente: { $regex: ultimos10 + '$' }, // Buscar teléfono que termine con estos dígitos
      estado: 'confirmada',
      esperandoRespuesta: true
    }).sort({ createdAt: -1 }).limit(1);

    if (reservas.length === 0) {
      console.log('ℹ️ No hay reservas pendientes para:', ultimos10);
      return null;
    }

    return reservas[0];
  } catch (error) {
    console.error('❌ Error buscando reserva:', error);
    return null;
  }
};

export const handleWhapiWebhook = async (req, res) => {
  console.log('');
  console.log('📨 ========== WEBHOOK WHAPI RECIBIDO ==========');
  console.log('Timestamp:', new Date().toISOString());

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
      console.log('─── Procesando mensaje ───');
      
      const datos = await procesarMensajeEntrante(mensaje);
      
      if (!datos) {
        console.log('⚠️ No se pudo procesar el mensaje');
        continue;
      }

      console.log('📱 Teléfono:', datos.telefono);
      console.log('📝 Texto:', datos.texto);
      console.log('✅ ¿Es Sí?:', datos.esAfirmativo);
      console.log('❌ ¿Es No?:', datos.esNegativo);

      // Buscar reserva pendiente de respuesta
      const reserva = await buscarReservaPendiente(datos.telefono);

      if (!reserva) {
        console.log('⚠️ No hay reserva pendiente para este número');
        // Podrías enviar un mensaje de ayuda aquí
        continue;
      }

      console.log('🎯 Reserva encontrada:', reserva._id);
      console.log('   👤 Cliente:', reserva.nombreCliente);
      console.log('   💅 Servicio:', reserva.servicio);
      console.log('   📅 Fecha:', reserva.fecha);
      console.log('   ⏰ Hora:', reserva.horaInicio);

      // ─── RESPUESTA: SÍ (quiere cancelar) ───────────────────────────────
      if (datos.esAfirmativo) {
        console.log('🔴 Cliente confirmó CANCELACIÓN');

        // Cancelar en MongoDB
        reserva.estado = 'cancelada';
        reserva.esperandoRespuesta = false;
        await reserva.save();

        console.log('✅ Reserva cancelada en DB');

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
      }
      // ─── RESPUESTA: NO (mantiene la cita) ─────────────────────────────
      else if (datos.esNegativo) {
        console.log('✅ Cliente confirmó que MANTIENE la cita');

        reserva.esperandoRespuesta = false;
        await reserva.save();

        console.log('✅ Estado actualizado');
        
        // Opcional: Enviar mensaje de confirmación de mantenimiento
        // await enviarMensajeWhapi(datos.telefono, '✅ Perfecto, mantendremos tu cita. ¡Te esperamos!');
      }
      // ─── RESPUESTA NO RECONOCIDA ───────────────────────────────────────
      else {
        console.log('⚠️ Respuesta no reconocida, se ignora');
        // Opcional: Enviar mensaje de ayuda
        // await enviarMensajeWhapi(datos.telefono, 'Por favor responde SÍ para cancelar o NO para mantener tu cita.');
      }
    }

    console.log('==========================================');
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