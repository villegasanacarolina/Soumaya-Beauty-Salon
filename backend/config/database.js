import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB conectado');
  } catch (error) {
    console.error('❌ Error de conexión MongoDB:', error.message);
    process.exit(1);
  }
};

export default connectDB;