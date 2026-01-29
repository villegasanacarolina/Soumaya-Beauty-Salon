import Reservation from '../models/Reservation.js';
import { enviarConfirmacionCita, serviceDurations } from '../utils/twilioService.js';

const calcularHoraFin = (horaInicio, duracionMinutos) => {
  const [horas, minutos] = horaInicio.split(':').map(Number);
  const totalMinutos = horas * 60 + minutos + duracionMinutos;
  const nuevasHoras = Math.floor(totalMinutos / 60);
  const nuevosMinutos = totalMinutos % 60;
  return `${String(nuevasHoras).padStart(2, '0')}:${String(nuevosMinutos).padStart(2, '0')}`;
};

// Función para convertir fecha string a Date para consultas
const stringToDate = (fechaString) => {
  const [year, month, day] = fechaString.split('-').map(Number);
  // Crear fecha en UTC a mediodía para evitar problemas de zona horaria
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
};

const verificarDisponibilidad = async (fecha, horaInicio, duracion) => {
  const horaFin = calcularHoraFin(horaInicio, duracion);
  
  // Ahora fecha es string (YYYY-MM-DD), usarlo directamente
  const reservasExistentes = await Reservation.find({
    fecha: fecha, // Usar string directamente
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

    console.log('📅 CREATE RESERVATION - Recibido:', {
      servicio,
      fecha, // Esto debería ser "2024-01-15"
      horaInicio,
      bodyCompleto: req.body
    });

    if (!serviceDurations[servicio]) {
      return res.status(400).json({ message: 'Servicio inválido' });
    }

    // Validar formato de fecha
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({ 
        message: 'Formato de fecha inválido. Use YYYY-MM-DD' 
      });
    }

    const duracion = serviceDurations[servicio].duracion;
    const horaFin = calcularHoraFin(horaInicio, duracion);

    // Validar horario de trabajo (10:00 - 20:00)
    const [horaInicioNum] = horaInicio.split(':').map(Number);
    const [horaFinNum] = horaFin.split(':').map(Number);

    if (horaInicioNum < 10 || horaFinNum > 20) {
      return res.status(400).json({
        message: `Horario no disponible. El salón opera de 10:00 AM a 8:00 PM`
      });
    }

    // Verificar disponibilidad usando fecha como string
    const disponible = await verificarDisponibilidad(fecha, horaInicio, duracion);

    if (!disponible) {
      return res.status(400).json({ 
        message: 'El horario seleccionado no está disponible' 
      });
    }

    // Crear la reserva con fecha como string
    const reservation = await Reservation.create({
      usuario: req.user._id,
      nombreCliente: req.user.nombreCompleto,
      telefonoCliente: req.user.telefono,
      servicio,
      fecha: fecha, // Guardar como string "2024-01-15"
      horaInicio,
      horaFin,
      duracion,
      estado: 'confirmada'
    });

    console.log('✅ RESERVA CREADA:', {
      id: reservation._id,
      fechaGuardada: reservation.fecha, // Debería ser "2024-01-15"
      horaInicio: reservation.horaInicio,
      servicio: reservation.servicio
    });

    // Enviar WhatsApp
    try {
      await enviarConfirmacionCita(
        req.user.telefono,
        req.user.nombreCompleto,
        servicio,
        fecha, // Enviar la fecha como string
        horaInicio
      );
    } catch (twilioError) {
      console.error('❌ Error enviando WhatsApp:', twilioError);
    }

    res.status(201).json({
      ...reservation.toObject(),
      mensaje: `Cita agendada para el ${fecha} a las ${horaInicio}`
    });
  } catch (error) {
    console.error('❌ ERROR en createReservation:', error);
    
    // Manejar error de duplicado
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Este horario ya está reservado' 
      });
    }
    
    res.status(500).json({ 
      message: 'Error al crear la reserva',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getWeekAvailability = async (req, res) => {
  try {
    const { fecha } = req.params; // "2024-01-15"
    const { servicio } = req.query;

    console.log('📊 GET AVAILABILITY - Parámetros:', { fecha, servicio });

    if (!serviceDurations[servicio]) {
      return res.status(400).json({ message: 'Servicio inválido' });
    }

    // Validar formato de fecha base
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({ 
        message: 'Formato de fecha inválido' 
      });
    }

    // Obtener todas las reservas de la semana
    // Como fecha es string, necesitamos calcular el rango de strings
    const [year, month, day] = fecha.split('-').map(Number);
    const baseDate = new Date(Date.UTC(year, month - 1, day));
    
    const fechaInicio = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Calcular fecha fin (6 días después)
    const fechaFinDate = new Date(baseDate);
    fechaFinDate.setUTCDate(fechaFinDate.getUTCDate() + 6);
    const fechaFin = `${fechaFinDate.getUTCFullYear()}-${String(fechaFinDate.getUTCMonth() + 1).padStart(2, '0')}-${String(fechaFinDate.getUTCDate()).padStart(2, '0')}`;

    console.log('📅 Rango de búsqueda:', { fechaInicio, fechaFin });

    // Buscar todas las reservas en el rango
    const reservas = await Reservation.find({
      fecha: { 
        $gte: fechaInicio, 
        $lte: fechaFin 
      },
      estado: { $ne: 'cancelada' }
    });

    console.log('🔍 Reservas encontradas:', reservas.length);
    
    res.json(reservas);
  } catch (error) {
    console.error('❌ ERROR en getWeekAvailability:', error);
    res.status(500).json({ 
      message: 'Error al obtener disponibilidad',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getUserReservations = async (req, res) => {
  try {
    console.log('👤 GET USER RESERVATIONS para usuario:', req.user._id);
    
    const reservations = await Reservation.find({ 
      usuario: req.user._id 
    }).sort({ 
      fecha: -1,  // Ordenar por fecha descendente
      horaInicio: -1 
    });
    
    console.log(`📋 Encontradas ${reservations.length} reservas`);
    
    // Formatear respuesta
    const reservasFormateadas = reservations.map(reserva => ({
      _id: reserva._id,
      servicio: reserva.servicio,
      fecha: reserva.fecha, // Ya es string "YYYY-MM-DD"
      horaInicio: reserva.horaInicio,
      horaFin: reserva.horaFin,
      duracion: reserva.duracion,
      estado: reserva.estado,
      nombreCliente: reserva.nombreCliente,
      servicioNombre: serviceDurations[reserva.servicio]?.nombre || reserva.servicio,
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
    console.error('❌ ERROR en getUserReservations:', error);
    res.status(500).json({ 
      message: 'Error al obtener reservas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const cancelReservation = async (req, res) => {
  try {
    console.log('❌ CANCEL RESERVATION ID:', req.params.id);
    
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservación no encontrada' });
    }

    if (reservation.usuario.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    reservation.estado = 'cancelada';
    await reservation.save();

    console.log('✅ Reserva cancelada:', reservation._id);
    
    res.json({
      ...reservation.toObject(),
      mensaje: 'Reserva cancelada exitosamente'
    });
  } catch (error) {
    console.error('❌ ERROR en cancelReservation:', error);
    res.status(500).json({ 
      message: 'Error al cancelar reserva',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};