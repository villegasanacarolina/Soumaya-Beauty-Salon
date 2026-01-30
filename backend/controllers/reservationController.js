import Reservation from '../models/Reservation.js';
import { enviarConfirmacionCita, serviceDurations } from '../utils/twilioService.js';
import { google } from 'googleapis';

// Configurar Google Calendar
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Set credentials (necesitarás el refresh token)
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

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

// Crear evento en Google Calendar
const crearEventoCalendar = async (reserva, nombreCliente, telefonoCliente) => {
  try {
    const [year, month, day] = reserva.fecha.split('-').map(Number);
    const [horaInicio, minInicio] = reserva.horaInicio.split(':').map(Number);
    const [horaFin, minFin] = reserva.horaFin.split(':').map(Number);

    const inicio = new Date(year, month - 1, day, horaInicio, minInicio);
    const fin = new Date(year, month - 1, day, horaFin, minFin);

    const servicioInfo = serviceDurations[reserva.servicio];

    const evento = {
      summary: `${servicioInfo.nombre} - ${nombreCliente}`,
      description: `Cliente: ${nombreCliente}\nTeléfono: ${telefonoCliente}\nServicio: ${servicioInfo.nombre}\nDuración: ${reserva.duracion} minutos`,
      start: {
        dateTime: inicio.toISOString(),
        timeZone: 'America/Mexico_City',
      },
      end: {
        dateTime: fin.toISOString(),
        timeZone: 'America/Mexico_City',
      },
      colorId: '10', // Verde
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 24 * 60 }, // 1 día antes
          { method: 'popup', minutes: 60 }, // 1 hora antes
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'carovillegass13@gmail.com',
      resource: evento,
    });

    console.log('✅ Evento creado en Google Calendar:', response.data.id);
    return response.data.id;
  } catch (error) {
    console.error('❌ Error creando evento en Google Calendar:', error.message);
    // No lanzar error para no bloquear la reserva
    return null;
  }
};

export const createReservation = async (req, res) => {
  try {
    const { servicio, fecha, horaInicio } = req.body;

    console.log('📅 CREATE RESERVATION:', { servicio, fecha, horaInicio });

    if (!serviceDurations[servicio]) {
      return res.status(400).json({ message: 'Servicio inválido' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({ 
        message: 'Formato de fecha inválido. Use YYYY-MM-DD' 
      });
    }

    const duracion = serviceDurations[servicio].duracion;
    const horaFin = calcularHoraFin(horaInicio, duracion);

    const [horaInicioNum] = horaInicio.split(':').map(Number);
    const [horaFinNum] = horaFin.split(':').map(Number);

    if (horaInicioNum < 10 || horaFinNum > 20) {
      return res.status(400).json({
        message: `Horario no disponible. El salón opera de 10:00 AM a 8:00 PM`
      });
    }

    const disponible = await verificarDisponibilidad(fecha, horaInicio, duracion);

    if (!disponible) {
      return res.status(400).json({ 
        message: 'El horario seleccionado no está disponible' 
      });
    }

    // Crear la reserva
    const reservation = await Reservation.create({
      usuario: req.user._id,
      nombreCliente: req.user.nombreCompleto,
      telefonoCliente: req.user.telefono,
      servicio,
      fecha: fecha,
      horaInicio,
      horaFin,
      duracion,
      estado: 'confirmada'
    });

    console.log('✅ RESERVA CREADA:', reservation._id);

    // Crear evento en Google Calendar
    const googleEventId = await crearEventoCalendar(
      reservation,
      req.user.nombreCompleto,
      req.user.telefono
    );

    if (googleEventId) {
      reservation.googleCalendarEventId = googleEventId;
      await reservation.save();
    }

    // Enviar WhatsApp
    try {
      await enviarConfirmacionCita(
        req.user.telefono,
        req.user.nombreCompleto,
        servicio,
        fecha,
        horaInicio
      );
      console.log('✅ WhatsApp enviado correctamente');
    } catch (twilioError) {
      console.error('❌ Error enviando WhatsApp:', twilioError.message);
      // Continuar aunque falle el WhatsApp
    }

    res.status(201).json({
      ...reservation.toObject(),
      mensaje: `Cita agendada para el ${fecha} a las ${horaInicio}`
    });
  } catch (error) {
    console.error('❌ ERROR en createReservation:', error);
    
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
    const { fecha } = req.params;

    console.log('📊 GET AVAILABILITY:', { fecha });

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({ 
        message: 'Formato de fecha inválido' 
      });
    }

    const [year, month, day] = fecha.split('-').map(Number);
    const baseDate = new Date(Date.UTC(year, month - 1, day));
    
    const fechaInicio = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const fechaFinDate = new Date(baseDate);
    fechaFinDate.setUTCDate(fechaFinDate.getUTCDate() + 6);
    const fechaFin = `${fechaFinDate.getUTCFullYear()}-${String(fechaFinDate.getUTCMonth() + 1).padStart(2, '0')}-${String(fechaFinDate.getUTCDate()).padStart(2, '0')}`;

    console.log('📅 Rango:', { fechaInicio, fechaFin });

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
    console.log('👤 GET USER RESERVATIONS:', req.user._id);
    
    const reservations = await Reservation.find({ 
      usuario: req.user._id 
    }).sort({ 
      fecha: -1,
      horaInicio: -1 
    });
    
    console.log(`📋 Encontradas ${reservations.length} reservas`);
    
    const reservasFormateadas = reservations.map(reserva => ({
      _id: reserva._id,
      servicio: reserva.servicio,
      fecha: reserva.fecha,
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

    // Eliminar de Google Calendar si existe
    if (reservation.googleCalendarEventId) {
      try {
        await calendar.events.delete({
          calendarId: 'carovillegass13@gmail.com',
          eventId: reservation.googleCalendarEventId,
        });
        console.log('✅ Evento eliminado de Google Calendar');
      } catch (error) {
        console.error('❌ Error eliminando evento de Calendar:', error.message);
      }
    }

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