import mongoose from 'mongoose';

export async function connectDatabase(uri) {
  if (!uri) {
    console.info('[API] Modo demostración: datos temporales en memoria.');
    return false;
  }

  await mongoose.connect(uri);
  console.info('[API] MongoDB conectado.');
  return true;
}

