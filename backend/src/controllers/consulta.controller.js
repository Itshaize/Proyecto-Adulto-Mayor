import mongoose from 'mongoose';
import { TomaMedicamento } from '../models/TomaMedicamento.js';
import { Medicion } from '../models/Medicion.js';
import { Dispositivo } from '../models/Dispositivo.js';
import { demoStore } from '../data/demo-store.js';
import { dateDaysAgo, dateInTimeZone } from '../utils/date.js';
import { ok, fail, handleError } from '../utils/http.js';

const usingDatabase = () => mongoose.connection.readyState === 1;

function enriquecerToma(toma) {
  const objeto = typeof toma?.toObject === 'function' ? toma.toObject() : { ...toma };
  const poblado = objeto.medicamentoId && typeof objeto.medicamentoId === 'object' ? objeto.medicamentoId : null;
  const medicamento = poblado ?? demoStore.medicamentos.find((item) => String(item._id) === String(objeto.medicamentoId));
  return {
    ...objeto,
    medicamentoId: String(medicamento?._id ?? objeto.medicamentoId),
    medicamento: medicamento ? `${medicamento.nombre} ${medicamento.concentracion}`.trim() : (objeto.medicamento ?? 'Medicamento'),
    nombre: medicamento?.nombre ?? objeto.nombre ?? objeto.medicamento ?? 'Medicamento',
    concentracion: medicamento?.concentracion ?? objeto.concentracion ?? '',
    dosis: objeto.dosis ?? medicamento?.dosis ?? '',
    indicaciones: medicamento?.indicaciones ?? objeto.indicaciones ?? '',
  };
}

function rangoHistorial(req) {
  if (!req.query.dias) return undefined;
  const dias = Math.min(90, Math.max(1, Number(req.query.dias) || 7));
  return { $gte: dateDaysAgo(dias - 1), $lte: dateInTimeZone() };
}

export async function listarTomas(req, res) {
  try {
    const rango = rangoHistorial(req);
    if (usingDatabase()) {
      const filtro = { pacienteId: req.params.pacienteId, ...(rango ? { fechaProgramada: rango } : {}) };
      const tomas = await TomaMedicamento.find(filtro).sort({ fechaProgramada: -1, horaProgramada: 1 }).populate('medicamentoId').lean();
      return ok(res, tomas.map(enriquecerToma));
    }
    const desde = rango?.$gte;
    const tomas = demoStore.tomas
      .filter((toma) => toma.pacienteId === req.params.pacienteId && (!desde || toma.fechaProgramada >= desde))
      .sort((a, b) => b.fechaProgramada.localeCompare(a.fechaProgramada) || a.horaProgramada.localeCompare(b.horaProgramada));
    return ok(res, tomas.map(enriquecerToma));
  } catch (error) { return handleError(res, error); }
}

export async function tomasHoy(req, res) {
  try {
    const hoy = dateInTimeZone();
    const tomas = usingDatabase()
      ? await TomaMedicamento.find({ pacienteId: req.params.pacienteId, fechaProgramada: hoy }).sort({ horaProgramada: 1 }).populate('medicamentoId').lean()
      : demoStore.tomas.filter((t) => t.pacienteId === req.params.pacienteId && t.fechaProgramada === hoy).sort((a, b) => a.horaProgramada.localeCompare(b.horaProgramada));
    return ok(res, tomas.map(enriquecerToma));
  } catch (error) { return handleError(res, error); }
}

export async function confirmarToma(req, res) {
  try {
    const metodoConfirmacion = req.body.metodoConfirmacion ?? 'APP';
    if (!['PULSADOR', 'APP', 'ADMIN'].includes(metodoConfirmacion)) return fail(res, 'Método de confirmación no válido', 422);
    let toma;
    if (usingDatabase()) toma = await TomaMedicamento.findById(req.params.id);
    else toma = demoStore.tomas.find((item) => item._id === req.params.id);
    if (!toma) return fail(res, 'La toma indicada no existe', 404);
    if (toma.estado === 'OMITIDA') return fail(res, 'Una toma omitida no puede confirmarse', 409);
    if (toma.estado !== 'TOMADA') {
      toma.estado = 'TOMADA';
      toma.metodoConfirmacion = metodoConfirmacion;
      toma.fechaHoraConfirmacion = new Date().toISOString();
      if (typeof req.body.observacion === 'string') toma.observacion = req.body.observacion;
      if (usingDatabase()) await toma.save();
    }
    return ok(res, enriquecerToma(toma), 'Su pastilla fue registrada');
  } catch (error) { return handleError(res, error); }
}

export async function resumenTomas(req, res) {
  try {
    const hoy = dateInTimeZone();
    const tomas = usingDatabase()
      ? await TomaMedicamento.find({ pacienteId: req.params.pacienteId, fechaProgramada: hoy }).lean()
      : demoStore.tomas.filter((t) => t.pacienteId === req.params.pacienteId && t.fechaProgramada === hoy);
    return ok(res, { total: tomas.length, tomadas: tomas.filter((t) => t.estado === 'TOMADA').length, pendientes: tomas.filter((t) => t.estado === 'PENDIENTE').length, omitidas: tomas.filter((t) => t.estado === 'OMITIDA').length });
  } catch (error) { return handleError(res, error); }
}

export async function listarMediciones(req, res) {
  try {
    const dias = req.query.dias ? Math.min(90, Math.max(1, Number(req.query.dias) || 7)) : 0;
    const desde = dias ? new Date(Date.now() - dias * 86400000) : null;
    const filtro = { pacienteId: req.params.pacienteId, ...(desde ? { fechaHora: { $gte: desde } } : {}) };
    const mediciones = usingDatabase()
      ? await Medicion.find(filtro).sort({ fechaHora: -1 }).lean()
      : demoStore.mediciones.filter((item) => item.pacienteId === req.params.pacienteId && (!desde || new Date(item.fechaHora) >= desde)).sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora));
    return ok(res, mediciones);
  } catch (error) { return handleError(res, error); }
}

export async function ultimaMedicion(req, res) {
  try {
    const medicion = usingDatabase()
      ? await Medicion.findOne({ pacienteId: req.params.pacienteId }).sort({ fechaHora: -1 }).lean()
      : demoStore.mediciones.filter((item) => item.pacienteId === req.params.pacienteId).sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora))[0];
    if (!medicion) return fail(res, 'No hay mediciones disponibles', 404);
    return ok(res, medicion);
  } catch (error) { return handleError(res, error); }
}

export async function resumenMediciones(req, res) {
  try {
    const mediciones = usingDatabase()
      ? await Medicion.find({ pacienteId: req.params.pacienteId }).sort({ fechaHora: -1 }).limit(14).lean()
      : demoStore.mediciones.filter((item) => item.pacienteId === req.params.pacienteId);
    const promedio = (key) => mediciones.length ? Math.round(mediciones.reduce((sum, item) => sum + item[key], 0) / mediciones.length) : 0;
    return ok(res, { promedioPulsaciones: promedio('pulsaciones'), promedioSpo2: promedio('spo2'), mediciones });
  } catch (error) { return handleError(res, error); }
}

export async function estadoDispositivo(req, res) {
  try {
    const dispositivo = usingDatabase()
      ? await Dispositivo.findOne({ dispositivoId: req.params.dispositivoId }).lean()
      : demoStore.dispositivo.dispositivoId === req.params.dispositivoId ? demoStore.dispositivo : null;
    if (!dispositivo) return fail(res, 'Dispositivo no encontrado', 404);
    return ok(res, dispositivo);
  } catch (error) { return handleError(res, error); }
}
