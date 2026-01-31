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
        return res.status(401).json({ message: 'No autorizado - Usuario no encontrado' });
      }

      next();
    } catch (error) {
      console.error('❌ Error en token:', error);
      return res.status(401).json({ message: 'No autorizado - Token inválido' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'No autorizado - Sin token' });
  }
};