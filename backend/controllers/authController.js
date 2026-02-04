import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// ─── Helper: Limpiar y formatear teléfono ────────────────────────────────────
const limpiarTelefono = (telefono) => {
  console.log('📞 ========== LIMPIANDO TELÉFONO ==========');
  console.log('📞 Teléfono original:', telefono);
  
  // Eliminar TODO excepto números
  let num = telefono.replace(/\D/g, '');
  
  console.log('📞 Solo números:', num);
  
  // IMPORTANTE: Siempre tomar los últimos 10 dígitos (para México)
  // Esto asegura consistencia sin importar cómo lo escriba el usuario
  if (num.length > 10) {
    num = num.slice(-10);
  }
  
  // Debe quedar con exactamente 10 dígitos
  if (num.length !== 10) {
    console.error('❌ Error: Teléfono no tiene 10 dígitos:', num);
    throw new Error('El teléfono debe tener 10 dígitos. Ejemplo: 3511270276');
  }
  
  console.log('✅ Teléfono limpio (10 dígitos):', num);
  
  return num;
};

export const register = async (req, res) => {
  try {
    const { nombreCompleto, telefono, password } = req.body;

    console.log('👤 ========== REGISTRO ==========');
    console.log('Nombre:', nombreCompleto);
    console.log('Teléfono:', telefono);

    if (!nombreCompleto || !telefono || !password) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // ─── Limpiar el teléfono ANTES de validar y guardar ──────────────────
    let telefonoLimpio;
    try {
      telefonoLimpio = limpiarTelefono(telefono);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

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

    console.log('✅ Usuario creado:', user._id);

    if (user) {
      const token = generateToken(user._id);
      
      res.status(201).json({
        success: true,
        _id: user._id,
        nombreCompleto: user.nombreCompleto,
        telefono: user.telefono,
        token,
        message: 'Usuario registrado exitosamente'
      });
    }
  } catch (error) {
    console.error('❌ Error en registro:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'El número de teléfono ya está registrado' });
    }
    
    res.status(500).json({ 
      message: 'Error al registrar usuario', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

export const login = async (req, res) => {
  try {
    const { telefono, password } = req.body;

    console.log('🔑 ========== INICIO SESIÓN ==========');
    console.log('Teléfono:', telefono);

    if (!telefono || !password) {
      return res.status(400).json({ message: 'Teléfono y contraseña son requeridos' });
    }

    // ─── Limpiar el teléfono ANTES de buscar ─────────────────────────────
    let telefonoLimpio;
    try {
      telefonoLimpio = limpiarTelefono(telefono);
    } catch (error) {
      console.error('❌ Error limpiando teléfono:', error.message);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    console.log('📞 Buscando usuario con teléfono:', telefonoLimpio);

    // Buscar usuario con teléfono limpio
    const user = await User.findOne({ telefono: telefonoLimpio });

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id);
      
      console.log('✅ Login exitoso:', user.nombreCompleto);
      
      res.json({
        success: true,
        _id: user._id,
        nombreCompleto: user.nombreCompleto,
        telefono: user.telefono,
        token,
        message: 'Inicio de sesión exitoso'
      });
    } else {
      console.log('❌ Credenciales inválidas');
      res.status(401).json({ 
        success: false,
        message: 'Credenciales inválidas' 
      });
    }
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al iniciar sesión', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.json({
      success: true,
      user: {
        _id: user._id,
        nombreCompleto: user.nombreCompleto,
        telefono: user.telefono,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo perfil:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener perfil', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// ─── Verificar token (para frontend) ───────────────────────────────────────
export const verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token no proporcionado' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        nombreCompleto: user.nombreCompleto,
        telefono: user.telefono,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Error verificando token:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token inválido' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expirado' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error al verificar token' 
    });
  }
};