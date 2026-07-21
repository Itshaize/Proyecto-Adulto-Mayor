import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  correo: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  rol: { type: String, enum: ['HIJO_ADMIN', 'ADULTO_MAYOR', 'TECNICO'], required: true },
  telefono: String,
  activo: { type: Boolean, default: true }
}, { timestamps: true, collection: 'usuarios' });

export const Usuario = mongoose.model('Usuario', usuarioSchema);

