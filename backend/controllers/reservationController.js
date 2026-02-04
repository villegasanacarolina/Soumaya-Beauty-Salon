import Reservation from '../models/Reservation.js';
import { crearEventoCalendar, eliminarEventoCalendar } from '../utils/googleCalendarService.js';
import { 
  enviarConfirmacionCita,
  notificarSalonNuevaCita,
  notificarSalonCancelacion,
  enviarMensajeCancelacionConfirmada,
  serviceDurations
} from '../utils/whapiService.js';

// Helper para calcular hora fin
const calcularHoraFin = (horaInicio, duracion) => {
  const [horas, minutos] = horaInicio.split(':').map(Number);
  const totalMinutos = horas * 60 + minutos + duracion;
  const nuevasHoras = Math.floor(totalMinutos / 60);
  const nuevosMinutos = totalMinutos % 60;
  return `${nuevasHoras.toString().padStart(2, '0')}:${nuevosMinutos.toString().padStart(2, '0')}`;
};

// Helper para verificar disponibilidad
const verificarDisponibilidad = async (fecha, horaInicio, duracion) => {
  const horaFin = calcularHoraFin(horaInicio, duracion);
  
  const reservasExistentes = await Reservation.find({
    fecha,
    estado: 'confirmada',
    $or: [
      { horaInicio: { $lt: horaFin }, horaFin: { $gt: horaInicio } }
    ]
  });
  
  return reservasExistentes.length === 0;
};

// CREAR RESERVA
export const createReservation = async (req, res) => {
  try {
    const { servicio, fecha, horaInicio } = req.body;
    
    console.log('📅 ========== NUEVA RESERVA ==========');
    console.log('Cliente:', req.user.nombreCompleto);
    console.log('Teléfono:', req.user.telefono);
    console.log('Servicio:', servicio);
    console.log('Fecha:', fecha);
    console.log('Hora:', horaInicio);
    
    // Validaciones
    if (!serviceDurations[servicio]) {
      return res.status(400).json({ 
        success: false, 
        message: 'Servicio no válido' 
      });
    }
    
    const duracion = serviceDurations[servicio].duracion;
    const horaFin = calcularHoraFin(horaInicio, duracion);
    const precio = serviceDurations[servicio].precio;
    
    // Validar horario (10 AM - 8 PM)
    const [horaInicioNum] = horaInicio.split(':').map(Number);
    const [horaFinNum] = horaFin.split(':').map(Number);
    
    if (horaInicioNum < 10 || horaFinNum > 20) {
      return res.status(400).json({
        success: false,
        message: 'Horario no disponible. El salón opera de 10:00 AM a 8:00 PM'
      });
    }
    
    // Verificar disponibilidad
    const disponible = await verificarDisponibilidad(fecha, horaInicio, duracion);
    if (!disponible) {
      return res.status(400).json({
        success: false,
        message: 'Este horario ya está ocupado. Por favor selecciona otro.'
      });
    }
    
    // 1. CREAR RESERVA EN MONGODB
    const reservation = await Reservation.create({
      usuario: req.user._id,
      nombreCliente: req.user.nombreCompleto,
      telefonoCliente: req.user.telefono,
      servicio,
      fecha,
      horaInicio,
      horaFin,
      duracion,
      precio,
      estado: 'confirmada',
      esperandoRespuesta: true,
      recordatorioEnviado: false
    });
    
    console.log('✅ Reserva creada en DB:', reservation._id);
    
    // 2. CREAR EVENTO EN GOOGLE CALENDAR
    let calendarEventId = null;
    try {
      const calendarResult = await crearEventoCalendar(reservation);
      if (calendarResult.success) {
        reservation.googleCalendarEventId = calendarResult.eventId;
        calendarEventId = calendarResult.eventId;
        await reservation.save();
        console.log('✅ Evento en Google Calendar:', calendarResult.eventId);
      } else {
        console.error('❌ Error Google Calendar:', calendarResult.error);
      }
    } catch (calendarError) {
      console.error('❌ Error Google Calendar:', calendarError.message);
    }
    
    // 3. ENVIAR WHATSAPP AL CLIENTE
    let whatsappEnviado = false;
    let whatsappError = null;
    try {
      const resultadoWhatsapp = await enviarConfirmacionCita(reservation);
      if (resultadoWhatsapp.success) {
        whatsappEnviado = true;
        console.log('✅ WhatsApp enviado al cliente');
      } else {
        whatsappError = resultadoWhatsapp.error;
        console.error('❌ Error WhatsApp cliente:', resultadoWhatsapp.error);
      }
    } catch (whatsappError) {
      console.error('❌ Error enviando WhatsApp:', whatsappError.message);
    }
    
    // 4. NOTIFICAR AL SALÓN
    let salonNotificado = false;
    try {
      await notificarSalonNuevaCita(reservation);
      salonNotificado = true;
      console.log('✅ Salón notificado');
    } catch (salonError) {
      console.error('❌ Error notificando salón:', salonError.message);
    }
    
    console.log('========== FIN RESERVA ==========');
    
    // Formatear respuesta
    const [year, month, day] = fecha.split('-').map(Number);
    const fechaObj = new Date(year, month - 1, day);
    const fechaLegible = fechaObj.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    res.status(201).json({
      success: true,
      message: whatsappEnviado 
        ? '✅ Cita creada y confirmación enviada por WhatsApp'
        : '✅ Cita creada (error en WhatsApp, pero cita confirmada)',
      reservation: {
        ...reservation.toObject(),
        servicioNombre: serviceDurations[servicio].nombre,
        fechaLegible
      },
      calendarEventId,
      whatsappEnviado,
      salonNotificado,
      whatsappError
    });
    
  } catch (error) {
    console.error('❌ ERROR creando reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la reserva'
    });
  }
};

