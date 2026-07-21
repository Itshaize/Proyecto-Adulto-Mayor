const mongoose = require('mongoose');

async function connectDatabase() {
  mongoose.connection.on('connected', () => console.log('MongoDB conectado correctamente.'));
  mongoose.connection.on('error', (error) => console.error('Error de MongoDB:', error.message));
  mongoose.connection.on('disconnected', () => console.warn('MongoDB desconectado.'));

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });
  return mongoose.connection;
}

async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}

module.exports = { connectDatabase, disconnectDatabase };
