import mongoose from 'mongoose';

const pacienteSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  edad: { type: Number, required: true, min: 1 },
  fechaNacimiento: { type: String, required: true },
  diagnosticos: [{ type: String, trim: true }],
  telefonoContacto: { type: String, required: true, trim: true },
  hijoAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  usuarioAdultoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  dispositivoId: { type: String, required: true, trim: true, uppercase: true, unique: true },
  activo: { type: Boolean, default: true }
}, { timestamps: true, collection: 'pacientes' });

export const Paciente = mongoose.model('Paciente', pacienteSchema);