// OBTENER DISPONIBILIDAD SEMANAL
export const getWeekAvailability = async (req, res) => {
  try {
    const { fecha } = req.params;
    
    // Validar formato fecha
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de fecha inválido. Use YYYY-MM-DD'
      });
    }
    
    const [year, month, day] = fecha.split('-').map(Number);
    const fechaInicio = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    // Calcular fecha fin (6 días después)
    const fechaInicioObj = new Date(year, month - 1, day);
    const fechaFinObj = new Date(fechaInicioObj);
    fechaFinObj.setDate(fechaFinObj.getDate() + 6);
    
    const fechaFin = `${fechaFinObj.getFullYear()}-${(fechaFinObj.getMonth() + 1).toString().padStart(2, '0')}-${fechaFinObj.getDate().toString().padStart(2, '0')}`;
    
    // Buscar reservas en esa semana
    const reservas = await Reservation.find({
      fecha: { $gte: fechaInicio, $lte: fechaFin },
      estado: 'confirmada'
    }).sort({ fecha: 1, horaInicio: 1 });
    
    console.log(`📊 ${reservas.length} reservas encontradas para la semana`);
    
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
      servicioNombre: serviceDurations[reserva.servicio]?.nombre,
      googleCalendarEventId: reserva.googleCalendarEventId,
      ocupado: true,
      color: '#D98FA0'
    }));
    
    res.json({
      success: true,
      reservas: disponibilidad,
      totalReservas: reservas.length,
      fechaInicio,
      fechaFin
    });
    
  } catch (error) {
    console.error('❌ ERROR obteniendo disponibilidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo disponibilidad'
    });
  }
};

