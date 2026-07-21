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

export async function crearMedicamento(req, res) {
  if (duplicatedTimes(req.body.horarios)) return fail(res, 'No se admiten horarios repetidos', 422);
  try {
    const medicamento = usingDatabase()
      ? await Medicamento.create(req.body)
      : { ...req.body, _id: new mongoose.Types.ObjectId().toString(), tieneHistorial: false };
    if (!usingDatabase()) demoStore.medicamentos.push(medicamento);
    return ok(res, medicamento, 'Medicamento agregado correctamente', 201);
  } catch (error) { return handleError(res, error); }
}

export async function crearReceta(req, res) {
  const medicamentos = req.body.medicamentos || [];
  if (medicamentos.some((item) => duplicatedTimes(item.horarios))) return fail(res, 'La receta contiene horarios repetidos', 422);
  try {
    let creados;
    if (usingDatabase()) {
      creados = await Medicamento.insertMany(medicamentos, { ordered: true });
    } else {
      creados = medicamentos.map((item) => ({ ...item, _id: new mongoose.Types.ObjectId().toString(), tieneHistorial: false }));
      demoStore.medicamentos.push(...creados);
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
