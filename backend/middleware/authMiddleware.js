import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ 
          success: false,
          message: 'No autorizado - Usuario no encontrado' 
        });
      }

      console.log(`🔒 Usuario autenticado: ${req.user.nombreCompleto}`);
      next();
    } catch (error) {
      console.error('❌ Error en token:', error.message);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false,
          message: 'No autorizado - Token inválido' 
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false,
          message: 'No autorizado - Token expirado' 
        });
      }
      
      return res.status(401).json({ 
        success: false,
        message: 'No autorizado - Error en autenticación' 
      });
    }
  }

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'No autorizado - Sin token' 
    });
  }
};

// Middleware para verificar si es administrador (si implementas roles en el futuro)
export const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    return res.status(403).json({ 
      success: false,
      message: 'No autorizado - Se requieren permisos de administrador' 
    });
  }
};