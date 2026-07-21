import mongoose from 'mongoose';
import { Alerta } from '../models/Alerta.js';
import { demoStore } from '../data/demo-store.js';
import { ok, fail, handleError } from '../utils/http.js';

const usingDatabase = () => mongoose.connection.readyState === 1;
const severity = { CRITICA: 3, ADVERTENCIA: 2, INFORMATIVA: 1 };

export async function listarAlertas(req, res) {
  try {
    const soloNoLeidas = req.query.soloNoLeidas === 'true';
    let alertas = usingDatabase()
      ? await Alerta.find({ pacienteId: req.params.pacienteId, ...(soloNoLeidas ? { leida: false } : {}) }).sort({ fechaHora: -1 }).lean()
      : demoStore.alertas.filter((a) => a.pacienteId === req.params.pacienteId);
    if (soloNoLeidas) alertas = alertas.filter((alerta) => !alerta.leida);
    alertas = alertas.sort((a, b) => severity[b.nivel] - severity[a.nivel] || new Date(b.fechaHora) - new Date(a.fechaHora));
    return ok(res, alertas);
  } catch (error) { return handleError(res, error); }
}

export async function marcarLeida(req, res) {
  try {
    let alerta;
    if (usingDatabase()) alerta = await Alerta.findByIdAndUpdate(req.params.id, { leida: true }, { new: true }).lean();
    else {
      alerta = demoStore.alertas.find((a) => a._id === req.params.id);
      if (alerta) alerta.leida = true;
    }
    if (!alerta) return fail(res, 'Alerta no encontrada', 404);
    return ok(res, alerta, 'Alerta marcada como leída');
  } catch (error) { return handleError(res, error); }
}
