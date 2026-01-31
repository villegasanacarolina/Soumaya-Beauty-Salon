import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import cron from 'node-cron';
import { enviarRecordatoriosDiarios } from './utils/cronJobs.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Conectar Base de Datos ─────────────────────────────────────────────────
connectDB();

// ─── Rutas ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/webhook', webhookRoutes);  // Twilio WhatsApp webhook

// ─── Ruta de prueba ─────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'Soumaya Beauty Bar API',
    status: 'running',
    mongodb: 'connected',
    whatsapp: 'Twilio Webhook',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// ─── Cron Job – Recordatorios diarios a las 9 AM ───────────────────────────
cron.schedule('0 9 * * *', () => {
  console.log('⏰ Ejecutando envío de recordatorios...');
  enviarRecordatoriosDiarios();
}, {
  timezone: 'America/Mexico_City'
});

// ─── Manejo de errores ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({
    message: 'Error del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ─── Iniciar servidor ───────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ========== SERVIDOR INICIADO ==========');
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 MongoDB: Conectado`);
  console.log(`📱 WhatsApp: Twilio Webhook`);
  console.log(`🌐 Webhook: /webhook/whatsapp`);
  console.log('==========================================');
  console.log('');
});