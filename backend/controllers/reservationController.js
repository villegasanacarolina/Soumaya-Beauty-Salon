import crypto from 'crypto';
import Reservation from '../models/Reservation.js';
import { enviarConfirmacionWhatsApp, generarWhatsappDeepLink, notificarSalon, serviceDurations } from '../utils/whatsappService.js';
import { crearEventoCalendar, eliminarEventoCalendar } from '../utils/googleCalendarService.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const calcularHoraFin = (horaInicio, duracionMinutos) => {
  const [horas, minutos] = horaInicio.split(':').map(Number);
  const totalMinutos     = horas * 60 + minutos + duracionMinutos;
  const nuevasHoras      = Math.floor(totalMinutos / 60);
  const nuevosMinutos    = totalMinutos % 60;
  return `${String(nuevasHoras).padStart(2, '0')}:${String(nuevosMinutos).padStart(2, '0')}`;
};

const verificarDisponibilidad = async (fecha, horaInicio, duracion) => {
  const horaFin = calcularHoraFin(horaInicio, duracion);

  const reservasExistentes = await Reservation.find({
    fecha,
    estado: 'confirmada',
    $or: [
      { horaInicio: { $lte: horaInicio }, horaFin: { $gt: horaInicio } },
      { horaInicio: { $lt: horaFin },     horaFin: { $gte: horaFin }  },
      { horaInicio: { $gte: horaInicio }, horaFin: { $lte: horaFin }  }
    ]
  });

  return reservasExistentes.length === 0;
};

// ─── Crear reserva ────────────────────────────────────────────────────────────
// FLUJO COMPLETO:
// 1. Validar datos y crear reserva en MongoDB
// 2. Crear evento en Google Calendar → guardar eventId en la reserva
// 3. Generar deep link de WhatsApp y retornarlo al frontend
// 4. El frontend abre el deep link (abre WhatsApp prellenado con "join <keyword>")
// 5. Cuando la clienta envía "join", Twilio llama al webhook
// 6. El webhook detecta la reserva con estadoEncuesta='pendiente_conexion'
//    y envía el WhatsApp de confirmación + encuesta

export const createReservation = async (req, res) => {
  try {
    const { servicio, fecha, horaInicio } = req.body;

    console.log('📅 ========== CREAR RESERVA ==========');
    console.log('Usuario:', req.user.nombreCompleto);
    console.log('Teléfono:', req.user.telefono);
    console.log('Servicio:', servicio);
    console.log('Fecha:', fecha);
    console.log('Hora:', horaInicio);

    // ── Validaciones ────────────────────────────────────────────────────
    if (!serviceDurations[servicio]) {
      return res.status(400).json({ message: 'Servicio inválido' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({ message: 'Formato de fecha inválido' });
    }

    const duracion = serviceDurations[servicio].duracion;
    const horaFin  = calcularHoraFin(horaInicio, duracion);

    const [horaInicioNum] = horaInicio.split(':').map(Number);
    const [horaFinNum]    = horaFin.split(':').map(Number);

    if (horaInicioNum < 10 || horaFinNum > 20) {
      return res.status(400).json({
        message: 'Horario no disponible. El salón opera de 10:00 AM a 8:00 PM'
      });
    }

    const disponible = await verificarDisponibilidad(fecha, horaInicio, duracion);
    if (!disponible) {
      return res.status(400).json({ message: 'El horario ya está ocupado' });
    }

    // ── 1. Crear reserva en MongoDB ─────────────────────────────────────
    const cancelToken = crypto.randomBytes(32).toString('hex');

    const reservation = await Reservation.create({
      usuario:         req.user._id,
      nombreCliente:   req.user.nombreCompleto,
      telefonoCliente: req.user.telefono,
      servicio,
      fecha,
      horaInicio,
      horaFin,
      duracion,
      estado:          'confirmada',
      cancelToken,
      // La clienta aún no se ha conectado al WhatsApp sandbox
      estadoEncuesta:  'pendiente_conexion',
      precio:          serviceDurations[servicio].precio
    });

    console.log('✅ RESERVA CREADA:', reservation._id);

    // ── 2. Crear evento en Google Calendar ──────────────────────────────
    try {
      const calendarResult = await crearEventoCalendar(reservation);
      if (calendarResult.success) {
        reservation.googleCalendarEventId = calendarResult.eventId;
        await reservation.save();
        console.log('✅ Evento en Google Calendar:', calendarResult.eventId);
      }
    } catch (e) {
      console.error('⚠️ Error con Google Calendar:', e.message);
    }

    // ── 3. Notificar al salón por WhatsApp ──────────────────────────────
    try {
      await notificarSalon(reservation);
    } catch (e) {
      console.error('⚠️ Error notificando salón:', e.message);
    }

    // ── 4. Generar deep link de WhatsApp ────────────────────────────────
    // Este link se retorna al frontend para que lo abra automáticamente
    const whatsappDeepLink = generarWhatsappDeepLink();

    console.log('📲 Deep link WhatsApp generado');
    console.log('========== FIN CREAR RESERVA ==========');

    // Retornar la reserva + el deep link para que el frontend lo abra
    res.status(201).json({
      ...reservation.toObject(),
      whatsappDeepLink  // El frontend debe abrir este link inmediatamente
    });

  } catch (error) {
    console.error('❌ ERROR:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Este horario ya está reservado' });
    }
    res.status(500).json({ message: 'Error al crear la reserva' });
  }
};

