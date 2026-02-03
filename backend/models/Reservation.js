import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref:   'User',
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
    precio: {
      type: Number,
      required: true  // ← NUEVO: Precio del servicio en MXN
    },
    estado: {
      type: String,
      default: 'confirmada',
      enum: ['confirmada', 'cancelada', 'completada']
    },

    // ─── Google Calendar ────────────────────────────────────────────────
    // ID del evento en Google Calendar para poder eliminarlo al cancelar
    googleCalendarEventId: {
      type: String,
      default: null
    },

    // ─── WhatsApp / Encuesta ────────────────────────────────────────────
    // Estado de la encuesta WhatsApp:
    //   'pendiente_conexion'              → se generó el deep link, esperando que la clienta se conecte
    //   'encuesta_cancelacion_pendiente'  → confirmación enviada, esperando Sí/No de cancelar
    //   'encuesta_reagendar_pendiente'    → cita cancelada, esperando Sí/No de reagendar
    //   'completada'                      → encuesta finalizada
    //   null                              → no aplica (reservas antiguas)
    estadoEncuesta: {
      type: String,
      default: null,
      enum: [
        'pendiente_conexion',
        'encuesta_cancelacion_pendiente',
        'encuesta_reagendar_pendiente',
        'completada',
        null
      ]
    },

    // Token de respaldo para cancelación por link (mantiene compatibilidad)
    cancelToken: {
      type: String,
      default: null
    },
    
    // Campo para marcar si ya se envió recordatorio
    recordatorioEnviado: {
      type: Boolean,
      default: false
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