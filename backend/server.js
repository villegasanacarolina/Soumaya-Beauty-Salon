import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import whapiRoutes from './routes/whapiRoutes.js';

// Importar cron jobs
import { enviarRecordatoriosDiarios } from './jobs/cronJobs.js';
import cron from 'node-cron';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://soumaya-beauty-salon.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean),
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://soumaya-beauty-salon.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conectar a MongoDB
connectDB();

// WebSocket para actualizaciones en tiempo real
io.on('connection', (socket) => {
  console.log('🔌 Nuevo cliente conectado:', socket.id);
  
  socket.on('nuevaReserva', (reservaData) => {
    console.log('📢 Nueva reserva creada:', reservaData._id);
    // Emitir a TODOS los clientes excepto al que la creó
    socket.broadcast.emit('actualizarCalendario', reservaData);
  });
  
  socket.on('reservaCancelada', (reservaData) => {
    console.log('📢 Reserva cancelada:', reservaData._id);
    // Emitir a TODOS los clientes
    io.emit('liberarHorario', reservaData);
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Cliente desconectado:', socket.id);
  });
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/whapi', whapiRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: 'Soumaya Beauty Bar API',
    version: '1.0.0',
    status: 'online',
    websocket: 'activo',
    endpoints: {
      auth: '/api/auth',
      reservations: '/api/reservations',
      whapi: '/api/whapi'
    }
  });
});

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Soumaya Beauty Salon API',
    websocket: io.engine.clientsCount + ' clientes conectados'
  });
});

// Configurar cron job para recordatorios diarios a las 6:30 PM
cron.schedule('30 18 * * *', async () => {
  console.log('⏰ ========== EJECUTANDO CRON JOB DE RECORDATORIOS ==========');
  console.log('Hora:', new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }));
  try {
    await enviarRecordatoriosDiarios();
  } catch (error) {
    console.error('❌ Error en cron job:', error);
  }
}, {
  timezone: 'America/Mexico_City',
  scheduled: true
});

console.log('⏰ Cron job configurado para ejecutarse a las 6:30 PM todos los días (hora México)');

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌐 URL: ${process.env.BACKEND_URL || `http://localhost:${PORT}`}`);
  console.log(`📡 WebSocket activo en ws://localhost:${PORT}`);
  console.log(`📅 Sincronizado con Google Calendar`);
  console.log(`📱 WhatsApp integrado con Whapi.cloud (envío automático)`);
});