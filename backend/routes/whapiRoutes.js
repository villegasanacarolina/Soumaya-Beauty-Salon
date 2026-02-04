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

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/whapi/status
// ═══════════════════════════════════════════════════════════════════════════
// Para verificar que el webhook está funcionando

router.get('/status', (req, res) => {
  res.json({
    status: 'active',
    service: 'Whapi.cloud Webhook',
    timestamp: new Date().toISOString(),
    endpoints: {
      webhook: 'POST /api/whapi/webhook'
    },
    config: {
      whapiToken: process.env.WHAPI_TOKEN ? '✅ Configurado' : '❌ No configurado',
      salonPhone: process.env.SALON_PHONE_NUMBER || '3511270276'
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/whapi/test
// ═══════════════════════════════════════════════════════════════════════════
// Endpoint para probar envío de mensajes (solo desarrollo)

if (process.env.NODE_ENV === 'development') {
  router.post('/test', async (req, res) => {
    try {
      const { telefono, mensaje } = req.body;
      
      if (!telefono || !mensaje) {
        return res.status(400).json({ error: 'Teléfono y mensaje son requeridos' });
      }

      // Aquí iría la lógica para enviar mensaje de prueba
      // Pero por ahora solo simulamos
      
      res.json({
        success: true,
        message: 'Mensaje de prueba enviado (simulado)',
        data: {
          to: telefono,
          mensaje
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

export default router;