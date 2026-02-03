import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import cancelRoutes from './routes/cancelRoutes.js';
import whatsappRoutes from './routes/whatsappRoutes.js';
import cron from 'node-cron';
import { enviarRecordatoriosDiarios } from './utils/cronJobs.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Conectar Base de Datos ─────────────────────────────────────────────────
connectDB();

// ─── Rutas ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/cancel', cancelRoutes);           // link de cancelación (fallback)
app.use('/api/whatsapp', whatsappRoutes);       // webhook de WhatsApp + Google Calendar

// ─── Ruta de prueba ─────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'Soumaya Beauty Bar API',
    status: 'running',
    mongodb: 'connected',
    whatsapp: 'Twilio WhatsApp Sandbox',
    calendar: 'Google Calendar API',
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
  console.log(`📱 WhatsApp: Twilio Sandbox`);
  console.log(`📅 Google Calendar: Service Account`);
  console.log(`🔗 Cancel link: /api/cancel/:id`);
  console.log(`📨 WhatsApp webhook: /api/whatsapp/webhook`);
  console.log('==========================================');
  console.log('');
});