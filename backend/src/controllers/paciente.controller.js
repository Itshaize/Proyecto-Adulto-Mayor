import mongoose from 'mongoose';
import { Paciente } from '../models/Paciente.js';
import { Medicamento } from '../models/Medicamento.js';
import { TomaMedicamento } from '../models/TomaMedicamento.js';
import { Medicion } from '../models/Medicion.js';
import { Alerta } from '../models/Alerta.js';
import { Dispositivo } from '../models/Dispositivo.js';
import { Usuario } from '../models/Usuario.js';
import { demoStore } from '../data/demo-store.js';
import { dateInTimeZone } from '../utils/date.js';
import { ok, fail, handleError } from '../utils/http.js';

const usingDatabase = () => mongoose.connection.readyState === 1;

export async function obtenerPaciente(req, res) {
  try {
    const paciente = usingDatabase()
      ? await Paciente.findById(req.params.id).lean()
      : req.params.id === demoStore.patientId ? demoStore.paciente : null;
    if (!paciente) return fail(res, 'Paciente no encontrado', 404);
    return ok(res, paciente);
  } catch (error) { return handleError(res, error); }
}

export async function crearPaciente(req, res) {
  try {
    const paciente = usingDatabase()
      ? await Paciente.create(req.body)
      : Object.assign(demoStore.paciente, req.body, { _id: demoStore.patientId });
    return ok(res, paciente, 'Paciente registrado correctamente', 201);
  } catch (error) { return handleError(res, error); }
}

export async function actualizarPaciente(req, res) {
  try {
    const paciente = usingDatabase()
      ? await Paciente.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean()
      : req.params.id === demoStore.patientId ? Object.assign(demoStore.paciente, req.body) : null;
    if (!paciente) return fail(res, 'Paciente no encontrado', 404);
    return ok(res, paciente, 'Datos del paciente actualizados');
  } catch (error) { return handleError(res, error); }
}

export async function obtenerResumen(req, res) {
  try {
    if (!usingDatabase()) {
      const ultimaMedicion = demoStore.mediciones.at(-1);
      const tomasHoy = demoStore.tomas.filter((t) => t.fechaProgramada === new Date().toISOString().slice(0, 10));
      return ok(res, {
        paciente: demoStore.paciente,
        ultimaMedicion,
        medicamentosHoy: tomasHoy,
        tomasResumen: { tomadas: tomasHoy.filter((t) => t.estado === 'TOMADA').length, pendientes: tomasHoy.filter((t) => t.estado === 'PENDIENTE').length, total: tomasHoy.length },
        mediciones: demoStore.mediciones,
        alertas: [...demoStore.alertas].sort((a, b) => ({ CRITICA: 3, ADVERTENCIA: 2, INFORMATIVA: 1 }[b.nivel] - { CRITICA: 3, ADVERTENCIA: 2, INFORMATIVA: 1 }[a.nivel]) || new Date(b.fechaHora) - new Date(a.fechaHora)),
        dispositivo: demoStore.dispositivo
      });
    }

    const pacienteId = req.params.id;
    const hoy = new Date().toISOString().slice(0, 10);
    const [paciente, ultimaMedicion, tomasHoy, mediciones, alertas] = await Promise.all([
      Paciente.findById(pacienteId).lean(),
      Medicion.findOne({ pacienteId }).sort({ fechaHora: -1 }).lean(),
      TomaMedicamento.find({ pacienteId, fechaProgramada: hoy }).populate('medicamentoId').lean(),
      Medicion.find({ pacienteId }).sort({ fechaHora: -1 }).limit(14).lean(),
      Alerta.find({ pacienteId }).sort({ nivel: -1, fechaHora: -1 }).limit(8).lean()
    ]);
    if (!paciente) return fail(res, 'Paciente no encontrado', 404);
    const dispositivo = await Dispositivo.findOne({ dispositivoId: paciente.dispositivoId }).lean();
    const medicamentosHoy = tomasHoy.map((t) => ({ ...t, medicamento: t.medicamentoId ? `${t.medicamentoId.nombre} ${t.medicamentoId.concentracion}` : 'Medicamento' }));
    return ok(res, {
      paciente, ultimaMedicion, medicamentosHoy,
      tomasResumen: { tomadas: tomasHoy.filter((t) => t.estado === 'TOMADA').length, pendientes: tomasHoy.filter((t) => t.estado === 'PENDIENTE').length, total: tomasHoy.length },
      mediciones: mediciones.reverse(), alertas, dispositivo
    });
  } catch (error) { return handleError(res, error); }
}

export async function obtenerResumenAdulto(req, res) {
  try {
    const pacienteId = req.params.id;
    if (!usingDatabase()) {
      if (pacienteId !== demoStore.patientId) return fail(res, 'Paciente no encontrado', 404);
      const tomas = demoStore.tomas.filter((toma) => toma.pacienteId === pacienteId && toma.fechaProgramada === dateInTimeZone());
      const ultimaMedicion = demoStore.mediciones.filter((item) => item.pacienteId === pacienteId).sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora))[0] ?? null;
      const alertas = demoStore.alertas.filter((item) => item.pacienteId === pacienteId && !item.leida);
      const estadoGeneral = alertas.some((item) => item.nivel === 'CRITICA') ? 'ALERTA' : (ultimaMedicion?.estadoSalud ?? 'REVISAR');
      return ok(res, {
        paciente: { _id: demoStore.paciente._id, nombre: demoStore.paciente.nombre, edad: demoStore.paciente.edad },
        saludo: `Hola, ${demoStore.paciente.nombre.split(' ')[0]}`,
        estadoGeneral,
        nombreHijo: 'Daniel Pérez',
        telefonoHijo: demoStore.paciente.telefonoContacto,
        medicamentosHoy: tomas.length,
        tomasPendientes: tomas.filter((item) => item.estado === 'PENDIENTE').length,
        ultimaMedicion,
        alertasNoLeidas: alertas.length
      });
    }

    const paciente = await Paciente.findOne({ _id: pacienteId, activo: true }).lean();
    if (!paciente) return fail(res, 'Paciente no encontrado', 404);
    const [hijo, tomas, ultimaMedicion, alertas] = await Promise.all([
      paciente.hijoAdminId ? Usuario.findById(paciente.hijoAdminId).select('nombre telefono').lean() : null,
      TomaMedicamento.find({ pacienteId, fechaProgramada: dateInTimeZone() }).sort({ horaProgramada: 1 }).lean(),
      Medicion.findOne({ pacienteId }).sort({ fechaHora: -1 }).lean(),
      Alerta.find({ pacienteId, leida: false }).sort({ fechaHora: -1 }).limit(10).lean()
    ]);
    const estadoGeneral = alertas.some((item) => item.nivel === 'CRITICA') ? 'ALERTA' : (ultimaMedicion?.estadoSalud ?? 'REVISAR');
    return ok(res, {
      paciente: { _id: paciente._id, nombre: paciente.nombre, edad: paciente.edad },
      saludo: `Hola, ${paciente.nombre.split(' ')[0]}`,
      estadoGeneral,
      nombreHijo: hijo?.nombre ?? 'Su familiar',
      telefonoHijo: hijo?.telefono ?? paciente.telefonoContacto,
      medicamentosHoy: tomas.length,
      tomasPendientes: tomas.filter((item) => item.estado === 'PENDIENTE').length,
      ultimaMedicion,
      alertasNoLeidas: alertas.length
    });
  } catch (error) { return handleError(res, error); }
}
