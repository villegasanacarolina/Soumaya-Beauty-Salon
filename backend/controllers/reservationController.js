import Reservation from '../models/Reservation.js';
import { enviarConfirmacionCita, serviceDurations } from '../utils/twilioService.js';

const calcularHoraFin = (horaInicio, duracionMinutos) => {
  const [horas, minutos] = horaInicio.split(':').map(Number);
  const totalMinutos = horas * 60 + minutos + duracionMinutos;
  const nuevasHoras = Math.floor(totalMinutos / 60);
  const nuevosMinutos = totalMinutos % 60;
  return `${String(nuevasHoras).padStart(2, '0')}:${String(nuevosMinutos).padStart(2, '0')}`;
};

// Función para normalizar la fecha (evitar problemas de zona horaria)
const normalizarFecha = (fechaString) => {
  // Si la fecha viene como "2024-01-15"
  const [year, month, day] = fechaString.split('-').map(Number);
  
  // Crear fecha en UTC pero con el día correcto
  const fechaUTC = new Date(Date.UTC(year, month - 1, day));
  
  // Alternativa: Crear fecha en hora local (medianoche local)
  const fechaLocal = new Date(year, month - 1, day, 12, 0, 0); // Medio día para evitar problemas
  
  console.log('Normalizando fecha:', {
    fechaString,
    fechaUTC: fechaUTC.toISOString(),
    fechaLocal: fechaLocal.toISOString(),
    fechaLocalToString: fechaLocal.toString()
  });
  
  return fechaLocal; // Usar fecha local
};

const verificarDisponibilidad = async (fecha, horaInicio, duracion) => {
  const horaFin = calcularHoraFin(horaInicio, duracion);
  const fechaNormalizada = normalizarFecha(fecha);
  
  const reservasExistentes = await Reservation.find({
    fecha: {
      $gte: new Date(fechaNormalizada.setHours(0, 0, 0, 0)),
      $lt: new Date(fechaNormalizada.setHours(23, 59, 59, 999))
    },
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

    console.log('Creando reserva con:', { servicio, fecha, horaInicio });

    if (!serviceDurations[servicio]) {
      return res.status(400).json({ message: 'Servicio inválido' });
    }

    const duracion = serviceDurations[servicio].duracion;
    const horaFin = calcularHoraFin(horaInicio, duracion);

    // Validar horario de trabajo
    const [horaInicioNum] = horaInicio.split(':').map(Number);
    const [horaFinNum] = horaFin.split(':').map(Number);

    if (horaInicioNum < 10 || horaFinNum > 20) {
      return res.status(400).json({
        message: `El servicio "${serviceDurations[servicio].nombre}" tiene una duración de ${duracion} minutos. Por favor elige otro horario dentro de 10:00 AM - 8:00 PM`
      });
    }

    // Normalizar la fecha para evitar problemas de zona horaria
    const fechaNormalizada = normalizarFecha(fecha);

    const disponible = await verificarDisponibilidad(fecha, horaInicio, duracion);

    if (!disponible) {
      return res.status(400).json({ message: 'El horario seleccionado no está disponible' });
    }

    const reservation = await Reservation.create({
      usuario: req.user._id,
      nombreCliente: req.user.nombreCompleto,
      telefonoCliente: req.user.telefono,
      servicio,
      fecha: fechaNormalizada,  // <-- Usar fecha normalizada
      horaInicio,
      horaFin,
      duracion,
      estado: 'confirmada'
    });

    // Enviar WhatsApp
    try {
      await enviarConfirmacionCita(
        req.user.telefono,
        req.user.nombreCompleto,
        servicio,
        fecha, // Enviar fecha original para el mensaje
        horaInicio
      );
    } catch (twilioError) {
      console.error('Error enviando WhatsApp:', twilioError);
    }

    console.log('Reserva creada:', reservation);
    res.status(201).json(reservation);
  } catch (error) {
    console.error('Error creando reserva:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getWeekAvailability = async (req, res) => {
  try {
    const { fecha } = req.params;
    const { servicio } = req.query;

    console.log('Obteniendo disponibilidad para:', { fecha, servicio });

    if (!serviceDurations[servicio]) {
      return res.status(400).json({ message: 'Servicio inválido' });
    }

    // Normalizar fecha de inicio
    const fechaInicio = normalizarFecha(fecha);
    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaFin.getDate() + 6);

    console.log('Buscando reservas entre:', {
      fechaInicio: fechaInicio.toISOString(),
      fechaFin: fechaFin.toISOString()
    });

    const reservas = await Reservation.find({
      fecha: {
        $gte: fechaInicio,
        $lte: fechaFin
      },
      estado: { $ne: 'cancelada' }
    });

    console.log('Reservas encontradas:', reservas.length);
    res.json(reservas);
  } catch (error) {
    console.error('Error obteniendo disponibilidad:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getUserReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ usuario: req.user._id })
      .sort({ fecha: -1 });
    
    // Formatear fechas para respuesta
    const reservasFormateadas = reservations.map(reserva => ({
      ...reserva.toObject(),
      fecha: reserva.fecha.toISOString().split('T')[0] // Devolver como YYYY-MM-DD
    }));
    
    res.json(reservasFormateadas);
  } catch (error) {
    console.error('Error obteniendo reservas:', error);
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
    console.error('Error cancelando reserva:', error);
    res.status(500).json({ message: error.message });
  }
};