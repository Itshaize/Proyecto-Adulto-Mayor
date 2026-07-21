import { dateInTimeZone } from '../utils/date.js';

const patientId = '66a000000000000000000001';
const adminId = '66a000000000000000000010';
const adultId = '66a000000000000000000011';
const pacienteInicial = {
  _id: patientId,
  nombre: 'Carlos Pérez', edad: 78, fechaNacimiento: '1948-05-10',
  diagnosticos: ['Hipertensión', 'Diabetes tipo 2'], telefonoContacto: '+593999999999',
  hijoAdminId: adminId, usuarioAdultoId: adultId,
  dispositivoId: 'ESP32-001', activo: true
};

const isoAt = (daysAgo, hour, minute = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};
const dateKey = (daysAgo = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return dateInTimeZone(date);
};

export const demoStore = {
  patientId,
  paciente: pacienteInicial,
  pacientes: [pacienteInicial],
  usuarios: [
    { _id: adminId, nombre: 'Daniel Pérez', correo: 'daniel@salud.ec', password: 'Admin123', rol: 'HIJO_ADMIN', telefono: '+593999999999', activo: true },
    { _id: adultId, nombre: 'Carlos Pérez', correo: 'carlos@salud.ec', password: 'Admin123', rol: 'ADULTO_MAYOR', telefono: '+593999999999', pacienteId: patientId, activo: true }
  ],
  medicamentos: [
    { _id: '66b000000000000000000001', pacienteId: patientId, nombre: 'Losartán', concentracion: '50 mg', dosis: '1 tableta', horarios: ['08:00'], frecuencia: 'DIARIA', indicaciones: 'Después del desayuno', activo: true, tieneHistorial: true },
    { _id: '66b000000000000000000002', pacienteId: patientId, nombre: 'Metformina', concentracion: '850 mg', dosis: '1 tableta', horarios: ['13:00'], frecuencia: 'DIARIA', indicaciones: 'Con alimentos', activo: true, tieneHistorial: true },
    { _id: '66b000000000000000000003', pacienteId: patientId, nombre: 'Amlodipino', concentracion: '5 mg', dosis: '1 tableta', horarios: ['20:00'], frecuencia: 'DIARIA', indicaciones: '', activo: true, tieneHistorial: true },
    { _id: '66b000000000000000000004', pacienteId: patientId, nombre: 'Atorvastatina', concentracion: '20 mg', dosis: '1 tableta', horarios: ['22:00'], frecuencia: 'DIARIA', indicaciones: 'Antes de dormir', activo: true, tieneHistorial: false }
  ],
  tomas: [
    { _id: 't1', pacienteId: patientId, medicamentoId: '66b000000000000000000001', medicamento: 'Losartán 50 mg', dosis: '1 tableta', fechaProgramada: dateKey(), horaProgramada: '08:00', estado: 'TOMADA', metodoConfirmacion: 'PULSADOR', fechaHoraConfirmacion: isoAt(0, 8, 3) },
    { _id: 't2', pacienteId: patientId, medicamentoId: '66b000000000000000000002', medicamento: 'Metformina 850 mg', dosis: '1 tableta', fechaProgramada: dateKey(), horaProgramada: '13:00', estado: 'TOMADA', metodoConfirmacion: 'APP', fechaHoraConfirmacion: isoAt(0, 13, 5) },
    { _id: 't3', pacienteId: patientId, medicamentoId: '66b000000000000000000003', medicamento: 'Amlodipino 5 mg', dosis: '1 tableta', fechaProgramada: dateKey(), horaProgramada: '20:00', estado: 'PENDIENTE', metodoConfirmacion: null, fechaHoraConfirmacion: null },
    { _id: 't4', pacienteId: patientId, medicamentoId: '66b000000000000000000004', medicamento: 'Atorvastatina 20 mg', dosis: '1 tableta', fechaProgramada: dateKey(), horaProgramada: '22:00', estado: 'PENDIENTE', metodoConfirmacion: null, fechaHoraConfirmacion: null },
    { _id: 't5', pacienteId: patientId, medicamentoId: '66b000000000000000000001', medicamento: 'Losartán 50 mg', dosis: '1 tableta', fechaProgramada: dateKey(1), horaProgramada: '08:00', estado: 'TOMADA', metodoConfirmacion: 'PULSADOR', fechaHoraConfirmacion: isoAt(1, 8, 2) },
    { _id: 't6', pacienteId: patientId, medicamentoId: '66b000000000000000000002', medicamento: 'Metformina 850 mg', dosis: '1 tableta', fechaProgramada: dateKey(1), horaProgramada: '13:00', estado: 'TOMADA', metodoConfirmacion: 'APP', fechaHoraConfirmacion: isoAt(1, 13, 4) }
  ],
  mediciones: [82, 77, 86, 78, 69, 74, 67, 59, 72].map((pulsaciones, index) => ({
    _id: `m${index + 1}`, pacienteId: patientId, dispositivoId: 'ESP32-001',
    pulsaciones, spo2: [97, 96, 97, 95, 96, 94, 96, 95, 94][index],
    estadoSalud: index === 8 ? 'REVISAR' : 'NORMAL', fechaHora: isoAt(8 - index, 9, 20)
  })),
  alertas: [
    { _id: 'a1', pacienteId: patientId, tipo: 'MEDICAMENTO_NO_CONFIRMADO', titulo: 'Medicamento no confirmado', mensaje: 'Amlodipino 5 mg — 20:00', nivel: 'ADVERTENCIA', leida: false, fechaHora: isoAt(0, 20, 10) },
    { _id: 'a2', pacienteId: patientId, tipo: 'SPO2_BAJA', titulo: 'SpO₂ baja', mensaje: 'Se registró una medición de 94%', nivel: 'CRITICA', leida: false, fechaHora: isoAt(0, 9, 15) },
    { _id: 'a3', pacienteId: patientId, tipo: 'ULTIMA_CONEXION_INUSUAL', titulo: 'Última conexión inusual', mensaje: 'El dispositivo tardó más de lo esperado', nivel: 'INFORMATIVA', leida: true, fechaHora: isoAt(0, 9, 20) },
    { _id: 'a4', pacienteId: patientId, tipo: 'PASTILLA_PENDIENTE', titulo: 'Pastilla pendiente', mensaje: 'Atorvastatina 20 mg — 22:00', nivel: 'ADVERTENCIA', leida: false, fechaHora: isoAt(0, 19, 55) }
  ],
  dispositivo: { _id: 'd1', dispositivoId: 'ESP32-001', pacienteId: patientId, estado: 'CONECTADO', ultimaConexion: isoAt(0, 9, 20), versionFirmware: '1.0.0' }
};
