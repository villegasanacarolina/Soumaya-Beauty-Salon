import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import whapiRoutes from './routes/whapiRoutes.js';
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
app.use('/api/whapi', whapiRoutes);

// ─── Ruta de prueba ─────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'Soumaya Beauty Bar API',
    status: 'running',
    mongodb: 'connected',
    whatsapp: 'Whapi.cloud',
    calendar: 'Google Calendar API',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// ─── Cron Job – Recordatorios diarios a las 6:30 PM ───────────────────────────
// Formato: minutos horas * * *
// 30 18 = 6:30 PM (18:30)
cron.schedule('30 18 * * *', () => {
  console.log('⏰ Ejecutando envío de recordatorios (6:30 PM)...');
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
  console.log(`📱 WhatsApp: Whapi.cloud`);
  console.log(`📅 Google Calendar: Service Account`);
  console.log(`⏰ Cron: Recordatorios a las 6:30 PM`);
  console.log(`📨 Whapi webhook: /api/whapi/webhook`);
  console.log('==========================================');
  console.log('');
});