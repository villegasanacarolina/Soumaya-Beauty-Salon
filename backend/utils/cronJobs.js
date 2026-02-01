import Reservation from '../models/Reservation.js';
import { enviarRecordatorio } from './smsService.js';

export const enviarRecordatoriosDiarios = async () => {
  try {
    console.log('🔔 Ejecutando recordatorios diarios...');

    const manana = new Date();
    manana.setDate(manana.getDate() + 1);

    const year  = manana.getFullYear();
    const month = String(manana.getMonth() + 1).padStart(2, '0');
    const day   = String(manana.getDate()).padStart(2, '0');
    const fechaManana = `${year}-${month}-${day}`;

    const reservas = await Reservation.find({
      fecha: fechaManana,
      estado: 'confirmada',
      recordatorioEnviado: { $ne: true }
    });

    console.log(`📋 Reservas para mañana: ${reservas.length}`);

    for (const reserva of reservas) {
      try {
        await enviarRecordatorio(
          reserva.telefonoCliente,
          reserva.nombreCliente,
          reserva.servicio,
          reserva.fecha,
          reserva.horaInicio
        );

        reserva.recordatorioEnviado = true;
        await reserva.save();

        console.log(`✅ Recordatorio enviado a ${reserva.nombreCliente}`);
      } catch (error) {
        console.error(`❌ Error enviando recordatorio a ${reserva.nombreCliente}:`, error.message);
      }
    }

    console.log('✅ Recordatorios completados');
  } catch (error) {
    console.error('❌ Error en recordatorios diarios:', error);
  }
};