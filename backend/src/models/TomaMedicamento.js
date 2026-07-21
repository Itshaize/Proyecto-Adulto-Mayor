const mongoose = require('mongoose');

const tomaMedicamentoSchema = new mongoose.Schema({
  pacienteId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  medicamentoId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  fechaProgramada: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/, index: true },
  horaProgramada: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  estado: { type: String, enum: ['PENDIENTE', 'TOMADA', 'OMITIDA'], default: 'PENDIENTE', required: true },
  metodoConfirmacion: { type: String, enum: ['PULSADOR', 'APP', 'ADMIN'] },
  fechaHoraConfirmacion: { type: Date },
  observacion: { type: String, trim: true, maxlength: 500, default: '' },
}, { collection: 'tomas_medicamentos', versionKey: false });

tomaMedicamentoSchema.index(
  { pacienteId: 1, medicamentoId: 1, fechaProgramada: 1, horaProgramada: 1 },
  { unique: true, name: 'toma_programada_unica' },
);

module.exports = mongoose.models.TomaMedicamento
  || mongoose.model('TomaMedicamento', tomaMedicamentoSchema);
