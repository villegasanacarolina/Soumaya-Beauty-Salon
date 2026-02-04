import express from 'express';
import { register, login, getProfile, verifyToken } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Registro de nuevo usuario
router.post('/register', register);

// Inicio de sesión
router.post('/login', login);

// Verificar token (para frontend)
router.get('/verify', verifyToken);

// Obtener perfil del usuario (requiere autenticación)
router.get('/profile', protect, getProfile);

export default router;