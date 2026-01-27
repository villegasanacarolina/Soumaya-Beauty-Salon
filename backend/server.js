import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import iniciarRecordatorios from './utils/reminderCron.js';
import authRoutes from './routes/auth.js';
import reservationRoutes from './routes/reservations.js';

dotenv.config();

const app = express();

// Conectar a MongoDB
connectDB();

// Iniciar sistema de recordatorios
iniciarRecordatorios();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});