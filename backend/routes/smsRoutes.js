import express from 'express';
import { handleIncomingSMS } from '../utils/smsWebhook.js';

const router = express.Router();

// ─── POST /api/sms/webhook ────────────────────────────────────────────────
// Twilio llama a este endpoint cuando la clienta responde al SMS.
// En el panel de Twilio configura el número +523511270276:
//   Messaging → "When a message comes in" → HTTP POST →
//   https://soumaya-beauty-salon.onrender.com/api/sms/webhook
router.post('/webhook', handleIncomingSMS);

export default router;