import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import reservationRoutes from './routes/reservations.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Conectar a MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Soumaya Beauty Salon API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    message: 'Backend funcionando correctamente'
  });
});

// INFO: Ruta para verificar estructura de archivos
app.get('/api/debug', async (req, res) => {
  const fs = await import('fs');
  const rootDir = process.cwd();
  const distPath = path.join(rootDir, 'dist');
  
  try {
    const files = {
      root: fs.readdirSync(rootDir),
      dist: fs.existsSync(distPath) ? fs.readdirSync(distPath) : 'NO EXISTE',
      currentDir: __dirname,
      projectRoot: rootDir
    };
    res.json(files);
  } catch (error) {
    res.json({ error: error.message });
  }
});

// Servir archivos estáticos - MÚLTIPLES UBICACIONES POSIBLES
app.use(express.static('dist'));
app.use(express.static('public'));

// Intentar servir desde varias ubicaciones posibles
const possibleDistPaths = [
  'dist',                          // Raíz del proyecto
  path.join(__dirname, '..', 'dist'),  // Un nivel arriba desde backend/
  path.join(__dirname, '..', '..', 'dist'), // Dos niveles arriba
  '/opt/render/project/dist',      // Ruta absoluta en Render
];

// Verificar y servir desde la primera ubicación que exista
let distFound = false;
possibleDistPaths.forEach(distPath => {
  import('fs').then(fs => {
    if (fs.existsSync(distPath) && fs.existsSync(path.join(distPath, 'index.html'))) {
      if (!distFound) {
        console.log(`✅ Sirviendo frontend desde: ${distPath}`);
        app.use(express.static(distPath));
        distFound = true;
      }
    }
  });
});

// Ruta principal - FALLBACK si no hay dist/
app.get('/', (req, res) => {
  const fs = import('fs').then(fs => {
    // Intentar servir index.html desde dist/
    for (const distPath of possibleDistPaths) {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        console.log(`📄 Sirviendo index.html desde: ${indexPath}`);
        return res.sendFile(indexPath);
      }
    }
    
    // Si no existe, servir HTML embebido
    console.log('⚠️  No se encontró dist/index.html, sirviendo HTML embebido');
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Soumaya Beauty Salon</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 50px; text-align: center; }
          h1 { color: #d4a574; }
          .status { background: #4CAF50; color: white; padding: 10px; border-radius: 5px; display: inline-block; }
        </style>
      </head>
      <body>
        <h1>✨ Soumaya Beauty Salon</h1>
        <div class="status">✅ Backend funcionando</div>
        <p>Frontend disponible en breve.</p>
        <p><a href="/api/health">Ver estado del sistema</a></p>
        <p><small>Dist folder not found. Check <a href="/api/debug">/api/debug</a></small></p>
      </body>
      </html>
    `);
  }).catch(err => {
    // Fallback absoluto
    res.send('<h1>Soumaya Beauty Salon</h1><p>Backend OK</p>');
  });
});

// Para otras rutas no API, redirigir a /
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'Endpoint API no encontrado' });
  } else {
    res.redirect('/');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
  console.log(`📁 Directorio actual: ${process.cwd()}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  
  // Verificar dist/ al iniciar
  import('fs').then(fs => {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      console.log(`📂 dist/ encontrada en: ${distPath}`);
      console.log(`   Contenido: ${fs.readdirSync(distPath).join(', ')}`);
    } else {
      console.log(`⚠️  dist/ NO encontrada en: ${distPath}`);
    }
  });
});