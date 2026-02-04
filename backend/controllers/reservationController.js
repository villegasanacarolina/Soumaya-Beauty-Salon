import Reservation from '../models/Reservation.js';
import {
  enviarConfirmacionCita,
  notificarSalonNuevaCita,
  notificarSalonCancelacion,
  enviarMensajeCancelacionConfirmada,
  serviceDurations
} from '../utils/whapiService.js';
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

// ═══════════════════════════════════════════════════════════════════════════
// CREAR RESERVA
// ═══════════════════════════════════════════════════════════════════════════
export const createReservation = async (req, res) => {
  try {
    const { servicio, fecha, horaInicio } = req.body;

    console.log('📅 ========== CREAR RESERVA ==========');
    console.log('Usuario:', req.user.nombreCompleto);
    console.log('Teléfono:', req.user.telefono);
    console.log('Servicio:', servicio);
    console.log('Fecha:', fecha);
    console.log('Hora:', horaInicio);

    // Validaciones
    if (!serviceDurations[servicio]) {
      return res.status(400).json({ message: 'Servicio inválido' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({ message: 'Formato de fecha inválido' });
    }

    const duracion = serviceDurations[servicio].duracion;
    const horaFin  = calcularHoraFin(horaInicio, duracion);
    const precio   = serviceDurations[servicio].precio;

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
    const reservation = await Reservation.create({
      usuario:         req.user._id,
      nombreCliente:   req.user.nombreCompleto,
      telefonoCliente: req.user.telefono,
      servicio,
      fecha,
      horaInicio,
      horaFin,
      duracion,
      precio,
      estado:          'confirmada',
      esperandoRespuesta: false,
      recordatorioEnviado: false
    });

    console.log('✅ RESERVA CREADA:', reservation._id);

    // ── 2. Crear evento en Google Calendar ──────────────────────────────
    let calendarEventId = null;
    try {
      const calendarResult = await crearEventoCalendar(reservation);
      if (calendarResult.success) {
        reservation.googleCalendarEventId = calendarResult.eventId;
        calendarEventId = calendarResult.eventId;
        await reservation.save();
        console.log('✅ Evento en Google Calendar:', calendarResult.eventId);
      }
    } catch (e) {
      console.error('⚠️ Error con Google Calendar:', e.message);
    }

    // ── 3. Enviar WhatsApp de confirmación al cliente ───────────────────
    try {
      const resultadoConfirmacion = await enviarConfirmacionCita(reservation);
      if (resultadoConfirmacion.success) {
        reservation.esperandoRespuesta = true;
        await reservation.save();
        console.log('✅ WhatsApp de confirmación enviado al cliente');
      }
    } catch (e) {
      console.error('⚠️ Error enviando confirmación:', e.message);
    }

    // ── 4. Notificar al salón ───────────────────────────────────────────
    try {
      await notificarSalonNuevaCita(reservation);
      console.log('✅ Salón notificado');
    } catch (e) {
      console.error('⚠️ Error notificando salón:', e.message);
    }

    console.log('========== FIN CREAR RESERVA ==========');

    // ── 5. Generar WhatsApp deep link ───────────────────────────────────
    const whatsappDeepLink = `https://wa.me/521${req.user.telefono}?text=Hola ${encodeURIComponent(req.user.nombreCompleto)}, tu cita para ${serviceDurations[servicio].nombre} el ${fecha} a las ${horaInicio} ha sido confirmada. ¿Deseas cancelar? Responde Sí o No.`;

    res.status(201).json({
      ...reservation.toObject(),
      whatsappDeepLink,
      calendarEventId,
      message: 'Reserva creada exitosamente. Se ha enviado confirmación por WhatsApp.'
    });

  } catch (error) {
    console.error('❌ ERROR:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Este horario ya está reservado' });
    }
    res.status(500).json({ message: 'Error al crear la reserva', error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// DISPONIBILIDAD SEMANAL
// ═══════════════════════════════════════════════════════════════════════════
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
    }).sort({ fecha: 1, horaInicio: 1 });

    console.log(`📊 Disponibilidad semanal: ${reservas.length} reservas confirmadas`);
    
    // Formatear respuesta
    const disponibilidad = reservas.map(reserva => ({
      _id: reserva._id,
      servicio: reserva.servicio,
      nombreCliente: reserva.nombreCliente,
      fecha: reserva.fecha,
      horaInicio: reserva.horaInicio,
      horaFin: reserva.horaFin,
      duracion: reserva.duracion,
      servicioNombre: serviceDurations[reserva.servicio]?.nombre,
      googleCalendarEventId: reserva.googleCalendarEventId
    }));

    res.json(disponibilidad);

  } catch (error) {
    console.error('❌ ERROR:', error);
    res.status(500).json({ message: 'Error al obtener disponibilidad', error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// RESERVAS DEL USUARIO
// ═══════════════════════════════════════════════════════════════════════════
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
        precio:         reserva.precio,
        estado:         reserva.estado,
        nombreCliente:  reserva.nombreCliente,
        servicioNombre: serviceDurations[reserva.servicio]?.nombre,
        fechaLegible:   date.toLocaleDateString('es-MX', {
          weekday: 'long',
          year:    'numeric',
          month:   'long',
          day:     'numeric'
        }),
        googleCalendarEventId: reserva.googleCalendarEventId,
        esperandoRespuesta: reserva.esperandoRespuesta,
        recordatorioEnviado: reserva.recordatorioEnviado,
        createdAt: reserva.createdAt
      };
    });

    console.log(`📋 Reservas del usuario ${req.user.nombreCompleto}: ${reservations.length}`);
    res.json(reservasFormateadas);

  } catch (error) {
    console.error('❌ ERROR:', error);
    res.status(500).json({ message: 'Error al obtener reservas', error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// CANCELAR RESERVA (desde web)
// ═══════════════════════════════════════════════════════════════════════════
export const cancelReservation = async (req, res) => {
  try {
    console.log('❌ ========== CANCELAR RESERVA DESDE WEB ==========');
    console.log('ID:', req.params.id);
    console.log('Usuario:', req.user.nombreCompleto);

    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservación no encontrada' });
    }

    if (reservation.usuario.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    if (reservation.estado === 'cancelada') {
      return res.status(400).json({ message: 'La reserva ya está cancelada' });
    }

    // Cancelar en MongoDB
    reservation.estado = 'cancelada';
    reservation.esperandoRespuesta = false;
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

    // Notificar al salón
    try {
      await notificarSalonCancelacion(reservation);
      console.log('✅ Salón notificado');
    } catch (e) {
      console.error('⚠️ Error notificando salón:', e.message);
    }

    // Confirmar cancelación al cliente
    try {
      await enviarMensajeCancelacionConfirmada(reservation);
      console.log('✅ Confirmación de cancelación enviada al cliente');
    } catch (e) {
      console.error('⚠️ Error enviando confirmación:', e.message);
    }

    console.log('✅ Reserva cancelada:', reservation._id);
    console.log('========== FIN CANCELAR ==========');

    res.json({
      message: 'Reserva cancelada exitosamente',
      reservation: {
        _id:    reservation._id,
        estado: reservation.estado
      }
    });

  } catch (error) {
    console.error('❌ ERROR:', error);
    res.status(500).json({ message: 'Error al cancelar reserva', error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// ELIMINAR RESERVA DEL HISTORIAL
// ═══════════════════════════════════════════════════════════════════════════
export const deleteReservation = async (req, res) => {
  try {
    console.log('🗑️ ========== ELIMINAR RESERVA DEL HISTORIAL ==========');
    console.log('ID:', req.params.id);

    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservación no encontrada' });
    }

    if (reservation.usuario.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    // Si la reserva está confirmada y tiene evento en Google Calendar, eliminarlo
    if (reservation.estado === 'confirmada' && reservation.googleCalendarEventId) {
      try {
        await eliminarEventoCalendar(reservation.googleCalendarEventId);
        console.log('✅ Evento eliminado de Google Calendar');
      } catch (e) {
        console.error('⚠️ Error eliminando de Google Calendar:', e.message);
      }
    }

    await Reservation.findByIdAndDelete(req.params.id);
    console.log('🗑️ Reserva eliminada:', req.params.id);

    res.json({ message: 'Reserva eliminada del historial' });

  } catch (error) {
    console.error('❌ ERROR:', error);
    res.status(500).json({ message: 'Error al eliminar reserva', error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// SINCORNIZAR CON GOOGLE CALENDAR (para administración)
// ═══════════════════════════════════════════════════════════════════════════
export const syncWithGoogleCalendar = async (req, res) => {
  try {
    console.log('🔄 ========== SINCORNIZAR CON GOOGLE CALENDAR ==========');
    
    const reservasSinEvento = await Reservation.find({
      estado: 'confirmada',
      googleCalendarEventId: { $in: [null, ''] }
    });

    console.log(`📊 ${reservasSinEvento.length} reservas sin evento en Google Calendar`);

    let creados = 0;
    let errores = 0;

    for (const reserva of reservasSinEvento) {
      try {
        const resultado = await crearEventoCalendar(reserva);
        if (resultado.success) {
          reserva.googleCalendarEventId = resultado.eventId;
          await reserva.save();
          creados++;
          console.log(`✅ Evento creado para reserva ${reserva._id}`);
        } else {
          errores++;
          console.error(`❌ Error creando evento para reserva ${reserva._id}:`, resultado.error);
        }
      } catch (error) {
        errores++;
        console.error(`❌ Error sincronizando reserva ${reserva._id}:`, error.message);
      }
    }

    console.log('🔄 Sincronización completada');
    console.log(`✅ Creados: ${creados}`);
    console.log(`❌ Errores: ${errores}`);

    res.json({
      message: 'Sincronización completada',
      total: reservasSinEvento.length,
      creados,
      errores
    });

  } catch (error) {
    console.error('❌ ERROR:', error);
    res.status(500).json({ message: 'Error en sincronización', error: error.message });
  }
};