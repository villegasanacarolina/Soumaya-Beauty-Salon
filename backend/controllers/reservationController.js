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
  
  console.log('🔍 Verificando disponibilidad:', {
    fecha,
    horaInicio,
    horaFin,
    duracion
  });
  
  const reservasExistentes = await Reservation.find({
    fecha: fecha,
    estado: 'confirmada',
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

  console.log('📋 Reservas que interfieren:', reservasExistentes.length);
  
  return reservasExistentes.length === 0;
};

export const createReservation = async (req, res) => {
  try {
    const { servicio, fecha, horaInicio } = req.body;

    console.log('📅 ========== CREAR RESERVA ==========');
    console.log('Usuario:', req.user.nombreCompleto);
    console.log('Teléfono:', req.user.telefono);
    console.log('Servicio:', servicio);
    console.log('Fecha:', fecha);
    console.log('Hora:', horaInicio);

    if (!serviceDurations[servicio]) {
      return res.status(400).json({ message: 'Servicio inválido' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({ message: 'Formato de fecha inválido' });
    }

    const duracion = serviceDurations[servicio].duracion;
    const horaFin = calcularHoraFin(horaInicio, duracion);

    console.log('⏱️ Duración:', duracion, 'min');
    console.log('🕐 Hora fin:', horaFin);

    const [horaInicioNum] = horaInicio.split(':').map(Number);
    const [horaFinNum] = horaFin.split(':').map(Number);

    if (horaInicioNum < 10 || horaFinNum > 20) {
      return res.status(400).json({
        message: 'Horario no disponible. El salón opera de 10:00 AM a 8:00 PM'
      });
    }

    const disponible = await verificarDisponibilidad(fecha, horaInicio, duracion);

    if (!disponible) {
      console.log('❌ Horario NO disponible');
      return res.status(400).json({ message: 'El horario ya está ocupado' });
    }

    console.log('✅ Horario disponible, creando reserva...');

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

    console.log('✅ RESERVA CREADA EN BD:', {
      id: reservation._id,
      estado: reservation.estado,
      fecha: reservation.fecha,
      horaInicio: reservation.horaInicio,
      horaFin: reservation.horaFin
    });

    // Enviar WhatsApp
    console.log('📱 Intentando enviar WhatsApp...');
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
      // No fallar la reserva si falla WhatsApp
    }

    console.log('========== FIN CREAR RESERVA ==========');
    res.status(201).json(reservation);
  } catch (error) {
    console.error('❌ ERROR CRÍTICO:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Este horario ya está reservado' });
    }
    
    res.status(500).json({ message: 'Error al crear la reserva' });
  }
};

export const getWeekAvailability = async (req, res) => {
  try {
    const { fecha } = req.params;

    console.log('📊 ========== GET AVAILABILITY ==========');
    console.log('Fecha solicitada:', fecha);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({ message: 'Formato de fecha inválido' });
    }

    const [year, month, day] = fecha.split('-').map(Number);
    const baseDate = new Date(Date.UTC(year, month - 1, day));
    
    const fechaInicio = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const fechaFinDate = new Date(baseDate);
    fechaFinDate.setUTCDate(fechaFinDate.getUTCDate() + 6);
    const fechaFin = `${fechaFinDate.getUTCFullYear()}-${String(fechaFinDate.getUTCMonth() + 1).padStart(2, '0')}-${String(fechaFinDate.getUTCDate()).padStart(2, '0')}`;

    console.log('📅 Rango de búsqueda:', { fechaInicio, fechaFin });

    const reservas = await Reservation.find({
      fecha: { $gte: fechaInicio, $lte: fechaFin },
      estado: 'confirmada'
    });

    console.log(`✅ Reservas CONFIRMADAS encontradas: ${reservas.length}`);
    
    reservas.forEach(r => {
      console.log(`   - ${r.fecha} ${r.horaInicio}-${r.horaFin} (${r.servicio}) - ID: ${r._id}`);
    });
    
    console.log('========== FIN GET AVAILABILITY ==========');
    
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
    
    console.log(`📋 Total reservas del usuario: ${reservations.length}`);
    
    const reservasFormateadas = reservations.map(reserva => {
      const [year, month, day] = reserva.fecha.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      
      return {
        _id: reserva._id,
        servicio: reserva.servicio,
        fecha: reserva.fecha,
        horaInicio: reserva.horaInicio,
        horaFin: reserva.horaFin,
        duracion: reserva.duracion,
        estado: reserva.estado,
        nombreCliente: reserva.nombreCliente,
        servicioNombre: serviceDurations[reserva.servicio]?.nombre,
        fechaLegible: date.toLocaleDateString('es-MX', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      };
    });
    
    res.json(reservasFormateadas);
  } catch (error) {
    console.error('❌ ERROR:', error);
    res.status(500).json({ message: 'Error al obtener reservas' });
  }
};

export const cancelReservation = async (req, res) => {
  try {
    console.log('❌ ========== CANCELAR RESERVA ==========');
    console.log('ID:', req.params.id);
    
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      console.log('❌ Reserva no encontrada');
      return res.status(404).json({ message: 'Reservación no encontrada' });
    }

    if (reservation.usuario.toString() !== req.user._id.toString()) {
      console.log('❌ Usuario no autorizado');
      return res.status(403).json({ message: 'No autorizado' });
    }

    console.log('Estado anterior:', reservation.estado);
    reservation.estado = 'cancelada';
    await reservation.save();
    console.log('Estado nuevo:', reservation.estado);

    console.log('✅ Reserva cancelada exitosamente');
    console.log('========== FIN CANCELAR RESERVA ==========');
    
    res.json({ 
      message: 'Reserva cancelada', 
      reservation: {
        _id: reservation._id,
        estado: reservation.estado
      }
    });
  } catch (error) {
    console.error('❌ ERROR:', error);
    res.status(500).json({ message: 'Error al cancelar reserva' });
  }
};

export const deleteReservation = async (req, res) => {
  try {
    console.log('🗑️ ========== ELIMINAR RESERVA ==========');
    console.log('ID:', req.params.id);
    
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      console.log('❌ Reserva no encontrada');
      return res.status(404).json({ message: 'Reservación no encontrada' });
    }

    if (reservation.usuario.toString() !== req.user._id.toString()) {
      console.log('❌ Usuario no autorizado');
      return res.status(403).json({ message: 'No autorizado' });
    }

    await Reservation.findByIdAndDelete(req.params.id);

    console.log('✅ Reserva eliminada del historial');
    console.log('========== FIN ELIMINAR RESERVA ==========');
    
    res.json({ message: 'Reserva eliminada del historial' });
  } catch (error) {
    console.error('❌ ERROR:', error);
    res.status(500).json({ message: 'Error al eliminar reserva' });
  }
};