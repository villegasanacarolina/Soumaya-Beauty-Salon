import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import iniciarRecordatorios from './utils/reminderCron.js';
import authRoutes from './routes/auth.js';
import reservationRoutes from './routes/reservations.js';

// Configurar variables de entorno
dotenv.config();

// Crear aplicación Express
const app = express();

// === CONFIGURACIÓN DE RENDER ===
// Tu URL específica: https://soumaya-beauty-salon.onrender.com
const RENDER_URL = 'https://soumaya-beauty-salon.onrender.com';
const FRONTEND_URL = process.env.NODE_ENV === 'production' 
  ? RENDER_URL 
  : 'http://localhost:3000';

console.log('🚀 Iniciando Soumaya Beauty Salon API');
console.log(`🌍 Frontend URL: ${FRONTEND_URL}`);
console.log(`⚙️  Entorno: ${process.env.NODE_ENV || 'development'}`);

// === CONEXIÓN A BASE DE DATOS ===
console.log('🔗 Conectando a MongoDB...');
connectDB().then(() => {
  console.log('✅ Base de datos lista');
}).catch(err => {
  console.error('❌ Error crítico de base de datos:', err.message);
  // En producción, continuamos pero sin DB
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  Continuando sin base de datos (modo degradado)');
  }
});

// === SISTEMA DE RECORDATORIOS ===
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
  try {
    iniciarRecordatorios();
    console.log('⏰ Sistema de recordatorios activado');
  } catch (error) {
    console.error('❌ Error iniciando recordatorios:', error.message);
  }
} else {
  console.log('⚠️  Twilio no configurado. Recordatorios desactivados.');
}

// === MIDDLEWARE ===
// CORS configurado para Render
app.use(cors({
  origin: [
    'http://localhost:3000',          // Desarrollo local
    'http://localhost:5173',          // Vite dev server
    RENDER_URL,                       // Tu dominio en Render
    'https://soumaya-beauty-salon-frontend.onrender.com', // Posible frontend separado
    'https://*.onrender.com'          // Cualquier subdominio de Render
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Preflight requests
app.options('*', cors());

// Parseo de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// === RUTAS DE API ===
// Health check mejorado
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose?.connection?.readyState === 1 ? 'connected' : 'disconnected';
  
  res.status(200).json({ 
    status: 'OK', 
    service: 'Soumaya Beauty Salon API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: dbStatus,
    uptime: process.uptime(),
    memory: {
      rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`
    }
  });
});

// Información del servidor
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Soumaya Beauty Salon API',
    description: 'Sistema de reservas y gestión de belleza',
    version: '1.0.0',
    author: 'Soumaya Beauty Salon',
    repository: 'https://github.com/tu-usuario/soumaya-beauty-salon',
    endpoints: {
      auth: '/api/auth',
      reservations: '/api/reservations',
      health: '/api/health'
    },
    deployment: {
      platform: 'Render',
      url: RENDER_URL,
      environment: process.env.NODE_ENV
    }
  });
});

// Rutas principales
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);

// === SERVIR FRONTEND EN PRODUCCIÓN ===
if (process.env.NODE_ENV === 'production') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  // Ruta absoluta a la carpeta dist (construcción de Vite)
  const rootDir = path.resolve(__dirname, '..', '..');
  const distPath = path.join(rootDir, 'dist');
  
  console.log(`📁 Sirviendo archivos estáticos desde: ${distPath}`);
  
  // Verificar que existe la carpeta dist
  import('fs').then(fs => {
    if (!fs.existsSync(distPath)) {
      console.error(`❌ ERROR: No se encuentra la carpeta 'dist' en ${distPath}`);
      console.error('   Ejecuta "npm run build" antes de desplegar en producción');
    } else {
      console.log(`✅ Carpeta 'dist' encontrada con ${fs.readdirSync(distPath).length} archivos`);
    }
  }).catch(err => {
    console.error('Error verificando carpeta dist:', err.message);
  });
  
  // Servir archivos estáticos
  app.use(express.static(distPath, {
    maxAge: '1y',
    etag: true,
    immutable: true,
    setHeaders: (res, filePath) => {
      // Cache más agresivo para assets
      if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));
  
  // Para cualquier ruta no API, servir el index.html (SPA)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      const indexPath = path.join(distPath, 'index.html');
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error('Error sirviendo index.html:', err.message);
          res.status(500).json({
            error: 'Error cargando la aplicación',
            message: 'Por favor, contacta al administrador'
          });
        }
      });
    } else {
      // Rutas API no encontradas
      res.status(404).json({ 
        error: 'Ruta API no encontrada',
        path: req.path,
        availableRoutes: ['/api/auth', '/api/reservations', '/api/health', '/api/info']
      });
    }
  });
} else {
  // En desarrollo, mensaje claro
  app.get('/', (req, res) => {
    res.json({
      message: 'API de Soumaya Beauty Salon (Modo Desarrollo)',
      instructions: 'El frontend se ejecuta en http://localhost:3000',
      apiEndpoints: {
        auth: 'http://localhost:5000/api/auth',
        reservations: 'http://localhost:5000/api/reservations',
        health: 'http://localhost:5000/api/health'
      },
      frontend: 'Ejecuta "npm run dev" en otra terminal'
    });
  });
}

// === MANEJO DE ERRORES ===
// 404 para rutas no definidas (solo en desarrollo o API)
app.use('*', (req, res) => {
  if (req.path.startsWith('/api/') || process.env.NODE_ENV !== 'production') {
    res.status(404).json({
      error: 'Ruta no encontrada',
      path: req.path,
      method: req.method
    });
  }
  // En producción, las rutas no-API son manejadas por el frontend SPA
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('❌ Error no manejado:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Error interno del servidor' 
    : err.message;
  
  res.status(statusCode).json({
    error: true,
    message: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// === INICIAR SERVIDOR ===
const PORT = process.env.PORT || 5000;
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

const server = app.listen(PORT, HOST, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 SERVIDOR INICIADO EXITOSAMENTE');
  console.log('='.repeat(50));
  console.log(`✅ Servidor: http://${HOST}:${PORT}`);
  console.log(`🌍 URL Pública: ${RENDER_URL}`);
  console.log(`⚙️  Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📅 Fecha: ${new Date().toLocaleString()}`);
  console.log('='.repeat(50) + '\n');
  
  // Mostrar rutas disponibles
  console.log('📋 RUTAS DISPONIBLES:');
  console.log('├── /api/health     - Health check');
  console.log('├── /api/info       - Información del servidor');
  console.log('├── /api/auth/*     - Autenticación');
  console.log('└── /api/reservations/* - Reservaciones');
  console.log('');
});

// === MANEJO ELEGANTE DE APAGADO ===
process.on('SIGTERM', () => {
  console.log('\n🔻 Recibida señal SIGTERM (Render shutdown)');
  console.log('👋 Cerrando servidor elegantemente...');
  
  server.close(() => {
    console.log('✅ Servidor cerrado');
    process.exit(0);
  });
  
  // Timeout forzado después de 10 segundos
  setTimeout(() => {
    console.log('⏰ Timeout de cierre forzado');
    process.exit(1);
  }, 10000);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Excepción no capturada:', error);
  // No salir en producción, dejar que Render reinicie si es necesario
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️  Promesa rechazada no manejada:', reason);
});

export default app;