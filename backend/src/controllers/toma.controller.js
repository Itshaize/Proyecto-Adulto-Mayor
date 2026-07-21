const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const TomaMedicamento = require('../models/TomaMedicamento');
const { dateInTimeZone, dateDaysAgo } = require('../utils/date');

function validationErrors(req, res) {
  const result = validationResult(req);
  if (result.isEmpty()) return false;
  res.status(400).json({ ok: false, mensaje: 'Revise los datos enviados', errores: result.array() });
  return true;
}

function enrichedPipeline(match) {
  return [
    { $match: match },
    { $lookup: { from: 'medicamentos', localField: 'medicamentoId', foreignField: '_id', as: 'medicamento' } },
    { $unwind: { path: '$medicamento', preserveNullAndEmptyArrays: true } },
    { $addFields: {
      nombre: { $ifNull: ['$medicamento.nombre', 'Medicamento'] },
      concentracion: { $ifNull: ['$medicamento.concentracion', ''] },
      dosis: { $ifNull: ['$medicamento.dosis', ''] },
      indicaciones: { $ifNull: ['$medicamento.indicaciones', ''] },
    } },
    { $project: { medicamento: 0 } },
    { $sort: { fechaProgramada: -1, horaProgramada: 1 } },
  ];
}

async function getToday(req, res, next) {
  try {
    if (validationErrors(req, res)) return;
    const pacienteId = new mongoose.Types.ObjectId(req.params.pacienteId);
    const data = await TomaMedicamento.aggregate(enrichedPipeline({ pacienteId, fechaProgramada: dateInTimeZone() }));
    res.json({ ok: true, mensaje: 'Tomas de hoy obtenidas correctamente', data });
  } catch (error) { next(error); }
}

async function getHistory(req, res, next) {
  try {
    if (validationErrors(req, res)) return;
    const pacienteId = new mongoose.Types.ObjectId(req.params.pacienteId);
    const days = Number(req.query.dias ?? 7);
    const data = await TomaMedicamento.aggregate(enrichedPipeline({
      pacienteId,
      fechaProgramada: { $gte: dateDaysAgo(days - 1), $lte: dateInTimeZone() },
    }));
    res.json({ ok: true, mensaje: `Historial de ${days} días obtenido correctamente`, data });
  } catch (error) { next(error); }
}

async function confirm(req, res, next) {
  try {
    if (validationErrors(req, res)) return;
    const metodoConfirmacion = req.body.metodoConfirmacion ?? 'APP';
    const toma = await TomaMedicamento.findById(req.params.id);
    if (!toma) return res.status(404).json({ ok: false, mensaje: 'La toma indicada no existe', errores: [] });
    if (toma.estado === 'OMITIDA') return res.status(409).json({ ok: false, mensaje: 'Una toma omitida no puede confirmarse', errores: [] });
    if (toma.estado !== 'TOMADA') {
      toma.estado = 'TOMADA';
      toma.metodoConfirmacion = metodoConfirmacion;
      toma.fechaHoraConfirmacion = new Date();
      if (typeof req.body.observacion === 'string') toma.observacion = req.body.observacion;
      await toma.save();
    }
    res.json({ ok: true, mensaje: 'Su pastilla fue registrada', data: toma });
  } catch (error) { next(error); }
}

module.exports = { getToday, getHistory, confirm };
