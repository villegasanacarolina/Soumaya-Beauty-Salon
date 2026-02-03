import express from 'express';
import { handleIncomingWhatsApp } from '../utils/whatsappWebhook.js';

const router = express.Router();

// ─── POST /api/whatsapp/webhook ──────────────────────────────────────────────
// Twilio llama a este endpoint cuando la clienta envía un mensaje por WhatsApp.
// Se configura en el Twilio Console → Sandbox Configuration →
// "When a message comes in" → POST → https://tu-backend.com/api/whatsapp/webhook
//
// IMPORTANTE: Este endpoint NO requiere autenticación porque es llamado
// externamente por los servidores de Twilio.
router.post('/webhook', handleIncomingWhatsApp);

export default router;