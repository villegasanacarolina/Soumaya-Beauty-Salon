import Reservation from '../models/Reservation.js';
import { enviarRecordatorio } from '../utils/whapiService.js';

// ENVIAR RECORDATORIOS DIARIOS
export const enviarRecordatoriosDiarios = async () => {
  try {
    console.log('');
    console.log('🔔 ========== EJECUTANDO RECORDATORIOS ==========');
    console.log('Fecha:', new Date().toISOString());
    
    // Calcular fecha de mañana
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    
    const year = manana.getFullYear();
    const month = String(manana.getMonth() + 1).padStart(2, '0');
    const day = String(manana.getDate()).padStart(2, '0');
    const fechaManana = `${year}-${month}-${day}`;
    
    console.log('📅 Buscando citas para:', fechaManana);
    
    // Buscar reservas confirmadas para mañana
    const reservas = await Reservation.find({
      fecha: fechaManana,
      estado: 'confirmada',
      recordatorioEnviado: { $ne: true }
    });
    
    console.log(`📊 ${reservas.length} citas encontradas para mañana`);
    
    if (reservas.length === 0) {
      console.log('✅ No hay citas para recordar mañana');
      return;
    }
    
    let enviados = 0;
    let errores = 0;
    
    for (const reserva of reservas) {
      try {
        console.log('');
        console.log(`📤 Enviando recordatorio a: ${reserva.nombreCliente}`);
        console.log(`📱 Teléfono: ${reserva.telefonoCliente}`);
        console.log(`💅 Servicio: ${reserva.servicio}`);
        console.log(`⏰ Hora: ${reserva.horaInicio}`);
        
        const resultado = await enviarRecordatorio(
          reserva.telefonoCliente,
          reserva.nombreCliente,
          reserva.servicio,
          reserva.fecha,
          reserva.horaInicio
        );
        
        if (resultado.success) {
          // Marcar como enviado
          reserva.recordatorioEnviado = true;
          reserva.esperandoRespuesta = true;
          await reserva.save();
          
          enviados++;
          console.log('✅ Recordatorio enviado');
        } else {
          errores++;
          console.error('❌ Error:', resultado.error);
        }
        
      } catch (error) {
        errores++;
        console.error(`❌ Error con ${reserva.nombreCliente}:`, error.message);
      }
    }
    
    console.log('');
    console.log('📊 RESUMEN:');
    console.log(`✅ Enviados: ${enviados}`);
    console.log(`❌ Errores: ${errores}`);
    console.log('==========================================');
    
  } catch (error) {
    console.error('❌ ERROR en cron job:', error);
  }
};

// Configurar cron job en server.js:
// cron.schedule('30 18 * * *', enviarRecordatoriosDiarios, {
//   timezone: 'America/Mexico_City'
// });