// ─── Disponibilidad semanal ───────────────────────────────────────────────────

export const getWeekAvailability = async (req, res) => {
  try {
    const { fecha } = req.params;

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
      estado: 'confirmada'
    });

    console.log(`✅ Reservas confirmadas: ${reservas.length}`);
    res.json(reservas);

  } catch (error) {
    console.error('❌ ERROR:', error);
    res.status(500).json({ message: 'Error al obtener disponibilidad' });
  }
};

// ─── Reservas del usuario ─────────────────────────────────────────────────────

export const getUserReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({
      usuario: req.user._id
    }).sort({ fecha: -1, horaInicio: -1 });

    const reservasFormateadas = reservations.map(reserva => {
      const [year, month, day] = reserva.fecha.split('-').map(Number);
      const date = new Date(year, month - 1, day);

      return {
        _id:            reserva._id,
        servicio:       reserva.servicio,
        fecha:          reserva.fecha,
        horaInicio:     reserva.horaInicio,
        horaFin:        reserva.horaFin,
        duracion:       reserva.duracion,
        estado:         reserva.estado,
        nombreCliente:  reserva.nombreCliente,
        servicioNombre: serviceDurations[reserva.servicio]?.nombre,
        fechaLegible:   date.toLocaleDateString('es-MX', {
          weekday: 'long',
          year:    'numeric',
          month:   'long',
          day:     'numeric'
        })
      };
    });

    res.json(reservasFormateadas);

  } catch (error) {
    console.error('❌ ERROR:', error);
    res.status(500).json({ message: 'Error al obtener reservas' });
  }
};

// ─── Cancelar reserva (desde la página web) ──────────────────────────────────
// Cancela en MongoDB Y elimina el evento de Google Calendar

export const cancelReservation = async (req, res) => {
  try {
    console.log('❌ ========== CANCELAR RESERVA (desde página) ==========');
    console.log('ID:', req.params.id);

    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservación no encontrada' });
    }

    if (reservation.usuario.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    // Cancelar en MongoDB
    reservation.estado         = 'cancelada';
    reservation.cancelToken    = null;
    reservation.estadoEncuesta = 'completada';
    await reservation.save();

    // Eliminar de Google Calendar
    if (reservation.googleCalendarEventId) {
      try {
        await eliminarEventoCalendar(reservation.googleCalendarEventId);
        console.log('✅ Evento eliminado de Google Calendar');
      } catch (e) {
        console.error('⚠️ Error eliminando de Google Calendar:', e.message);
      }
    }

    console.log('✅ Reserva cancelada:', reservation._id);
    console.log('========== FIN CANCELAR ==========');

    res.json({
      message: 'Reserva cancelada',
      reservation: {
        _id:    reservation._id,
        estado: reservation.estado
      }
    });

  } catch (error) {
    console.error('❌ ERROR:', error);
    res.status(500).json({ message: 'Error al cancelar reserva' });
  }
};

// ─── Eliminar reserva del historial ───────────────────────────────────────────

export const deleteReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservación no encontrada' });
    }

    if (reservation.usuario.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    await Reservation.findByIdAndDelete(req.params.id);
    console.log('🗑️ Reserva eliminada:', req.params.id);

    res.json({ message: 'Reserva eliminada del historial' });

  } catch (error) {
    console.error('❌ ERROR:', error);
    res.status(500).json({ message: 'Error al eliminar reserva' });
  }
};