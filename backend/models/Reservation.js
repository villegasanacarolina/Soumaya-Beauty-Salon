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
      required: true
    },
    fecha: {
      type: String,
      required: true
    },
    horaInicio: {
      type: String,
      required: true
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
      enum: ['confirmada', 'cancelada'],
      default: 'confirmada'
    },
    recordatorioEnviado: {
      type: Boolean,
      default: false
    },
    // Token único para verificar cancelaciones desde SMS
    cancelToken: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const Reservation = mongoose.model('Reservation', reservationSchema);

export default Reservation;