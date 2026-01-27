import express from 'express';
import {
  createReservation,
  getWeekAvailability,
  getUserReservations,
  cancelReservation
} from '../controllers/reservationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createReservation);
router.get('/availability/:fecha', protect, getWeekAvailability);
router.get('/my-reservations', protect, getUserReservations);
router.put('/:id/cancel', protect, cancelReservation);

export default router;