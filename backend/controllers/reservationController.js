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

    if (!serviceDurations[servicio]) {
      return res.status(400).json({ message: 'Servicio inválido' });
    }

    const duracion = serviceDurations[servicio].duracion;
    const horaFin = calcularHoraFin(horaInicio, duracion);

    const [horaInicioNum] = horaInicio.split(':').map(Number);
    const [horaFinNum] = horaFin.split(':').map(Number);

    if (horaInicioNum < 10 || horaFinNum > 20) {
      return res.status(400).json({
        message: `El servicio "${serviceDurations[servicio].nombre}" tiene una duración de ${duracion} minutos. Por favor elige otro horario dentro de 10:00 AM - 8:00 PM`
      });
    }

    const disponible = await verificarDisponibilidad(fecha, horaInicio, duracion);

    if (!disponible) {
      return res.status(400).json({ message: 'El horario seleccionado no está disponible' });
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

    try {
      await enviarConfirmacionCita(
        req.user.telefono,
        req.user.nombreCompleto,
        servicio,
        fecha,
        horaInicio
      );
    } catch (twilioError) {
      console.error('Error enviando WhatsApp:', twilioError);
    }

    res.status(201).json(reservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getWeekAvailability = async (req, res) => {
  try {
    const { fecha } = req.params;
    const { servicio } = req.query;

    if (!serviceDurations[servicio]) {
      return res.status(400).json({ message: 'Servicio inválido' });
    }

    const fechaInicio = new Date(fecha);
    const fechaFin = new Date(fecha);
    fechaFin.setDate(fechaFin.getDate() + 6);

    const reservas = await Reservation.find({
      fecha: {
        $gte: fechaInicio,
        $lte: fechaFin
      },
      estado: { $ne: 'cancelada' }
    });

    res.json(reservas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ usuario: req.user._id })
      .sort({ fecha: -1 });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const cancelReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservación no encontrada' });
    }

    if (reservation.usuario.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    reservation.estado = 'cancelada';
    await reservation.save();

    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};