import Reservation from '../models/Reservation.js';
import { enviarRecordatorio } from './whapiService.js';

// ═══════════════════════════════════════════════════════════════════════════
// CRON JOB: ENVIAR RECORDATORIOS DIARIOS (6:30 PM)
// ═══════════════════════════════════════════════════════════════════════════

export const enviarRecordatoriosDiarios = async () => {
  try {
    console.log('');
    console.log('🔔 ========== EJECUTANDO RECORDATORIOS ==========');
    console.log('Timestamp:', new Date().toISOString());

    // Calcular fecha de mañana
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);

    const year  = manana.getFullYear();
    const month = String(manana.getMonth() + 1).padStart(2, '0');
    const day   = String(manana.getDate()).padStart(2, '0');
    const fechaManana = `${year}-${month}-${day}`;

    console.log('📅 Buscando citas para:', fechaManana);

    // Buscar reservas confirmadas para mañana que no tengan recordatorio
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
        console.log(`   Teléfono: ${reserva.telefonoCliente}`);
        console.log(`   Servicio: ${reserva.servicio}`);
        console.log(`   Hora: ${reserva.horaInicio}`);

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
          console.error('❌ Error:', resultado.error);
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