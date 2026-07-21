import 'dotenv/config';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { Usuario } from '../models/Usuario.js';
import { Paciente } from '../models/Paciente.js';
import { Medicamento } from '../models/Medicamento.js';
import { TomaMedicamento } from '../models/TomaMedicamento.js';
import { Medicion } from '../models/Medicion.js';
import { Alerta } from '../models/Alerta.js';
import { Dispositivo } from '../models/Dispositivo.js';

if (!process.env.MONGODB_URI) throw new Error('Define MONGODB_URI en backend/.env antes de ejecutar la semilla.');
await mongoose.connect(process.env.MONGODB_URI);

try {
  const pacienteId = new mongoose.Types.ObjectId('66a000000000000000000001');
  const passwordHash = await bcrypt.hash('Admin123', 12);
  const admin = await Usuario.findOneAndUpdate(
    { correo: 'daniel@salud.ec' },
    { nombre: 'Daniel Pérez', correo: 'daniel@salud.ec', passwordHash, rol: 'HIJO_ADMIN', telefono: '+593999999999', activo: true },
    { upsert: true, new: true, runValidators: true }
  );
  const adulto = await Usuario.findOneAndUpdate(
    { correo: 'carlos@salud.ec' },
    { nombre: 'Carlos Pérez', correo: 'carlos@salud.ec', passwordHash, rol: 'ADULTO_MAYOR', telefono: '+593999999999', activo: true },
    { upsert: true, new: true, runValidators: true }
  );
  const paciente = await Paciente.findOneAndUpdate(
    { _id: pacienteId },
    { nombre: 'Carlos Pérez', edad: 78, fechaNacimiento: '1948-05-10', diagnosticos: ['Hipertensión', 'Diabetes tipo 2'], telefonoContacto: '+593999999999', hijoAdminId: admin._id, usuarioAdultoId: adulto._id, dispositivoId: 'ESP32-001', activo: true },
    { upsert: true, new: true, runValidators: true }
  );
  const definitions = [
    ['Losartán', '50 mg', '1 tableta', '08:00', 'Después del desayuno'],
    ['Metformina', '850 mg', '1 tableta', '13:00', 'Con alimentos'],
    ['Amlodipino', '5 mg', '1 tableta', '20:00', ''],
    ['Atorvastatina', '20 mg', '1 tableta', '22:00', 'Antes de dormir']
  ];
  const medicamentos = [];
  for (const [nombre, concentracion, dosis, horario, indicaciones] of definitions) {
    medicamentos.push(await Medicamento.findOneAndUpdate(
      { pacienteId: paciente._id, nombre, concentracion },
      { pacienteId: paciente._id, nombre, concentracion, dosis, horarios: [horario], frecuencia: 'DIARIA', indicaciones, activo: true },
      { upsert: true, new: true, runValidators: true }
    ));
  }
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  await Dispositivo.findOneAndUpdate({ dispositivoId: 'ESP32-001' }, { dispositivoId: 'ESP32-001', pacienteId: paciente._id, estado: 'CONECTADO', ultimaConexion: now, versionFirmware: '1.0.0' }, { upsert: true, new: true });
  if (!await Medicion.exists({ pacienteId: paciente._id })) {
    await Medicion.insertMany([82, 77, 86, 78, 69, 74, 67, 59, 72].map((pulsaciones, index) => ({ pacienteId: paciente._id, dispositivoId: 'ESP32-001', pulsaciones, spo2: [97, 96, 97, 95, 96, 94, 96, 95, 94][index], estadoSalud: index === 8 ? 'REVISAR' : 'NORMAL', fechaHora: new Date(Date.now() - (8 - index) * 86400000) })));
  }
  if (!await TomaMedicamento.exists({ pacienteId: paciente._id })) {
    await TomaMedicamento.insertMany(medicamentos.map((medicamento, index) => ({ pacienteId: paciente._id, medicamentoId: medicamento._id, fechaProgramada: today, horaProgramada: medicamento.horarios[0], estado: index < 2 ? 'TOMADA' : 'PENDIENTE', metodoConfirmacion: index === 0 ? 'PULSADOR' : index === 1 ? 'APP' : undefined, fechaHoraConfirmacion: index < 2 ? now : undefined })));
  }
  if (!await Alerta.exists({ pacienteId: paciente._id })) {
    await Alerta.insertMany([
      { pacienteId: paciente._id, tipo: 'SPO2_BAJA', titulo: 'SpO₂ baja', mensaje: 'Se registró una medición de 94%', nivel: 'CRITICA', leida: false, fechaHora: now },
      { pacienteId: paciente._id, tipo: 'MEDICAMENTO_NO_CONFIRMADO', titulo: 'Medicamento no confirmado', mensaje: 'Amlodipino 5 mg — 20:00', nivel: 'ADVERTENCIA', leida: false, fechaHora: now }
    ]);
  }
  console.info(`Semilla lista. Paciente: ${paciente._id}`);
  console.info('Acceso: daniel@salud.ec / Admin123');
  console.info('Acceso adulto: carlos@salud.ec / Admin123');
} finally {
  await mongoose.disconnect();
}
