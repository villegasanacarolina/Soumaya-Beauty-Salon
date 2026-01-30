import Reservation from '../models/Reservation.js';
import { enviarConfirmacionCita, serviceDurations } from '../utils/twilioService.js';

const calcularHoraFin = (horaInicio, duracionMinutos) => {
  const [horas, minutos] = horaInicio.split(':').map(Number);
  const totalMinutos = horas * 60 + minutos + duracionMinutos;
  const nuevasHoras = Math.floor(totalMinutos / 60);
  const nuevosMinutos = totalMinutos % 60;
  return `${String(nuevasHoras).padStart(2, '0')}:${String(nuevosMinutos).padStart(2, '0')}`;
};

const verificarDisponibilidad = async (fecha, horaInicio, duracion) => {
  const horaFin = calcularHoraFin(horaInicio, duracion);
  
  const reservasExistentes = await Reservation.find({
    fecha: fecha,
    estado: { $ne: 'cancelada' },
    $or: [
      {
        $and: [
          { horaInicio: { $lte: horaInicio } },
          { horaFin: { $gt: horaInicio } }
        ]
      },
      {
        $and: [
          { horaInicio: { $lt: horaFin } },
          { horaFin: { $gte: horaFin } }
        ]
      },
      {
        $and: [
          { horaInicio: { $gte: horaInicio } },
          { horaFin: { $lte: horaFin } }
        ]
      }
    ]
  });

  return reservasExistentes.length === 0;
};

export const createReservation = async (req, res) => {
  try {
    const { servicio, fecha, horaInicio } = req.body;

    console.log('📅 CREATE RESERVATION:', { servicio, fecha, horaInicio, userId: req.user._id });

    if (!serviceDurations[servicio]) {
      return res.status(400).json({ message: 'Servicio inválido' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({ message: 'Formato de fecha inválido' });
    }

    const duracion = serviceDurations[servicio].duracion;
    const horaFin = calcularHoraFin(horaInicio, duracion);

    const [horaInicioNum] = horaInicio.split(':').map(Number);
    const [horaFinNum] = horaFin.split(':').map(Number);

    if (horaInicioNum < 10 || horaFinNum > 20) {
      return res.status(400).json({
        message: 'Horario no disponible. El salón opera de 10:00 AM a 8:00 PM'
      });
    }

    const disponible = await verificarDisponibilidad(fecha, horaInicio, duracion);

    if (!disponible) {
      return res.status(400).json({ message: 'El horario ya está ocupado' });
    }

    const reservation = await Reservation.create({
      usuario: req.user._id,
      nombreCliente: req.user.nombreCompleto,
      telefonoCliente: req.user.telefono,
      servicio,
      fecha,
      horaInicio,
      horaFin,
      duracion,
      estado: 'confirmada'
    });

    console.log('✅ RESERVA CREADA:', reservation._id);

    // Enviar WhatsApp (no bloquear si falla)
    try {
      await enviarConfirmacionCita(
        req.user.telefono,
        req.user.nombreCompleto,
        servicio,
        fecha,
        horaInicio
      );
      console.log('✅ WhatsApp enviado');
    } catch (twilioError) {
      console.error('❌ Error WhatsApp:', twilioError.message);
    }

    res.status(201).json(reservation);
  } catch (error) {
    console.error('❌ ERROR en createReservation:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Este horario ya está reservado' });
    }
    
    res.status(500).json({ message: 'Error al crear la reserva' });
  }
};

export const getWeekAvailability = async (req, res) => {
  try {
    const { fecha } = req.params;

    console.log('📊 GET AVAILABILITY:', { fecha });

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({ message: 'Formato de fecha inválido' });
    }

    const [year, month, day] = fecha.split('-').map(Number);
    const baseDate = new Date(Date.UTC(year, month - 1, day));
    
    const fechaInicio = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const fechaFinDate = new Date(baseDate);
    fechaFinDate.setUTCDate(fechaFinDate.getUTCDate() + 6);
    const fechaFin = `${fechaFinDate.getUTCFullYear()}-${String(fechaFinDate.getUTCMonth() + 1).padStart(2, '0')}-${String(fechaFinDate.getUTCDate()).padStart(2, '0')}`;

    const reservas = await Reservation.find({
      fecha: { $gte: fechaInicio, $lte: fechaFin },
      estado: { $ne: 'cancelada' }
    });

    console.log('🔍 Reservas encontradas:', reservas.length);
    
    res.json(reservas);
  } catch (error) {
    console.error('❌ ERROR:', error);
    res.status(500).json({ message: 'Error al obtener disponibilidad' });
  }
};

export const getUserReservations = async (req, res) => {
  try {
    console.log('👤 GET USER RESERVATIONS:', req.user._id);
    
    const reservations = await Reservation.find({ 
      usuario: req.user._id 
    }).sort({ fecha: -1, horaInicio: -1 });
    
    const reservasFormateadas = reservations.map(reserva => ({
      _id: reserva._id,
      servicio: reserva.servicio,
      fecha: reserva.fecha,
      horaInicio: reserva.horaInicio,
      horaFin: reserva.horaFin,
      duracion: reserva.duracion,
      estado: reserva.estado,
      nombreCliente: reserva.nombreCliente,
      servicioNombre: serviceDurations[reserva.servicio]?.nombre,
      fechaLegible: (() => {
        const [year, month, day] = reserva.fecha.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('es-MX', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      })()
    }));
    
    res.json(reservasFormateadas);
  } catch (error) {
    console.error('❌ ERROR:', error);
    res.status(500).json({ message: 'Error al obtener reservas' });
  }
};

export const cancelReservation = async (req, res) => {
  try {
    console.log('❌ CANCEL RESERVATION:', req.params.id);
    
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservación no encontrada' });
    }

    if (reservation.usuario.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    reservation.estado = 'cancelada';
    await reservation.save();

    console.log('✅ Reserva cancelada');
    
    res.json({ message: 'Reserva cancelada', reservation });
  } catch (error) {
    console.error('❌ ERROR:', error);
    res.status(500).json({ message: 'Error al cancelar reserva' });
  }
};