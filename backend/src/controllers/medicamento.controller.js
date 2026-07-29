import mongoose from 'mongoose';
import { Medicamento } from '../models/Medicamento.js';
import { TomaMedicamento } from '../models/TomaMedicamento.js';
import { demoStore } from '../data/demo-store.js';
import { ok, fail, handleError } from '../utils/http.js';

const usingDatabase = () => mongoose.connection.readyState === 1;
const duplicatedTimes = (times = []) => new Set(times).size !== times.length;

export async function listarMedicamentos(req, res) {
  try {
    const medicamentos = usingDatabase()
      ? await Medicamento.find({ pacienteId: req.params.pacienteId }).sort({ activo: -1, nombre: 1 }).lean()
      : demoStore.medicamentos.filter((m) => m.pacienteId === req.params.pacienteId);
    return ok(res, medicamentos);
  } catch (error) { return handleError(res, error); }
}

function getTodayStr() {
  const ecDate = new Date().toLocaleString("en-US", { timeZone: "America/Guayaquil" });
  const d = new Date(ecDate);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function crearMedicamento(req, res) {
  if (duplicatedTimes(req.body.horarios)) return fail(res, 'No se admiten horarios repetidos', 422);
  try {
    const medicamento = usingDatabase()
      ? await Medicamento.create(req.body)
      : { ...req.body, _id: new mongoose.Types.ObjectId().toString(), tieneHistorial: false };
    
    // Generar tomas para HOY
    const today = getTodayStr();
    const tomas = req.body.horarios.map(h => ({
       pacienteId: req.body.pacienteId,
       medicamentoId: medicamento._id,
       fechaProgramada: today,
       horaProgramada: h,
       estado: 'PENDIENTE'
    }));
    if (usingDatabase()) await TomaMedicamento.insertMany(tomas);
    else demoStore.tomas.push(...tomas.map(t => ({ ...t, _id: new mongoose.Types.ObjectId().toString() })));

    if (!usingDatabase()) demoStore.medicamentos.push(medicamento);
    return ok(res, medicamento, 'Medicamento agregado correctamente', 201);
  } catch (error) { return handleError(res, error); }
}

export async function crearReceta(req, res) {
  const medicamentos = req.body.medicamentos || [];
  if (medicamentos.some((item) => duplicatedTimes(item.horarios))) return fail(res, 'La receta contiene horarios repetidos', 422);
  try {
    let creados;
    const today = getTodayStr();
    if (usingDatabase()) {
      creados = await Medicamento.insertMany(medicamentos, { ordered: true });
      const tomas = creados.flatMap(med => med.horarios.map(h => ({
         pacienteId: med.pacienteId,
         medicamentoId: med._id,
         fechaProgramada: today,
         horaProgramada: h,
         estado: 'PENDIENTE'
      })));
      await TomaMedicamento.insertMany(tomas);
    } else {
      creados = medicamentos.map((item) => ({ ...item, _id: new mongoose.Types.ObjectId().toString(), tieneHistorial: false }));
      demoStore.medicamentos.push(...creados);
      const tomas = creados.flatMap(med => med.horarios.map(h => ({
         pacienteId: med.pacienteId,
         medicamentoId: med._id,
         fechaProgramada: today,
         horaProgramada: h,
         estado: 'PENDIENTE',
         _id: new mongoose.Types.ObjectId().toString()
      })));
      demoStore.tomas.push(...tomas);
    }
    return ok(res, creados, `${creados.length} medicamentos agregados desde la receta`, 201);
  } catch (error) { return handleError(res, error); }
}

export async function actualizarMedicamento(req, res) {
  if (duplicatedTimes(req.body.horarios)) return fail(res, 'No se admiten horarios repetidos', 422);
  try {
    let medicamento;
    if (usingDatabase()) {
      medicamento = await Medicamento.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
    } else {
      medicamento = demoStore.medicamentos.find((m) => m._id === req.params.id);
      if (medicamento) Object.assign(medicamento, req.body);
    }
    if (!medicamento) return fail(res, 'Medicamento no encontrado', 404);
    return ok(res, medicamento, 'Medicamento actualizado');
  } catch (error) { return handleError(res, error); }
}

export async function cambiarEstado(req, res) {
  try {
    let medicamento;
    if (usingDatabase()) medicamento = await Medicamento.findByIdAndUpdate(req.params.id, { activo: req.body.activo }, { new: true }).lean();
    else {
      medicamento = demoStore.medicamentos.find((m) => m._id === req.params.id);
      if (medicamento) medicamento.activo = req.body.activo;
    }
    if (!medicamento) return fail(res, 'Medicamento no encontrado', 404);
    return ok(res, medicamento, medicamento.activo ? 'Medicamento activado' : 'Medicamento desactivado');
  } catch (error) { return handleError(res, error); }
}

export async function eliminarMedicamento(req, res) {
  try {
    const tieneHistorial = usingDatabase()
      ? Boolean(await TomaMedicamento.exists({ medicamentoId: req.params.id }))
      : demoStore.medicamentos.find((m) => m._id === req.params.id)?.tieneHistorial;
    if (tieneHistorial) return fail(res, 'No se puede eliminar porque el medicamento tiene historial. Puedes desactivarlo.', 409);

    if (usingDatabase()) await Medicamento.findByIdAndDelete(req.params.id);
    else {
      const index = demoStore.medicamentos.findIndex((m) => m._id === req.params.id);
      if (index < 0) return fail(res, 'Medicamento no encontrado', 404);
      demoStore.medicamentos.splice(index, 1);
    }
    return ok(res, null, 'Medicamento eliminado');
  } catch (error) { return handleError(res, error); }
}
