import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  nombreCompleto: {
    type: String,
    required: [true, 'El nombre completo es requerido'],
    trim: true
  },
  telefono: {
    type: String,
    required: [true, 'El teléfono es requerido'],
    unique: true,
    validate: {
      validator: function(v) {
        // Validar exactamente 10 dígitos (formato México sin código de país)
        return /^\d{10}$/.test(v);
      },
      message: 'El teléfono debe tener exactamente 10 dígitos. Ejemplo: 5551234567'
    }
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: 6
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);