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
      return res.status(400).json({ 
        success: false,
        message: 'Servicio inválido' 
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({ 
        success: false,
        message: 'Formato de fecha inválido. Use YYYY-MM-DD' 
      });
    }

    const duracion = serviceDurations[servicio].duracion;
    const horaFin  = calcularHoraFin(horaInicio, duracion);
    const precio   = serviceDurations[servicio].precio;

    const [horaInicioNum] = horaInicio.split(':').map(Number);
    const [horaFinNum]    = horaFin.split(':').map(Number);

    if (horaInicioNum < 10 || horaFinNum > 20) {
      return res.status(400).json({
        success: false,
        message: 'Horario no disponible. El salón opera de 10:00 AM a 8:00 PM'
      });
    }

    const disponible = await verificarDisponibilidad(fecha, horaInicio, duracion);
    if (!disponible) {
      return res.status(400).json({ 
        success: false,
        message: 'El horario ya está ocupado. Por favor selecciona otro horario.' 
      });
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
      esperandoRespuesta: true,
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
    let whatsappEnviado = false;
    let whatsappError = null;
    try {
      const resultadoConfirmacion = await enviarConfirmacionCita(reservation);
      if (resultadoConfirmacion.success) {
        whatsappEnviado = true;
        console.log('✅ WhatsApp de confirmación enviado AUTOMÁTICAMENTE al cliente');
      } else {
        whatsappError = resultadoConfirmacion.error;
        console.error('⚠️ Error enviando WhatsApp:', resultadoConfirmacion.error);
      }
    } catch (e) {
      whatsappError = e.message;
      console.error('⚠️ Error enviando confirmación:', e.message);
    }

    // ── 4. Notificar al salón ───────────────────────────────────────────
    let salonNotificado = false;
    try {
      await notificarSalonNuevaCita(reservation);
      salonNotificado = true;
      console.log('✅ Salón notificado AUTOMÁTICAMENTE');
    } catch (e) {
      console.error('⚠️ Error notificando salón:', e.message);
    }

    console.log('========== FIN CREAR RESERVA ==========');

    // Formatear respuesta
    const [year, month, day] = reservation.fecha.split('-').map(Number);
    const fechaObj = new Date(year, month - 1, day);
    const fechaLegible = fechaObj.toLocaleDateString('es-MX', {
      weekday: 'long',
      year:    'numeric',
      month:   'long',
      day:     'numeric'
    });

    res.status(201).json({
      success: true,
      reservation: {
        ...reservation.toObject(),
        servicioNombre: serviceDurations[reservation.servicio]?.nombre,
        fechaLegible
      },
      calendarEventId,
      whatsappEnviado,
      salonNotificado,
      whatsappError,
      message: whatsappEnviado 
        ? '✅ Cita creada y confirmación enviada por WhatsApp' 
        : '✅ Cita creada. Hubo un error enviando WhatsApp, pero la cita está confirmada.'
    });

  } catch (error) {
    console.error('❌ ERROR:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'Este horario ya está reservado' 
      });
    }
    res.status(500).json({ 
      success: false,
      message: 'Error al crear la reserva', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// DISPONIBILIDAD SEMANAL
// ═══════════════════════════════════════════════════════════════════════════
export const getWeekAvailability = async (req, res) => {
  try {
    const { fecha } = req.params;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({ 
        success: false,
        message: 'Formato de fecha inválido. Use YYYY-MM-DD' 
      });
    }

    const [year, month, day] = fecha.split('-').map(Number);
    const baseDate = new Date(Date.UTC(year, month - 1, day));

    const fechaInicio = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const fechaFinDate = new Date(baseDate);
    fechaFinDate.setUTCDate(fechaFinDate.getUTCDate() + 6);
    const fechaFin = `${fechaFinDate.getUTCFullYear()}-${String(fechaFinDate.getUTCMonth() + 1).padStart(2, '0')}-${String(fechaFinDate.getUTCDate()).padStart(2, '0')}`;

    // Buscar TODAS las reservas confirmadas en esa semana
    const reservas = await Reservation.find({
      fecha: { $gte: fechaInicio, $lte: fechaFin },
      estado: 'confirmada'
    }).sort({ fecha: 1, horaInicio: 1 });

    console.log(`📊 Disponibilidad semanal: ${reservas.length} reservas confirmadas para todos los usuarios`);
    
    // Formatear respuesta
    const disponibilidad = reservas.map(reserva => ({
      _id: reserva._id,
      servicio: reserva.servicio,
      nombreCliente: reserva.nombreCliente,
      telefonoCliente: reserva.telefonoCliente,
      fecha: reserva.fecha,
      horaInicio: reserva.horaInicio,
      horaFin: reserva.horaFin,
      duracion: reserva.duracion,
      precio: reserva.precio,
      estado: reserva.estado,
      servicioNombre: serviceDurations[reserva.servicio]?.nombre,
      googleCalendarEventId: reserva.googleCalendarEventId,
      ocupado: true,
      color: '#D98FA0',
      tooltip: `${serviceDurations[reserva.servicio]?.nombre} - ${reserva.nombreCliente}`
    }));

    // Calcular horarios ocupados por franjas
    const horariosOcupados = [];
    reservas.forEach(reserva => {
      const horasOcupadas = calcularHorasOcupadas(reserva.horaInicio, reserva.horaFin);
      horasOcupadas.forEach(hora => {
        horariosOcupados.push({
          fecha: reserva.fecha,
          hora: hora,
          reservaId: reserva._id
        });
      });
    });

    res.json({
      success: true,
      reservas: disponibilidad,
      horariosOcupados: horariosOcupados,
      totalReservas: reservas.length,
      fechaInicio,
      fechaFin
    });

  } catch (error) {
    console.error('❌ ERROR:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener disponibilidad', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Helper para calcular horas ocupadas
const calcularHorasOcupadas = (horaInicio, horaFin) => {
  const horasOcupadas = [];
  const [horaInicioNum, minutoInicio] = horaInicio.split(':').map(Number);
  const [horaFinNum, minutoFin] = horaFin.split(':').map(Number);
  
  const inicioMinutos = horaInicioNum * 60 + minutoInicio;
  const finMinutos = horaFinNum * 60 + minutoFin;
  
  for (let minutos = inicioMinutos; minutos < finMinutos; minutos += 30) {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    horasOcupadas.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
  
  return horasOcupadas;
};

// ═══════════════════════════════════════════════════════════════════════════
// VERIFICAR HORARIO OCUPADO
// ═══════════════════════════════════════════════════════════════════════════
export const checkTimeSlot = async (req, res) => {
  try {
    const { fecha, horaInicio, servicio } = req.body;
    
    if (!fecha || !horaInicio) {
      return res.status(400).json({ 
        success: false,
        message: 'Fecha y hora son requeridas' 
      });
    }
    
    let duracion = 60; // Default
    if (servicio && serviceDurations[servicio]) {
      duracion = serviceDurations[servicio].duracion;
    }
    
    const disponible = await verificarDisponibilidad(fecha, horaInicio, duracion);
    
    res.json({
      success: true,
      disponible,
      mensaje: disponible 
        ? 'Horario disponible' 
        : 'Horario ocupado',
      fecha,
      horaInicio,
      duracion
    });
    
  } catch (error) {
    console.error('❌ ERROR verificando horario:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error verificando horario', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
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
        usuario:        reserva.usuario,
        servicio:       reserva.servicio,
        fecha:          reserva.fecha,
        horaInicio:     reserva.horaInicio,
        horaFin:        reserva.horaFin,
        duracion:       reserva.duracion,
        precio:         reserva.precio,
        estado:         reserva.estado,
        nombreCliente:  reserva.nombreCliente,
        telefonoCliente: reserva.telefonoCliente,
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
        createdAt: reserva.createdAt,
        updatedAt: reserva.updatedAt
      };
    });

    console.log(`📋 Reservas del usuario ${req.user.nombreCompleto}: ${reservations.length}`);
    res.json({
      success: true,
      count: reservations.length,
      reservations: reservasFormateadas
    });

  } catch (error) {
    console.error('❌ ERROR:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener reservas', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
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
      return res.status(404).json({ 
        success: false,
        message: 'Reservación no encontrada' 
      });
    }

    if (reservation.usuario.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'No autorizado' 
      });
    }

    if (reservation.estado === 'cancelada') {
      return res.status(400).json({ 
        success: false,
        message: 'La reserva ya está cancelada' 
      });
    }

    // Cancelar en MongoDB
    reservation.estado = 'cancelada';
    reservation.esperandoRespuesta = false;
    await reservation.save();

    console.log('✅ Reserva cancelada en DB:', reservation._id);

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

    console.log('========== FIN CANCELAR ==========');

    res.json({
      success: true,
      message: 'Reserva cancelada exitosamente',
      reservation: {
        _id:    reservation._id,
        estado: reservation.estado
      }
    });

  } catch (error) {
    console.error('❌ ERROR:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al cancelar reserva', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
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
      return res.status(404).json({ 
        success: false,
        message: 'Reservación no encontrada' 
      });
    }

    if (reservation.usuario.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'No autorizado' 
      });
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

    res.json({ 
      success: true,
      message: 'Reserva eliminada del historial' 
    });

  } catch (error) {
    console.error('❌ ERROR:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al eliminar reserva', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// OBTENER TODAS LAS RESERVAS (para calendario público)
// ═══════════════════════════════════════════════════════════════════════════
export const getAllReservations = async (req, res) => {
  try {
    console.log('📊 Obteniendo todas las reservas confirmadas...');
    
    const reservations = await Reservation.find({
      estado: 'confirmada'
    }).sort({ fecha: 1, horaInicio: 1 });
    
    console.log(`✅ ${reservations.length} reservas confirmadas encontradas`);
    
    // Formatear para calendario
    const formateadas = reservations.map(reserva => ({
      id: reserva._id,
      title: `${serviceDurations[reserva.servicio]?.nombre} - ${reserva.nombreCliente}`,
      start: `${reserva.fecha}T${reserva.horaInicio}:00`,
      end: `${reserva.fecha}T${reserva.horaFin}:00`,
      color: '#D98FA0',
      extendedProps: {
        servicio: reserva.servicio,
        nombreCliente: reserva.nombreCliente,
        telefonoCliente: reserva.telefonoCliente,
        servicioNombre: serviceDurations[reserva.servicio]?.nombre,
        precio: reserva.precio
      }
    }));
    
    res.json({
      success: true,
      count: reservations.length,
      reservations: formateadas,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ ERROR obteniendo todas las reservas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener reservas', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};