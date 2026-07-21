const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const { dateInTimeZone } = require('../utils/date');

async function getAdultSummary(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ ok: false, mensaje: 'Paciente no válido', errores: errors.array() });

    const pacienteId = new mongoose.Types.ObjectId(req.params.id);
    const db = mongoose.connection.db;
    const paciente = await db.collection('pacientes').findOne({ _id: pacienteId, activo: { $ne: false } });
    if (!paciente) return res.status(404).json({ ok: false, mensaje: 'El paciente no existe o está inactivo', errores: [] });

    const today = dateInTimeZone();
    const [hijo, tomas, ultimaMedicion, alertas] = await Promise.all([
      paciente.hijoAdminId ? db.collection('usuarios').findOne({ _id: paciente.hijoAdminId }) : null,
      db.collection('tomas_medicamentos').aggregate([
        { $match: { pacienteId, fechaProgramada: today } },
        { $lookup: { from: 'medicamentos', localField: 'medicamentoId', foreignField: '_id', as: 'medicamento' } },
        { $unwind: { path: '$medicamento', preserveNullAndEmptyArrays: true } },
        { $sort: { horaProgramada: 1 } },
      ]).toArray(),
      db.collection('mediciones').find({ pacienteId }).sort({ fechaHora: -1 }).limit(1).next(),
      db.collection('alertas').find({ pacienteId, leida: false }).sort({ fechaHora: -1 }).limit(10).toArray(),
    ]);

    const nextDose = tomas.find((item) => item.estado === 'PENDIENTE') ?? null;
    const healthState = ultimaMedicion?.estadoSalud ?? 'REVISAR';
    const generalState = alertas.some((item) => item.nivel === 'CRITICA' || item.nivel === 'ALERTA')
      ? 'ALERTA' : healthState;

    const data = {
      paciente: { _id: paciente._id, nombre: paciente.nombre, edad: paciente.edad },
      saludo: 'Hola, Papá',
      estadoGeneral: generalState,
      telefonoHijo: hijo?.telefono ?? paciente.telefonoContacto ?? '',
      proximaPastilla: nextDose ? {
        _id: nextDose._id,
        medicamentoId: nextDose.medicamentoId,
        nombre: nextDose.medicamento?.nombre ?? 'Medicamento',
        concentracion: nextDose.medicamento?.concentracion ?? '',
        dosis: nextDose.medicamento?.dosis ?? '',
        horaProgramada: nextDose.horaProgramada,
        estado: nextDose.estado,
      } : null,
      medicamentosHoy: tomas.length,
      tomasPendientes: tomas.filter((item) => item.estado === 'PENDIENTE').length,
      ultimaMedicion,
      alertasNoLeidas: alertas.length,
    };

    res.json({ ok: true, mensaje: 'Resumen del adulto obtenido correctamente', data });
  } catch (error) { next(error); }
}

module.exports = { getAdultSummary };
