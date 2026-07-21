import mongoose from 'mongoose';

const dispositivoSchema = new mongoose.Schema({
  dispositivoId: { type: String, required: true, unique: true },
  pacienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Paciente', required: true },
  estado: { type: String, enum: ['CONECTADO', 'DESCONECTADO', 'ERROR'], required: true },
  ultimaConexion: { type: Date, required: true },
  versionFirmware: { type: String, default: '1.0.0' }
}, { collection: 'dispositivos' });

export const Dispositivo = mongoose.model('Dispositivo', dispositivoSchema);

