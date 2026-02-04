import Reservation from '../models/Reservation.js';
import { enviarRecordatorio } from '../utils/whapiService.js';

// ═══════════════════════════════════════════════════════════════════════════
// CRON JOB: ENVIAR RECORDATORIOS DIARIOS (6:30 PM)
// ═══════════════════════════════════════════════════════════════════════════

export const enviarRecordatoriosDiarios = async () => {
  try {
    console.log('');
    console.log('🔔 ========== EJECUTANDO RECORDATORIOS ==========');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Hora México:', new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }));

    // Calcular fecha de mañana
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);

    const year  = manana.getFullYear();
    const month = String(manana.getMonth() + 1).padStart(2, '0');
    const day   = String(manana.getDate()).padStart(2, '0');
    const fechaManana = `${year}-${month}-${day}`;

    console.log('📅 Buscando citas para:', fechaManana);
    console.log('📅 Día de mañana:', manana.toLocaleDateString('es-MX', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));

    // Buscar reservas confirmadas para mañana que no tengan recordatorio enviado
    const reservas = await Reservation.find({
      fecha: fechaManana,
      estado: 'confirmada',
      recordatorioEnviado: { $ne: true }
    });

    console.log(`📋 Reservas encontradas: ${reservas.length}`);

    if (reservas.length === 0) {
      console.log('✅ No hay citas para recordar mañana');
      console.log('==========================================');
      console.log('');
      return;
    }

    let enviados = 0;
    let errores = 0;

    for (const reserva of reservas) {
      try {
        console.log('');
        console.log(`📤 Enviando recordatorio a: ${reserva.nombreCliente}`);
        console.log(`   📱 Teléfono: ${reserva.telefonoCliente}`);
        console.log(`   💅 Servicio: ${reserva.servicio}`);
        console.log(`   ⏰ Hora: ${reserva.horaInicio}`);
        console.log(`   🆔 ID: ${reserva._id}`);

        const resultado = await enviarRecordatorio(
          reserva.telefonoCliente,
          reserva.nombreCliente,
          reserva.servicio,
          reserva.fecha,
          reserva.horaInicio
        );

        if (resultado.success) {
          // Marcar como enviado y esperando respuesta
          reserva.recordatorioEnviado = true;
          reserva.esperandoRespuesta = true;
          await reserva.save();

          console.log('✅ Recordatorio enviado y marcado');
          enviados++;
        } else {
          console.error('❌ Error enviando recordatorio:', resultado.error);
          errores++;
        }

      } catch (error) {
        console.error(`❌ Error con ${reserva.nombreCliente}:`, error.message);
        errores++;
      }
    }

    console.log('');
    console.log('📊 RESUMEN:');
    console.log(`   ✅ Enviados: ${enviados}`);
    console.log(`   ❌ Errores: ${errores}`);
    console.log('==========================================');
    console.log('');

  } catch (error) {
    console.error('❌ Error en cron job de recordatorios:', error);
    console.error('Stack:', error.stack);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// CRON JOB: LIMPIAR RESERVAS CANCELADAS ANTIGUAS (1 vez por semana)
// ═══════════════════════════════════════════════════════════════════════════

export const limpiarReservasAntiguas = async () => {
  try {
    console.log('');
    console.log('🧹 ========== LIMPIANDO RESERVAS ANTIGUAS ==========');
    
    // Fecha límite: 30 días atrás
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 30);
    
    console.log('🗓️ Fecha límite:', fechaLimite.toISOString());

    // Buscar reservas canceladas o completadas antiguas
    const reservas = await Reservation.find({
      estado: { $in: ['cancelada', 'completada'] },
      createdAt: { $lt: fechaLimite }
    });

    console.log(`📋 Reservas antiguas encontradas: ${reservas.length}`);

    if (reservas.length === 0) {
      console.log('✅ No hay reservas antiguas para limpiar');
      console.log('==========================================');
      console.log('');
      return;
    }

    let eliminadas = 0;
    let errores = 0;

    for (const reserva of reservas) {
      try {
        // Si tiene evento en Google Calendar, eliminarlo primero
        if (reserva.googleCalendarEventId && reserva.estado === 'cancelada') {
          try {
            // Ya debería estar eliminado, pero por si acaso
            console.log(`🗑️ Eliminando reserva: ${reserva._id}`);
            await Reservation.findByIdAndDelete(reserva._id);
            eliminadas++;
          } catch (error) {
            console.error(`❌ Error eliminando reserva ${reserva._id}:`, error.message);
            errores++;
          }
        } else {
          // Eliminar directamente
          await Reservation.findByIdAndDelete(reserva._id);
          eliminadas++;
        }
      } catch (error) {
        console.error(`❌ Error procesando reserva ${reserva._id}:`, error.message);
        errores++;
      }
    }

    console.log('');
    console.log('📊 RESUMEN LIMPIEZA:');
    console.log(`   🗑️ Eliminadas: ${eliminadas}`);
    console.log(`   ❌ Errores: ${errores}`);
    console.log('==========================================');
    console.log('');

  } catch (error) {
    console.error('❌ Error en cron job de limpieza:', error);
    console.error('Stack:', error.stack);
  }
};