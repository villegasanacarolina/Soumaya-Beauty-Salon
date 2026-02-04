import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import whapiRoutes from './routes/whapiRoutes.js';
import cron from 'node-cron';

dotenv.config();

const app = express();

// Middleware básico
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conectar DB
connectDB();

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/whapi', whapiRoutes);

// Rutas de salud
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'Soumaya Beauty Salon API',
    version: '1.0'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Puerto
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Servidor en puerto ${PORT}`);
  console.log(`📱 WhatsApp: Configurado con Whapi.cloud`);
  console.log(`📅 Google Calendar: Integrado`);
});