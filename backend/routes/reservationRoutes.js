import express from 'express';
import { 
  createReservation, 
  getWeekAvailability, 
  getUserReservations, 
  cancelReservation,
  deleteReservation,
  checkTimeSlot,
  getAllReservations
} from '../controllers/reservationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Crear nueva reserva
router.post('/', createReservation);

// Verificar si un horario está disponible
router.post('/check-slot', checkTimeSlot);

// Obtener disponibilidad semanal
router.get('/availability/:fecha', getWeekAvailability);

// Obtener TODAS las reservas (para calendario público)
router.get('/all', getAllReservations);

// Obtener reservas del usuario
router.get('/my-reservations', getUserReservations);

// Cancelar reserva
router.put('/:id/cancel', cancelReservation);

// Eliminar reserva del historial
router.delete('/:id', deleteReservation);

export default router;