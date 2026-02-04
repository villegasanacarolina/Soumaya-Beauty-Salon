import Reservation from '../models/Reservation.js';
import { 
  crearEventoCalendar, 
  obtenerEventosCalendar,  // ← Esta función ahora sí existe
  verificarConexionCalendar,
  verificarEventoExiste 
} from './googleCalendarService.js';

// ═══════════════════════════════════════════════════════════════════════════
// SINCRONIZAR RESERVAS CON GOOGLE CALENDAR
// ═══════════════════════════════════════════════════════════════════════════
// Esta función busca todas las reservas confirmadas que NO tienen evento
// en Google Calendar y los crea automáticamente.
// ═══════════════════════════════════════════════════════════════════════════

export const syncGoogleCalendar = async () => {
  try {
    console.log('');
    console.log('🔄 ========== SINCRONIZANDO CON GOOGLE CALENDAR ==========');
    console.log('📅 Fecha/Hora:', new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }));
    
    // 1. Verificar conexión
    const conexion = await verificarConexionCalendar();
    if (!conexion.success) {
      console.error('❌ No se pudo conectar a Google Calendar');
      console.error('❌ Error:', conexion.error);
      return { success: false, error: 'Connection failed: ' + conexion.error };
    }
    
    console.log('✅ Conexión a Google Calendar verificada');
    
    // 2. Buscar reservas confirmadas sin evento en Google Calendar
    const reservasSinEvento = await Reservation.find({
      estado: 'confirmada',
      $or: [
        { googleCalendarEventId: { $exists: false } },
        { googleCalendarEventId: null },
        { googleCalendarEventId: '' }
      ]
    }).sort({ fecha: 1, horaInicio: 1 });

    console.log(`📊 ${reservasSinEvento.length} reservas sin evento en Google Calendar`);

    if (reservasSinEvento.length === 0) {
      console.log('✅ Todas las reservas ya están sincronizadas');
      console.log('==========================================');
      return { success: true, message: 'Already synced', count: 0 };
    }

    // Mostrar las reservas que se van a sincronizar
    console.log('');
    console.log('📋 Reservas a sincronizar:');
    reservasSinEvento.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.nombreCliente} - ${r.servicio} - ${r.fecha} ${r.horaInicio}`);
    });
    console.log('');

    let creados = 0;
    let errores = 0;
    let detalles = [];

    // 3. Crear eventos para cada reserva
    for (const reserva of reservasSinEvento) {
      try {
        console.log('');
        console.log(`📝 ─────────────────────────────────────────────`);
        console.log(`📝 Procesando reserva ${reserva._id}:`);
        console.log(`   👤 Cliente: ${reserva.nombreCliente}`);
        console.log(`   📱 Teléfono: ${reserva.telefonoCliente}`);
        console.log(`   💅 Servicio: ${reserva.servicio}`);
        console.log(`   📅 Fecha: ${reserva.fecha}`);
        console.log(`   ⏰ Hora: ${reserva.horaInicio} - ${reserva.horaFin}`);

        const resultado = await crearEventoCalendar(reserva);
        
        if (resultado.success) {
          // Actualizar la reserva con el ID del evento
          reserva.googleCalendarEventId = resultado.eventId;
          await reserva.save();
          
          creados++;
          console.log(`✅ Evento creado exitosamente`);
          console.log(`   🆔 Event ID: ${resultado.eventId}`);
          console.log(`   🔗 Link: ${resultado.htmlLink}`);
          
          detalles.push({
            reservaId: reserva._id,
            cliente: reserva.nombreCliente,
            fecha: reserva.fecha,
            hora: reserva.horaInicio,
            eventoId: resultado.eventId,
            status: 'created',
            link: resultado.htmlLink
          });
        } else {
          errores++;
          console.error(`❌ Error creando evento: ${resultado.error}`);
          
          detalles.push({
            reservaId: reserva._id,
            cliente: reserva.nombreCliente,
            fecha: reserva.fecha,
            hora: reserva.horaInicio,
            status: 'error',
            error: resultado.error
          });
        }
      } catch (error) {
        errores++;
        console.error(`❌ Excepción procesando reserva ${reserva._id}:`, error.message);
        
        detalles.push({
          reservaId: reserva._id,
          cliente: reserva.nombreCliente,
          status: 'exception',
          error: error.message
        });
      }
      
      // Pequeña pausa entre creaciones para no sobrecargar la API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 4. Verificar eventos existentes en Google Calendar
    console.log('');
    console.log('🔍 ─────────────────────────────────────────────');
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
    } else {
      console.warn('⚠️ No se pudieron obtener los eventos de Google Calendar');
    }

    console.log('');
    console.log('📊 ═════════════════════════════════════════════');
    console.log('📊 RESUMEN SINCRONIZACIÓN:');
    console.log(`   ✅ Eventos creados: ${creados}`);
    console.log(`   ❌ Errores: ${errores}`);
    console.log(`   📋 Total procesado: ${reservasSinEvento.length}`);
    console.log('📊 ═════════════════════════════════════════════');
    console.log('');

    return {
      success: true,
      total: reservasSinEvento.length,
      creados,
      errores,
      detalles
    };

  } catch (error) {
    console.error('❌ Error fatal en sincronización:', error);
    console.error('Stack:', error.stack);
    return { success: false, error: error.message };
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// VERIFICAR INTEGRIDAD DE SINCRONIZACIÓN
// ═══════════════════════════════════════════════════════════════════════════
// Esta función verifica que todas las reservas confirmadas tengan su
// evento correspondiente en Google Calendar.
// ═══════════════════════════════════════════════════════════════════════════

export const verificarIntegridad = async () => {
  try {
    console.log('');
    console.log('🔍 ========== VERIFICANDO INTEGRIDAD ==========');
    
    // 1. Obtener todas las reservas confirmadas
    const reservasConfirmadas = await Reservation.find({
      estado: 'confirmada'
    }).sort({ fecha: 1, horaInicio: 1 });
    
    console.log(`📊 ${reservasConfirmadas.length} reservas confirmadas en la base de datos`);
    
    // 2. Contar reservas con y sin evento en Google Calendar
    const conEvento = reservasConfirmadas.filter(r => r.googleCalendarEventId);
    const sinEvento = reservasConfirmadas.filter(r => !r.googleCalendarEventId);
    
    console.log(`   ✅ Con evento en Google Calendar: ${conEvento.length}`);
    console.log(`   ❌ Sin evento en Google Calendar: ${sinEvento.length}`);
    
    // 3. Verificar eventos duplicados (mismo eventId en múltiples reservas)
    const eventIds = conEvento.map(r => r.googleCalendarEventId).filter(Boolean);
    const uniqueEventIds = [...new Set(eventIds)];
    
    const duplicados = eventIds.length - uniqueEventIds.length;
    if (duplicados > 0) {
      console.warn(`⚠️ ${duplicados} posibles eventos duplicados`);
    } else {
      console.log('✅ No hay eventos duplicados');
    }
    
    // 4. Verificar que los eventos realmente existen en Google Calendar
    console.log('');
    console.log('🔍 Verificando eventos en Google Calendar...');
    
    let eventosValidos = 0;
    let eventosInvalidos = 0;
    const eventosParaLimpiar = [];
    
    for (const reserva of conEvento.slice(0, 10)) { // Verificar solo los primeros 10 para no sobrecargar
      const existe = await verificarEventoExiste(reserva.googleCalendarEventId);
      if (existe.exists) {
        eventosValidos++;
      } else {
        eventosInvalidos++;
        eventosParaLimpiar.push(reserva._id);
        console.warn(`   ⚠️ Evento ${reserva.googleCalendarEventId} no existe para ${reserva.nombreCliente}`);
      }
    }
    
    if (conEvento.length > 10) {
      console.log(`   ℹ️ (Verificados 10 de ${conEvento.length} eventos)`);
    }
    
    console.log(`   ✅ Eventos válidos: ${eventosValidos}`);
    console.log(`   ❌ Eventos inválidos: ${eventosInvalidos}`);
    
    // 5. Mostrar detalles de reservas sin evento
    if (sinEvento.length > 0) {
      console.log('');
      console.log('📋 Reservas que necesitan sincronización:');
      sinEvento.slice(0, 10).forEach((reserva, index) => {
        console.log(`   ${index + 1}. ${reserva.nombreCliente} - ${reserva.servicio} - ${reserva.fecha} ${reserva.horaInicio}`);
      });
      
      if (sinEvento.length > 10) {
        console.log(`   ... y ${sinEvento.length - 10} más`);
      }
    }
    
    console.log('');
    console.log('==========================================');
    console.log('');
    
    return {
      success: true,
      totalReservas: reservasConfirmadas.length,
      conEvento: conEvento.length,
      sinEvento: sinEvento.length,
      duplicados,
      eventosValidos,
      eventosInvalidos,
      eventosParaLimpiar,
      necesitaSincronizacion: sinEvento.length > 0 || eventosInvalidos > 0
    };
    
  } catch (error) {
    console.error('❌ Error verificando integridad:', error);
    return { success: false, error: error.message };
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// LIMPIAR EVENTOS HUÉRFANOS
// ═══════════════════════════════════════════════════════════════════════════
// Esta función limpia las referencias a eventos que ya no existen en
// Google Calendar, para que puedan ser re-sincronizados.
// ═══════════════════════════════════════════════════════════════════════════

export const limpiarEventosHuerfanos = async () => {
  try {
    console.log('');
    console.log('🧹 ========== LIMPIANDO EVENTOS HUÉRFANOS ==========');
    
    // Obtener reservas con eventId
    const reservasConEvento = await Reservation.find({
      estado: 'confirmada',
      googleCalendarEventId: { $exists: true, $ne: null, $ne: '' }
    });
    
    console.log(`📊 ${reservasConEvento.length} reservas con evento asignado`);
    
    let limpiados = 0;
    
    for (const reserva of reservasConEvento) {
      const existe = await verificarEventoExiste(reserva.googleCalendarEventId);
      
      if (!existe.exists) {
        console.log(`🧹 Limpiando evento huérfano de ${reserva.nombreCliente}: ${reserva.googleCalendarEventId}`);
        reserva.googleCalendarEventId = null;
        await reserva.save();
        limpiados++;
      }
      
      // Pausa para no sobrecargar la API
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`✅ ${limpiados} eventos huérfanos limpiados`);
    console.log('==========================================');
    
    return {
      success: true,
      total: reservasConEvento.length,
      limpiados
    };
    
  } catch (error) {
    console.error('❌ Error limpiando eventos:', error);
    return { success: false, error: error.message };
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// SINCRONIZACIÓN COMPLETA (VERIFICAR + LIMPIAR + SINCRONIZAR)
// ═══════════════════════════════════════════════════════════════════════════

export const sincronizacionCompleta = async () => {
  try {
    console.log('');
    console.log('🔄 ═══════════════════════════════════════════════════════');
    console.log('🔄 INICIANDO SINCRONIZACIÓN COMPLETA');
    console.log('🔄 ═══════════════════════════════════════════════════════');
    
    // 1. Verificar integridad
    console.log('');
    console.log('📍 PASO 1: Verificando integridad...');
    const integridad = await verificarIntegridad();
    
    if (!integridad.success) {
      return { success: false, error: 'Error en verificación de integridad' };
    }
    
    // 2. Limpiar eventos huérfanos si hay
    if (integridad.eventosInvalidos > 0) {
      console.log('');
      console.log('📍 PASO 2: Limpiando eventos huérfanos...');
      await limpiarEventosHuerfanos();
    } else {
      console.log('');
      console.log('📍 PASO 2: No hay eventos huérfanos que limpiar');
    }
    
    // 3. Sincronizar reservas faltantes
    console.log('');
    console.log('📍 PASO 3: Sincronizando reservas faltantes...');
    const sync = await syncGoogleCalendar();
    
    console.log('');
    console.log('🔄 ═══════════════════════════════════════════════════════');
    console.log('🔄 SINCRONIZACIÓN COMPLETA FINALIZADA');
    console.log(`   📊 Reservas totales: ${integridad.totalReservas}`);
    console.log(`   ✅ Eventos creados: ${sync.creados || 0}`);
    console.log(`   ❌ Errores: ${sync.errores || 0}`);
    console.log('🔄 ═══════════════════════════════════════════════════════');
    console.log('');
    
    return {
      success: true,
      integridad,
      sincronizacion: sync
    };
    
  } catch (error) {
    console.error('❌ Error en sincronización completa:', error);
    return { success: false, error: error.message };
  }
};