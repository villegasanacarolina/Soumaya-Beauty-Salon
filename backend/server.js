import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cron from 'node-cron';
import connectDB from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import whapiRoutes from './routes/whapiRoutes.js';
import { 
  syncGoogleCalendar, 
  verificarIntegridad, 
  sincronizacionCompleta 
} from './utils/syncGoogleCalendar.js';
import { verificarConexionCalendar } from './utils/googleCalendarService.js';
import { enviarRecordatoriosDiarios } from './jobs/cronJobs.js';

dotenv.config();

const app = express();

// Middleware básico
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conectar DB
connectDB();

// ═══════════════════════════════════════════════════════════════════════════
// RUTAS PRINCIPALES
// ═══════════════════════════════════════════════════════════════════════════
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/whapi', whapiRoutes);

// ═══════════════════════════════════════════════════════════════════════════
// RUTAS DE SALUD Y STATUS
// ═══════════════════════════════════════════════════════════════════════════
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'Soumaya Beauty Salon API',
    version: '1.0',
    endpoints: {
      health: '/health',
      syncCalendar: '/api/sync/calendar',
      syncStatus: '/api/sync/status',
      syncFull: '/api/sync/full'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    timezone: 'America/Mexico_City'
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// RUTAS DE SINCRONIZACIÓN DE GOOGLE CALENDAR
// ═══════════════════════════════════════════════════════════════════════════

// Verificar conexión con Google Calendar
app.get('/api/sync/test', async (req, res) => {
  try {
    console.log('🔍 Probando conexión con Google Calendar...');
    const resultado = await verificarConexionCalendar();
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Ver estado de sincronización (cuántas reservas faltan sincronizar)
app.get('/api/sync/status', async (req, res) => {
  try {
    console.log('📊 Verificando estado de sincronización...');
    const resultado = await verificarIntegridad();
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Sincronizar reservas faltantes con Google Calendar
app.post('/api/sync/calendar', async (req, res) => {
  try {
    console.log('🔄 Iniciando sincronización con Google Calendar...');
    const resultado = await syncGoogleCalendar();
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Sincronización completa (verificar + limpiar + sincronizar)
app.post('/api/sync/full', async (req, res) => {
  try {
    console.log('🔄 Iniciando sincronización COMPLETA...');
    const resultado = await sincronizacionCompleta();
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// CRON JOBS
// ═══════════════════════════════════════════════════════════════════════════

// Sincronizar Google Calendar cada hora (por si alguna reserva no se sincronizó)
cron.schedule('0 * * * *', async () => {
  console.log('');
  console.log('⏰ [CRON] Sincronización horaria de Google Calendar');
  try {
    await syncGoogleCalendar();
  } catch (error) {
    console.error('❌ [CRON] Error en sincronización:', error.message);
  }
}, {
  timezone: 'America/Mexico_City'
});

// Enviar recordatorios diarios a las 6:30 PM
cron.schedule('30 18 * * *', async () => {
  console.log('');
  console.log('⏰ [CRON] Enviando recordatorios diarios');
  try {
    await enviarRecordatoriosDiarios();
  } catch (error) {
    console.error('❌ [CRON] Error enviando recordatorios:', error.message);
  }
}, {
  timezone: 'America/Mexico_City'
});

// ═══════════════════════════════════════════════════════════════════════════
// SINCRONIZACIÓN INICIAL AL INICIAR EL SERVIDOR
// ═══════════════════════════════════════════════════════════════════════════
const iniciarSincronizacion = async () => {
  try {
    console.log('');
    console.log('🚀 ═══════════════════════════════════════════════════════');
    console.log('🚀 SINCRONIZACIÓN INICIAL AL INICIAR SERVIDOR');
    console.log('🚀 ═══════════════════════════════════════════════════════');
    
    // Esperar 5 segundos para que la DB se conecte
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verificar conexión con Google Calendar
    const conexion = await verificarConexionCalendar();
    
    if (conexion.success) {
      console.log('✅ Google Calendar conectado');
      
      // Sincronizar reservas faltantes
      const sync = await syncGoogleCalendar();
      
      if (sync.success) {
        console.log(`✅ Sincronización inicial completada: ${sync.creados || 0} eventos creados`);
      }
    } else {
      console.error('❌ No se pudo conectar a Google Calendar:', conexion.error);
    }
    
    console.log('🚀 ═══════════════════════════════════════════════════════');
    console.log('');
  } catch (error) {
    console.error('❌ Error en sincronización inicial:', error.message);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// INICIAR SERVIDOR
// ═══════════════════════════════════════════════════════════════════════════
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✅ Servidor iniciado en puerto ${PORT}`);
  console.log(`📱 WhatsApp: Configurado con Whapi.cloud`);
  console.log(`📅 Google Calendar: Integrado`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('📌 Endpoints de sincronización:');
  console.log(`   GET  /api/sync/test    - Probar conexión`);
  console.log(`   GET  /api/sync/status  - Ver estado`);
  console.log(`   POST /api/sync/calendar - Sincronizar`);
  console.log(`   POST /api/sync/full    - Sincronización completa`);
  console.log('');
  
  // Iniciar sincronización después de que el servidor esté listo
  iniciarSincronizacion();
});