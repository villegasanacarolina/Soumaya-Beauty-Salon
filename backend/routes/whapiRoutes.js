import express from 'express';
import { handleWhapiWebhook } from '../utils/whapiWebhook.js';

const router = express.Router();

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/whapi/webhook
// ═══════════════════════════════════════════════════════════════════════════
// Whapi.cloud llama a este endpoint cuando llegan mensajes
// Configurar en Whapi dashboard → Settings → Webhooks
// URL: https://soumaya-beauty-salon.onrender.com/api/whapi/webhook
// Eventos: messages.upsert

router.post('/webhook', handleWhapiWebhook);

export default router;