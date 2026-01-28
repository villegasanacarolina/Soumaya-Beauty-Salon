import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    // REMUEVE las opciones deprecated
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB conectado');
  } catch (error) {
    console.error('❌ Error de conexión MongoDB:', error.message);
    console.log('💡 Solución: Agrega 0.0.0.0/0 a IP Whitelist en MongoDB Atlas');
    
    // En producción, no salir del proceso
    if (process.env.NODE_ENV === 'production') {
      console.log('⚠️ Continuando sin base de datos');
    } else {
      process.exit(1);
    }
  }
};

export default connectDB;