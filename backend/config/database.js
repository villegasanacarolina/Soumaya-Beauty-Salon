import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    console.log(`📊 Base de datos: ${conn.connection.name}`);
    
    // Verificar conexión
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📁 Colecciones: ${collections.length}`);
    
    return conn;
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    console.error('🔗 URI usada:', process.env.MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
    
    // Intentar reconectar después de 5 segundos
    setTimeout(() => {
      console.log('🔄 Intentando reconectar a MongoDB...');
      connectDB();
    }, 5000);
    
    process.exit(1);
  }
};

// Manejar eventos de conexión
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose conectado a la base de datos');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Error de conexión Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose desconectado');
});

// Manejar cierre de aplicación
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('👋 Mongoose desconectado por terminación de aplicación');
  process.exit(0);
});

export default connectDB;