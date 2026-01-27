import cron from 'node-cron';
import Reservation from '../models/Reservation.js';
import { enviarRecordatorio } from './twilioService.js';

const iniciarRecordatorios = () => {
  cron.schedule('0 10 * * *', async () => {
    console.log('⏰ Ejecutando recordatorios diarios...');

    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    manana.setHours(0, 0, 0, 0);

    const pasadoManana = new Date(manana);
    pasadoManana.setDate(pasadoManana.getDate() + 1);

    try {
      const reservasManana = await Reservation.find({
        fecha: {
          $gte: manana,
          $lt: pasadoManana
        },
        estado: 'confirmada',
        recordatorioEnviado: false
      });

      for (const reserva of reservasManana) {
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
        } catch (error) {
          console.error(`Error enviando recordatorio para reserva ${reserva._id}:`, error);
        }
      }

      console.log(`✅ Recordatorios enviados: ${reservasManana.length}`);
    } catch (error) {
      console.error('❌ Error en cron de recordatorios:', error);
    }
  });
};

export default iniciarRecordatorios;