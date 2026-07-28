import mongoose from 'mongoose';

const medicionSchema = new mongoose.Schema({
  pacienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Paciente', required: true },
  dispositivoId: { type: String, required: true },
  firebaseEventId: { type: String, unique: true, sparse: true },
  pulsaciones: { type: Number, required: true },
  spo2: { type: Number, required: true },
  origen: { type: String, enum: ['MAX30102', 'PULSADOR'], default: 'MAX30102' },
  estadoSalud: { type: String, enum: ['NORMAL', 'REVISAR', 'ALERTA'], required: true },
  fechaHora: { type: Date, default: Date.now }
}, { collection: 'mediciones' });

export const Medicion = mongoose.model('Medicion', medicionSchema);
