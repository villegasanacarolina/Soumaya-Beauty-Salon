import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de conexión
const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout para seleccionar servidor
  socketTimeoutMS: 45000, // Timeout para operaciones
  maxPoolSize: 10, // Máximo de conexiones en el pool
  minPoolSize: 2, // Mínimo de conexiones en el pool
  retryWrites: true,
  w: 'majority'
};

// Cachear la conexión para evitar conexiones múltiples
let cachedConnection = null;

const connectDB = async () => {
  // Si ya tenemos una conexión caché, usarla
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('📁 Usando conexión MongoDB existente');
    return cachedConnection;
  }

  // Validar que tenemos la URI
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI no está definida en las variables de entorno');
    
    // En desarrollo, podríamos usar una DB local
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  Usando MongoDB local para desarrollo');
      process.env.MONGODB_URI = 'mongodb://localhost:27017/soumaya-beauty-dev';
    } else {
      throw new Error('MONGODB_URI no configurada para producción');
    }
  }

  try {
    console.log('🔗 Conectando a MongoDB...');
    
    // Conectar con opciones mejoradas
    await mongoose.connect(process.env.MONGODB_URI, connectionOptions);
    
    // Guardar la conexión en caché
    cachedConnection = mongoose.connection;
    
    // Obtener información de la conexión
    const conn = mongoose.connection;
    const dbInfo = {
      host: conn.host,
      name: conn.name,
      port: conn.port,
      readyState: conn.readyState
    };
    
    console.log(`✅ MongoDB Conectado exitosamente`);
    console.log(`   📊 Base de datos: ${dbInfo.name}`);
    console.log(`   🏠 Host: ${dbInfo.host}`);
    console.log(`   🔌 Estado: ${getConnectionState(dbInfo.readyState)}`);
    
    // Manejar eventos de conexión
    setupConnectionHandlers(conn);
    
    return conn;
    
  } catch (error) {
    console.error(`❌ Error conectando a MongoDB: ${error.message}`);
    console.error(`   📍 URI: ${process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 50) + '...' : 'No definida'}`);
    
    // Estrategias de reconexión
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Intentando reconectar en 10 segundos...');
      
      // Esperar y reconectar (para producción)
      setTimeout(async () => {
        try {
          await connectDB();
        } catch (retryError) {
          console.error('❌ Reconexión fallida:', retryError.message);
        }
      }, 10000);
      
      // No salir del proceso en producción, dejar que siga intentando
      throw error;
    } else {
      // En desarrollo, salir del proceso
      console.log('💡 En desarrollo, el servidor se detendrá. En producción se intentará reconectar.');
      process.exit(1);
    }
  }
};

// Helper para obtener estado de conexión legible
function getConnectionState(state) {
  const states = {
    0: 'Desconectado',
    1: 'Conectado',
    2: 'Conectando',
    3: 'Desconectando'
  };
  return states[state] || `Desconocido (${state})`;
}

// Configurar manejadores de eventos de conexión
function setupConnectionHandlers(connection) {
  // Evento cuando se conecta
  connection.on('connected', () => {
    console.log('🔗 MongoDB conectado');
  });
  
  // Evento de error
  connection.on('error', (err) => {
    console.error(`❌ Error de MongoDB: ${err.message}`);
    
    // Solo en producción, intentar reconectar
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Programando reconexión en 15 segundos...');
      setTimeout(async () => {
        try {
          await mongoose.disconnect();
          await connectDB();
        } catch (reconnectError) {
          console.error('❌ Reconexión automática fallida:', reconnectError.message);
        }
      }, 15000);
    }
  });
  
  // Evento cuando se desconecta
  connection.on('disconnected', () => {
    console.log('⚠️ MongoDB desconectado');
    
    // Solo en producción, intentar reconectar
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Intentando reconectar en 5 segundos...');
      setTimeout(async () => {
        try {
          await connectDB();
        } catch (reconnectError) {
          console.error('❌ Reconexión automática fallida:', reconnectError.message);
        }
      }, 5000);
    }
  });
  
  // Evento cuando la conexión se abre
  connection.on('open', () => {
    console.log('🚀 Conexión MongoDB abierta');
  });
  
  // Manejar cierre de la aplicación
  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
}

// Cierre elegante de la conexión
async function gracefulShutdown() {
  console.log('👋 Recibida señal de terminación, cerrando conexión MongoDB...');
  
  try {
    await mongoose.connection.close();
    console.log('✅ Conexión MongoDB cerrada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cerrando conexión MongoDB:', error.message);
    process.exit(1);
  }
}

// Función para verificar el estado de la conexión
export const checkConnection = () => {
  const state = mongoose.connection.readyState;
  return {
    connected: state === 1,
    state: getConnectionState(state),
    dbName: mongoose.connection.name,
    host: mongoose.connection.host
  };
};

// Función para obtener estadísticas de la conexión
export const getConnectionStats = async () => {
  try {
    const stats = await mongoose.connection.db.stats();
    return {
      collections: stats.collections,
      objects: stats.objects,
      dataSize: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`,
      storageSize: `${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`,
      indexes: stats.indexes,
      indexSize: `${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error.message);
    return null;
  }
};

export default connectDB;