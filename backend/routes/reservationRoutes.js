import express from 'express';
import { 
  createReservation, 
  getWeekAvailability, 
  getUserReservations, 
  cancelReservation,
  deleteReservation 
} from '../controllers/reservationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createReservation);
router.get('/availability/:fecha', protect, getWeekAvailability);
router.get('/my-reservations', protect, getUserReservations);
router.put('/:id/cancel', protect, cancelReservation);
router.delete('/:id', protect, deleteReservation);

export default router;