import mongoose from 'mongoose';

const alertaSchema = new mongoose.Schema({
  pacienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Paciente', required: true },
  firebaseEventId: { type: String, unique: true, sparse: true },
  tipo: { type: String, required: true },
  titulo: { type: String, required: true },
  mensaje: { type: String, required: true },
  nivel: { type: String, enum: ['INFORMATIVA', 'ADVERTENCIA', 'CRITICA'], required: true },
  leida: { type: Boolean, default: false },
  fechaHora: { type: Date, default: Date.now }
}, { collection: 'alertas' });

export const Alerta = mongoose.model('Alerta', alertaSchema);

