import express from 'express';
import Reservation from '../models/Reservation.js';
import { eliminarEventoCalendar } from '../utils/googleCalendarService.js';
import {
  enviarWhatsAppCancelado,
  notificarSalonCancelacion
} from '../utils/whatsappService.js';

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://soumaya-beauty-salon.vercel.app';

// ─── GET /api/cancel/:id?token=TOKEN ────────────────────────────────────────
// Fallback para links antiguos de cancelación por SMS/WhatsApp.
// Si la clienta tiene un link antiguo, sigue funcionando.
// Cancela en MongoDB + Google Calendar y luego redirige al frontend.

router.get('/:id', async (req, res) => {
  try {
    const { id }    = req.params;
    const { token } = req.query;

    console.log('🔗 ========== CANCELACIÓN POR LINK ==========');
    console.log('ID:', id);

    if (!token) {
      console.log('❌ No se proporcionó token');
      return res.redirect(`${FRONTEND_URL}/cancelacion-error`);
    }

    const reservation = await Reservation.findById(id);

    if (!reservation) {
      console.log('❌ Reservación no encontrada');
      return res.redirect(`${FRONTEND_URL}/cancelacion-error`);
    }

    if (reservation.cancelToken !== token) {
      console.log('❌ Token inválido');
      return res.redirect(`${FRONTEND_URL}/cancelacion-error`);
    }

    if (reservation.estado !== 'confirmada') {
      console.log('⚠️ Reservación ya no está confirmada');
      return res.redirect(`${FRONTEND_URL}/cancelacion-error`);
    }

    // ── Cancelar en MongoDB ───────────────────────────────────────────
    reservation.estado         = 'cancelada';
    reservation.cancelToken    = null;
    reservation.estadoEncuesta = 'encuesta_reagendar_pendiente';
    await reservation.save();

    console.log('✅ Reserva cancelada por link:', reservation._id);

    // ── Eliminar de Google Calendar ───────────────────────────────────
    if (reservation.googleCalendarEventId) {
      try {
        await eliminarEventoCalendar(reservation.googleCalendarEventId);
        console.log('✅ Evento eliminado de Google Calendar');
      } catch (e) {
        console.error('⚠️ Error eliminando de Google Calendar:', e.message);
      }
    }

    // ── Notificar al salón ────────────────────────────────────────────
    try {
      await notificarSalonCancelacion(reservation);
    } catch (e) {
      console.error('⚠️ Error notificando salón:', e.message);
    }

    // ── Enviar WhatsApp de cancelación + pregunta reagendar ───────────
    try {
      await enviarWhatsAppCancelado(reservation);
    } catch (e) {
      console.error('⚠️ Error enviando WhatsApp de cancelación:', e.message);
    }

    console.log('========== FIN CANCELACIÓN POR LINK ==========');

    // Redirigir al frontend con confirmación
    return res.redirect(`${FRONTEND_URL}/cancelacion-exitosa`);

  } catch (error) {
    console.error('❌ Error en cancelación por link:', error);
    return res.redirect(`${FRONTEND_URL}/cancelacion-error`);
  }
});

export default router;