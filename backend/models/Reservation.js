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
      required: true  // precio en MXN
    },
    estado: {
      type: String,
      default: 'confirmada',
      enum: ['confirmada', 'cancelada', 'completada']
    },

    // ─── Google Calendar ────────────────────────────────────────────────
    googleCalendarEventId: {
      type: String,
      default: null
    },

    // ─── WhatsApp (Whapi.cloud) ─────────────────────────────────────────
    recordatorioEnviado: {
      type: Boolean,
      default: false
    },
    
    esperandoRespuesta: {
      type: Boolean,
      default: false  // true = esperando respuesta Sí/No a cancelación
    }
  },
  {
    timestamps: true  // createdAt, updatedAt automáticos
  }
);

// Índices para búsquedas rápidas
reservationSchema.index({ telefonoCliente: 1, estado: 1, esperandoRespuesta: 1 });
reservationSchema.index({ fecha: 1, estado: 1 });

const Reservation = mongoose.model('Reservation', reservationSchema);

export default Reservation;