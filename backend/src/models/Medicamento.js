import mongoose from 'mongoose';

const medicamentoSchema = new mongoose.Schema({
  pacienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Paciente', required: true },
  nombre: { type: String, required: true, trim: true },
  concentracion: { type: String, required: true, trim: true },
  dosis: { type: String, required: true, trim: true },
  horarios: [{ type: String, required: true }],
  frecuencia: { type: String, default: 'DIARIA' },
  indicaciones: { type: String, default: '' },
  recetaMedico: { type: String, trim: true, default: '' },
  recetaFecha: { type: String, match: /^\d{4}-\d{2}-\d{2}$/, default: '' },
  recetaObservacion: { type: String, trim: true, maxlength: 1000, default: '' },
  activo: { type: Boolean, default: true },
  tieneHistorial: { type: Boolean, default: false }
}, { timestamps: true, collection: 'medicamentos' });

export const Medicamento = mongoose.model('Medicamento', medicamentoSchema);
