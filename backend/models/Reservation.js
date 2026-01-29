import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
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
  // CAMBIO IMPORTANTE: Cambiar Date por String
  fecha: {
    type: String,  // Cambia Date por String
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{4}-\d{2}-\d{2}$/.test(v); // Acepta solo YYYY-MM-DD
      },
      message: 'Formato de fecha inválido. Use YYYY-MM-DD'
    }
  },
  horaInicio: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Formato de hora inválido (HH:MM)'
    }
  },
  horaFin: {
    type: String,
    required: true
  },
  duracion: {
    type: Number,
    required: true
  },
  estado: {
    type: String,
    enum: ['pendiente', 'confirmada', 'cancelada', 'completada'],
    default: 'pendiente'
  },
  recordatorioEnviado: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Actualizar el índice para usar String en lugar de Date
reservationSchema.index({ fecha: 1, horaInicio: 1 }, { unique: true });

export default mongoose.model('Reservation', reservationSchema);