import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    nombreCliente: {
      type: String,
      required: true
    },
    telefonoCliente: {
      type: String,
      required: true
    },
    servicio: {
      type: String,
      required: true,
      enum: ['unas-gel', 'unas-acrilicas', 'pedicure', 'keratina', 'tinte', 'pestanas', 'cejas']
    },
    fecha: {
      type: String,
      required: true  // formato: YYYY-MM-DD
    },
    horaInicio: {
      type: String,
      required: true  // formato: HH:MM
    },
    horaFin: {
      type: String,
      required: true  // formato: HH:MM
    },
    duracion: {
      type: Number,
      required: true  // en minutos
    },
    estado: {
      type: String,
      default: 'confirmada',
      enum: ['confirmada', 'cancelada', 'completada']
    },
    // Token único para el link de cancelación por SMS (backup/fallback)
    cancelToken: {
      type: String,
      default: null
    },
    // Estado de la encuesta SMS:
    //   'encuesta_cancelacion_pendiente' → se envió confirmación, esperando Sí/No de cancelar
    //   'encuesta_reagendar_pendiente'   → cita cancelada, esperando Sí/No de reagendar
    //   'completada'                     → encuesta finalizada (respondió No en cualquier paso)
    //   null                             → no aplica (reserva antigua o sin encuesta)
    estadoEncuesta: {
      type: String,
      default: null,
      enum: [
        'encuesta_cancelacion_pendiente',
        'encuesta_reagendar_pendiente',
        'completada',
        null
      ]
    }
  },
  {
    timestamps: true  // createdAt, updatedAt automáticos
  }
);

// Índice compuesto para búsqueda rápida por teléfono + estado de encuesta
reservationSchema.index({ telefonoCliente: 1, estadoEncuesta: 1, estado: 1 });

const Reservation = mongoose.model('Reservation', reservationSchema);

export default Reservation;