// RESERVAS DEL USUARIO
export const getUserReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({
      usuario: req.user._id
    }).sort({ fecha: -1, horaInicio: -1 });
    
    const reservasFormateadas = reservations.map(reserva => {
      const [year, month, day] = reserva.fecha.split('-').map(Number);
      const fechaObj = new Date(year, month - 1, day);
      
      return {
        _id: reserva._id,
        servicio: reserva.servicio,
        fecha: reserva.fecha,
        horaInicio: reserva.horaInicio,
        horaFin: reserva.horaFin,
        duracion: reserva.duracion,
        precio: reserva.precio,
        estado: reserva.estado,
        nombreCliente: reserva.nombreCliente,
        telefonoCliente: reserva.telefonoCliente,
        servicioNombre: serviceDurations[reserva.servicio]?.nombre,
        fechaLegible: fechaObj.toLocaleDateString('es-MX', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        googleCalendarEventId: reserva.googleCalendarEventId,
        esperandoRespuesta: reserva.esperandoRespuesta,
        recordatorioEnviado: reserva.recordatorioEnviado,
        createdAt: reserva.createdAt
      };
    });
    
    res.json({
      success: true,
      count: reservations.length,
      reservations: reservasFormateadas
    });
    
  } catch (error) {
    console.error('❌ ERROR obteniendo reservas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo reservas'
    });
  }
};

// CANCELAR RESERVA
export const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('❌ ========== CANCELAR RESERVA ==========');
    console.log('ID:', id);
    
    const reservation = await Reservation.findById(id);
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada'
      });
    }
    
    // Verificar que el usuario sea el dueño
    if (reservation.usuario.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado'
      });
    }
    
    // Actualizar estado
    reservation.estado = 'cancelada';
    reservation.esperandoRespuesta = false;
    await reservation.save();
    
    console.log('✅ Reserva cancelada en DB');
    
    // Eliminar de Google Calendar
    if (reservation.googleCalendarEventId) {
      try {
        await eliminarEventoCalendar(reservation.googleCalendarEventId);
        console.log('✅ Evento eliminado de Google Calendar');
      } catch (error) {
        console.error('❌ Error eliminando de Google Calendar:', error.message);
      }
    }
    
    // Notificar al salón
    try {
      await notificarSalonCancelacion(reservation);
      console.log('✅ Salón notificado');
    } catch (error) {
      console.error('❌ Error notificando salón:', error.message);
    }
    
    // Confirmar al cliente
    try {
      await enviarMensajeCancelacionConfirmada(reservation);
      console.log('✅ Cliente notificado');
    } catch (error) {
      console.error('❌ Error notificando cliente:', error.message);
    }
    
    res.json({
      success: true,
      message: 'Reserva cancelada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ ERROR cancelando reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelando reserva'
    });
  }
};

// ELIMINAR RESERVA DEL HISTORIAL
export const deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const reservation = await Reservation.findById(id);
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada'
      });
    }
    
    // Verificar que el usuario sea el dueño
    if (reservation.usuario.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado'
      });
    }
    
    // Si está confirmada, eliminar de Google Calendar
    if (reservation.estado === 'confirmada' && reservation.googleCalendarEventId) {
      try {
        await eliminarEventoCalendar(reservation.googleCalendarEventId);
      } catch (error) {
        console.error('Error eliminando de Google Calendar:', error.message);
      }
    }
    
    await Reservation.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Reserva eliminada del historial'
    });
    
  } catch (error) {
    console.error('❌ ERROR eliminando reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando reserva'
    });
  }
};

// VERIFICAR HORARIO
export const checkTimeSlot = async (req, res) => {
  try {
    const { fecha, horaInicio, servicio } = req.body;
    
    if (!fecha || !horaInicio) {
      return res.status(400).json({
        success: false,
        message: 'Fecha y hora son requeridas'
      });
    }
    
    let duracion = 60;
    if (servicio && serviceDurations[servicio]) {
      duracion = serviceDurations[servicio].duracion;
    }
    
    const disponible = await verificarDisponibilidad(fecha, horaInicio, duracion);
    
    res.json({
      success: true,
      disponible,
      message: disponible ? 'Horario disponible' : 'Horario ocupado',
      fecha,
      horaInicio,
      duracion
    });
    
  } catch (error) {
    console.error('❌ ERROR verificando horario:', error);
    res.status(500).json({
      success: false,
      message: 'Error verificando horario'
    });
  }
};