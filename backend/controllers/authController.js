import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// ─── Helper: Limpiar y formatear teléfono ────────────────────────────────────
// Convierte cualquier formato de teléfono a SOLO 10 dígitos
// Ejemplos:
//   +523511270276  → 3511270276
//   351-127-0276   → 3511270276
//   (351) 127-0276 → 3511270276
const limpiarTelefono = (telefono) => {
  // Eliminar TODO excepto números
  let num = telefono.replace(/\D/g, '');
  
  // Si tiene código de país México (12 dígitos: 52 + 10), quitar los primeros 2
  if (num.length === 12 && num.startsWith('52')) {
    num = num.slice(2);
  }
  
  // Si tiene código de país USA (11 dígitos: 1 + 10), quitar el 1
  if (num.length === 11 && num.startsWith('1')) {
    num = num.slice(1);
  }
  
  // Debe quedar con exactamente 10 dígitos
  if (num.length !== 10) {
    throw new Error('El teléfono debe tener 10 dígitos');
  }
  
  return num;
};

export const register = async (req, res) => {
  try {
    const { nombreCompleto, telefono, password } = req.body;

    if (!nombreCompleto || !telefono || !password) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // ─── Limpiar el teléfono ANTES de validar y guardar ──────────────────
    let telefonoLimpio;
    try {
      telefonoLimpio = limpiarTelefono(telefono);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    console.log('📞 Teléfono original:', telefono);
    console.log('📞 Teléfono limpio:', telefonoLimpio);

    // Verificar si ya existe un usuario con ese teléfono limpio
    const userExists = await User.findOne({ telefono: telefonoLimpio });
    if (userExists) {
      return res.status(400).json({ message: 'El número de teléfono ya está registrado' });
    }

    // Crear usuario con teléfono limpio (solo 10 dígitos)
    const user = await User.create({
      nombreCompleto,
      telefono: telefonoLimpio,  // ← Guardar SOLO 10 dígitos
      password
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        nombreCompleto: user.nombreCompleto,
        telefono: user.telefono,
        token: generateToken(user._id)
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { telefono, password } = req.body;

    // ─── Limpiar el teléfono ANTES de buscar ─────────────────────────────
    let telefonoLimpio;
    try {
      telefonoLimpio = limpiarTelefono(telefono);
    } catch (error) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    console.log('📞 Login - Teléfono original:', telefono);
    console.log('📞 Login - Teléfono limpio:', telefonoLimpio);

    // Buscar usuario con teléfono limpio
    const user = await User.findOne({ telefono: telefonoLimpio });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        nombreCompleto: user.nombreCompleto,
        telefono: user.telefono,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Credenciales inválidas' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};