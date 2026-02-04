import Reservation from '../models/Reservation.js';
import { crearEventoCalendar, obtenerEventosCalendar, verificarConexionCalendar } from './googleCalendarService.js';

// ═══════════════════════════════════════════════════════════════════════════
// SINCORNIZAR RESERVAS CON GOOGLE CALENDAR
// ═══════════════════════════════════════════════════════════════════════════

export const syncGoogleCalendar = async () => {
  try {
    console.log('');
    console.log('🔄 ========== SINCORNIZANDO CON GOOGLE CALENDAR ==========');
    
    // 1. Verificar conexión
    const conexion = await verificarConexionCalendar();
    if (!conexion.success) {
      console.error('❌ No se pudo conectar a Google Calendar');
      return { success: false, error: 'Connection failed' };
    }
    
    // 2. Buscar reservas confirmadas sin evento en Google Calendar
    const reservasSinEvento = await Reservation.find({
      estado: 'confirmada',
      $or: [
        { googleCalendarEventId: { $exists: false } },
        { googleCalendarEventId: null },
        { googleCalendarEventId: '' }
      ]
    });

    console.log(`📊 ${reservasSinEvento.length} reservas sin evento en Google Calendar`);

    if (reservasSinEvento.length === 0) {
      console.log('✅ Todas las reservas ya están sincronizadas');
      console.log('==========================================');
      return { success: true, message: 'Already synced', count: 0 };
    }

    let creados = 0;
    let errores = 0;
    let detalles = [];

    // 3. Crear eventos para cada reserva
    for (const reserva of reservasSinEvento) {
      try {
        console.log('');
        console.log(`📝 Procesando reserva ${reserva._id}:`);
        console.log(`   👤 ${reserva.nombreCliente}`);
        console.log(`   💅 ${reserva.servicio}`);
        console.log(`   📅 ${reserva.fecha} ${reserva.horaInicio}`);

        const resultado = await crearEventoCalendar(reserva);
        
        if (resultado.success) {
          reserva.googleCalendarEventId = resultado.eventId;
          await reserva.save();
          
          creados++;
          console.log(`✅ Evento creado: ${resultado.eventId}`);
          
          detalles.push({
            reservaId: reserva._id,
            eventoId: resultado.eventId,
            status: 'created',
            link: resultado.htmlLink
          });
        } else {
          errores++;
          console.error(`❌ Error: ${resultado.error}`);
          
          detalles.push({
            reservaId: reserva._id,
            status: 'error',
            error: resultado.error
          });
        }
      } catch (error) {
        errores++;
        console.error(`❌ Error procesando reserva ${reserva._id}:`, error.message);
        
        detalles.push({
          reservaId: reserva._id,
          status: 'exception',
          error: error.message
        });
      }
    }

    // 4. Verificar eventos existentes en Google Calendar
    console.log('');
    console.log('🔍 Verificando eventos en Google Calendar...');
    
    const eventosResponse = await obtenerEventosCalendar();
    
    if (eventosResponse.success) {
      console.log(`📅 ${eventosResponse.eventos.length} eventos encontrados en Google Calendar`);
      
      // Contar eventos relacionados con Soumaya
      const eventosSoumaya = eventosResponse.eventos.filter(evento => 
        evento.summary?.includes('Soumaya') || 
        evento.description?.includes('Soumaya') ||
        evento.summary?.includes('🌸')
      );
      
      console.log(`🌸 ${eventosSoumaya.length} eventos relacionados con Soumaya`);
    }

    console.log('');
    console.log('📊 RESUMEN SINCORNIZACIÓN:');
    console.log(`   ✅ Eventos creados: ${creados}`);
    console.log(`   ❌ Errores: ${errores}`);
    console.log(`   📋 Total procesado: ${reservasSinEvento.length}`);
    console.log('==========================================');
    console.log('');

    return {
      success: true,
      total: reservasSinEvento.length,
      creados,
      errores,
      detalles
    };

  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    console.error('Stack:', error.stack);
    return { success: false, error: error.message };
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// VERIFICAR INTEGRIDAD DE SINCRONIZACIÓN
// ═══════════════════════════════════════════════════════════════════════════

export const verificarIntegridad = async () => {
  try {
    console.log('');
    console.log('🔍 ========== VERIFICANDO INTEGRIDAD ==========');
    
    // 1. Obtener todas las reservas confirmadas
    const reservasConfirmadas = await Reservation.find({
      estado: 'confirmada'
    });
    
    console.log(`📊 ${reservasConfirmadas.length} reservas confirmadas en la base de datos`);
    
    // 2. Contar reservas con y sin evento en Google Calendar
    const conEvento = reservasConfirmadas.filter(r => r.googleCalendarEventId);
    const sinEvento = reservasConfirmadas.filter(r => !r.googleCalendarEventId);
    
    console.log(`   ✅ Con evento en Google Calendar: ${conEvento.length}`);
    console.log(`   ❌ Sin evento en Google Calendar: ${sinEvento.length}`);
    
    // 3. Verificar eventos duplicados
    const eventIds = conEvento.map(r => r.googleCalendarEventId).filter(Boolean);
    const uniqueEventIds = [...new Set(eventIds)];
    
    const duplicados = eventIds.length - uniqueEventIds.length;
    if (duplicados > 0) {
      console.warn(`⚠️ ${duplicados} posibles eventos duplicados`);
    } else {
      console.log('✅ No hay eventos duplicados');
    }
    
    // 4. Mostrar detalles de reservas sin evento
    if (sinEvento.length > 0) {
      console.log('');
      console.log('📋 Reservas que necesitan sincronización:');
      sinEvento.slice(0, 5).forEach((reserva, index) => {
        console.log(`   ${index + 1}. ${reserva.nombreCliente} - ${reserva.servicio} - ${reserva.fecha} ${reserva.horaInicio}`);
      });
      
      if (sinEvento.length > 5) {
        console.log(`   ... y ${sinEvento.length - 5} más`);
      }
    }
    
    console.log('==========================================');
    console.log('');
    
    return {
      success: true,
      totalReservas: reservasConfirmadas.length,
      conEvento: conEvento.length,
      sinEvento: sinEvento.length,
      duplicados,
      necesitaSincronizacion: sinEvento.length > 0
    };
    
  } catch (error) {
    console.error('❌ Error verificando integridad:', error);
    return { success: false, error: error.message };
  }
};