import express from 'express';
import Reservation from '../models/Reservation.js';
import { enviarSMSCancelado, notificarSalonCancelacion } from '../utils/smsService.js';

const router = express.Router();

// ─── GET /api/cancel/:id?token=TOKEN ────────────────────────────────────────
// Este endpoint es público (sin auth). La seguridad viene del cancelToken
// que es un string único generado con crypto al crear la reserva.
// Solo quien tiene ese link puede cancelar.
router.get('/:id', async (req, res) => {
  try {
    const { id }    = req.params;
    const { token } = req.query;

    console.log('🔗 Intento de cancelación por SMS link');
    console.log('ID:', id);

    // Verificar que se mandó token
    if (!token) {
      console.error('❌ No se proporcionó token');
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Error</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #fdf2f8; padding: 20px; }
            .card { background: white; border-radius: 24px; padding: 48px 32px; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.08); }
            .icon { font-size: 64px; margin-bottom: 24px; }
            h1 { color: #e53e3e; font-size: 24px; margin-bottom: 12px; }
            p { color: #718096; font-size: 15px; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">❌</div>
            <h1>Link inválido</h1>
            <p>Este link no es válido. Por favor revisa el SMS que recibiste.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Buscar reserva
    const reserva = await Reservation.findById(id);

    if (!reserva) {
      console.error('❌ Reserva no encontrada');
      return res.status(404).send(paginaError('Reserva no encontrada', 'Esta reserva no existe o ya fue eliminada.'));
    }

    // Verificar token
    if (reserva.cancelToken !== token) {
      console.error('❌ Token no coincide');
      return res.status(401).send(paginaError('Link inválido', 'Este link no es válido o ya fue usado.'));
    }

    // Verificar que aún esté confirmada
    if (reserva.estado !== 'confirmada') {
      console.error('❌ Reserva ya cancelada');
      return res.status(400).send(paginaError('Ya cancelada', 'Esta cita ya fue cancelada anteriormente.'));
    }

    // ── Cancelar la reserva ─────────────────────────────────────────────────
    reserva.estado = 'cancelada';
    reserva.cancelToken = null; // invalidar el token para que no se use de nuevo
    await reserva.save();

    console.log('✅ Reserva cancelada desde SMS link:', reserva._id);

    // Notificar al salón
    try {
      await notificarSalonCancelacion(reserva);
    } catch (e) {
      console.error('⚠️ Error notificando salón:', e.message);
    }

    // Enviar SMS de cancelación con link de reagendar
    try {
      await enviarSMSCancelado(reserva);
    } catch (e) {
      console.error('⚠️ Error enviando SMS de cancelación:', e.message);
    }

    // Retornar página de confirmación de cancelación
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cita Cancelada</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #fdf2f8; padding: 20px; }
          .card { background: white; border-radius: 24px; padding: 48px 32px; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.08); }
          .icon { font-size: 64px; margin-bottom: 24px; }
          h1 { color: #d53f8c; font-size: 24px; margin-bottom: 12px; }
          p { color: #718096; font-size: 15px; line-height: 1.6; margin-bottom: 8px; }
          .details { background: #fef2f8; border-radius: 16px; padding: 20px; margin: 24px 0; text-align: left; }
          .details p { margin-bottom: 6px; font-size: 14px; }
          .details .label { color: #a0aec0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 12px; margin-bottom: 2px; }
          .btn { display: inline-block; margin-top: 28px; background: linear-gradient(135deg, #d53f8c, #e5527a); color: white; text-decoration: none; padding: 14px 36px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(213,63,140,0.3); transition: transform 0.2s; }
          .btn:hover { transform: translateY(-2px); }
          .footer { margin-top: 32px; color: #a0aec0; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✅</div>
          <h1>Cita cancelada</h1>
          <div class="details">
            <p class="label">Servicio</p>
            <p><strong>${reserva.servicio}</strong></p>
            <p class="label">Fecha</p>
            <p><strong>${reserva.fecha}</strong></p>
            <p class="label">Hora</p>
            <p><strong>${reserva.horaInicio}</strong></p>
          </div>
          <p>Tu cita ha sido cancelada exitosamente.</p>
          <p>También te enviamos un SMS con la opción de reagendar.</p>
          <a href="${process.env.FRONTEND_URL || 'https://soumaya-beauty-salon.vercel.app'}/reservaciones" class="btn">
            Agendar nueva cita 🌸
          </a>
          <p class="footer">Soumaya Beauty Bar</p>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('❌ Error en cancelación por link:', error);
    res.status(500).send(paginaError('Error', 'Ocurrió un error inesperado. Por favor intenta de nuevo.'));
  }
});

// ─── Helper: página de error genérica ───────────────────────────────────────
const paginaError = (titulo, mensaje) => `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${titulo}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #fdf2f8; padding: 20px; }
      .card { background: white; border-radius: 24px; padding: 48px 32px; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.08); }
      .icon { font-size: 64px; margin-bottom: 24px; }
      h1 { color: #e53e3e; font-size: 24px; margin-bottom: 12px; }
      p { color: #718096; font-size: 15px; line-height: 1.6; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="icon">❌</div>
      <h1>${titulo}</h1>
      <p>${mensaje}</p>
    </div>
  </body>
  </html>
`;

export default router;