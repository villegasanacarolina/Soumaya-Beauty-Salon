import express from 'express';
import { handleIncomingWhatsApp } from '../utils/twilioWebhook.js';

const router = express.Router();

router.post('/whatsapp', handleIncomingWhatsApp);

export default router;