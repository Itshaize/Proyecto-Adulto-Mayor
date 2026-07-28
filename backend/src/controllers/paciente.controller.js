import bcrypt from 'bcrypt';
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
import { buildExcelReport, buildPdfReport, getReportData, reportFilename, validateReportQuery } from '../services/reporte.service.js';

const MAX_ADULTOS = 2;
const usingDatabase = () => mongoose.connection.readyState === 1;
const isAdmin = (req) => req.usuario?.rol === 'HIJO_ADMIN';
const normalizeDeviceId = (value) => String(value || '').trim().toUpperCase();

async function dispositivoOcupado(dispositivoId, pacienteId = null) {
  if (usingDatabase()) {
    return Boolean(await Dispositivo.exists({ dispositivoId, ...(pacienteId ? { pacienteId: { $ne: pacienteId } } : {}) })
      || await Paciente.exists({ dispositivoId, ...(pacienteId ? { _id: { $ne: pacienteId } } : {}) }));
  }
  return demoStore.pacientes.some((item) => item.dispositivoId === dispositivoId && (!pacienteId || item._id !== pacienteId));
}

async function enriquecerPaciente(paciente) {
  if (!paciente) return null;
  const plain = typeof paciente.toObject === 'function' ? paciente.toObject() : { ...paciente };
  const usuario = usingDatabase()
    ? await Usuario.findById(plain.usuarioAdultoId).select('correo').lean()
    : demoStore.usuarios.find((item) => String(item._id) === String(plain.usuarioAdultoId));
  return { ...plain, correoAcceso: usuario?.correo ?? '' };
}

export async function listarPacientes(req, res) {
  try {
    if (!isAdmin(req)) return fail(res, 'Sólo el administrador puede consultar sus adultos registrados', 403);
    const pacientes = usingDatabase()
      ? await Paciente.find({ hijoAdminId: req.usuario.sub }).sort({ createdAt: 1 }).lean()
      : demoStore.pacientes.filter((item) => String(item.hijoAdminId) === String(req.usuario.sub));
    return ok(res, await Promise.all(pacientes.map(enriquecerPaciente)));
  } catch (error) { return handleError(res, error); }
}

export async function obtenerPaciente(req, res) {
  try {
    const paciente = usingDatabase()
      ? await Paciente.findById(req.params.id).lean()
      : demoStore.pacientes.find((item) => item._id === req.params.id);
    if (!paciente) return fail(res, 'Paciente no encontrado', 404);
    return ok(res, await enriquecerPaciente(paciente));
  } catch (error) { return handleError(res, error); }
}

export async function exportarHistorial(req, res) {
  try {
    if (!isAdmin(req)) return fail(res, 'Sólo el administrador puede exportar el historial', 403);
    const filtros = validateReportQuery(req.query);
    if (filtros.error) return fail(res, filtros.error, 422);
    const data = await getReportData({ pacienteId: req.params.id, adminId: req.usuario.sub, ...filtros });
    if (!data) return fail(res, 'Paciente no encontrado o no autorizado', 404);

    const isExcel = filtros.formato === 'xlsx';
    const file = isExcel ? await buildExcelReport(data) : await buildPdfReport(data);
    const filename = reportFilename(data.paciente.nombre, filtros.formato);
    res.setHeader('Content-Type', isExcel ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', file.length);
    return res.status(200).send(file);
  } catch (error) { return handleError(res, error); }
}

export async function crearPaciente(req, res) {
  try {
    if (!isAdmin(req)) return fail(res, 'Sólo el administrador puede registrar adultos', 403);
    const correo = req.body.correoAcceso.trim().toLowerCase();
    const existentes = usingDatabase()
      ? await Paciente.countDocuments({ hijoAdminId: req.usuario.sub })
      : demoStore.pacientes.filter((item) => String(item.hijoAdminId) === String(req.usuario.sub)).length;
    if (existentes >= MAX_ADULTOS) return fail(res, 'Puedes registrar un máximo de 2 adultos mayores', 409);

    const correoExiste = usingDatabase()
      ? await Usuario.exists({ correo })
      : demoStore.usuarios.some((item) => item.correo === correo);
    if (correoExiste) return fail(res, 'Ese correo ya está asociado a una cuenta', 409);

    const { correoAcceso, passwordAcceso, ...datosRecibidos } = req.body;
    const datosPaciente = { ...datosRecibidos, dispositivoId: normalizeDeviceId(datosRecibidos.dispositivoId) };
    if (await dispositivoOcupado(datosPaciente.dispositivoId)) return fail(res, 'Ese dispositivo ya está vinculado a otro adulto', 409);
    if (usingDatabase()) {
      const usuario = await Usuario.create({ nombre: datosPaciente.nombre, correo, passwordHash: await bcrypt.hash(passwordAcceso, 12), rol: 'ADULTO_MAYOR', telefono: datosPaciente.telefonoContacto, activo: true });
      let paciente;
      try {
        paciente = await Paciente.create({ ...datosPaciente, hijoAdminId: req.usuario.sub, usuarioAdultoId: usuario._id });
        await Dispositivo.create({ dispositivoId: datosPaciente.dispositivoId, pacienteId: paciente._id, estado: 'DESCONECTADO' });
        return ok(res, await enriquecerPaciente(paciente), 'Adulto registrado y acceso creado correctamente', 201);
      } catch (error) {
        if (paciente) await Paciente.findByIdAndDelete(paciente._id);
        await Usuario.findByIdAndDelete(usuario._id);
        throw error;
      }
    }

    const usuarioId = new mongoose.Types.ObjectId().toString();
    const pacienteId = new mongoose.Types.ObjectId().toString();
    const usuario = { _id: usuarioId, nombre: datosPaciente.nombre, correo, password: passwordAcceso, rol: 'ADULTO_MAYOR', telefono: datosPaciente.telefonoContacto, pacienteId, activo: true };
    const paciente = { ...datosPaciente, _id: pacienteId, hijoAdminId: req.usuario.sub, usuarioAdultoId: usuarioId };
    demoStore.usuarios.push(usuario);
    demoStore.pacientes.push(paciente);
    demoStore.dispositivos.push({ _id: new mongoose.Types.ObjectId().toString(), dispositivoId: datosPaciente.dispositivoId, pacienteId, estado: 'DESCONECTADO', ultimaConexion: null, versionFirmware: 'Pendiente' });
    return ok(res, { ...paciente, correoAcceso: correo }, 'Adulto registrado y acceso creado correctamente', 201);
  } catch (error) {
    if (error?.code === 11000) return fail(res, 'Ese correo o dispositivo ya está vinculado', 409);
    return handleError(res, error);
  }
}

export async function actualizarPaciente(req, res) {
  try {
    if (!isAdmin(req)) return fail(res, 'Sólo el administrador puede actualizar adultos', 403);
    const { correoAcceso, passwordAcceso, ...datosRecibidos } = req.body;
    const datosPaciente = { ...datosRecibidos, dispositivoId: normalizeDeviceId(datosRecibidos.dispositivoId) };
    const correo = correoAcceso.trim().toLowerCase();
    if (usingDatabase()) {
      const pacienteActual = await Paciente.findOne({ _id: req.params.id, hijoAdminId: req.usuario.sub });
      if (!pacienteActual) return fail(res, 'Paciente no encontrado', 404);
      if (await dispositivoOcupado(datosPaciente.dispositivoId, pacienteActual._id)) return fail(res, 'Ese dispositivo ya está vinculado a otro adulto', 409);
      const duplicado = await Usuario.exists({ correo, _id: { $ne: pacienteActual.usuarioAdultoId } });
      if (duplicado) return fail(res, 'Ese correo ya está asociado a una cuenta', 409);
      const cambiosUsuario = { nombre: datosPaciente.nombre, correo, telefono: datosPaciente.telefonoContacto, activo: datosPaciente.activo };
      if (passwordAcceso) cambiosUsuario.passwordHash = await bcrypt.hash(passwordAcceso, 12);
      await Usuario.findByIdAndUpdate(pacienteActual.usuarioAdultoId, cambiosUsuario, { runValidators: true });
      await Dispositivo.findOneAndUpdate(
        { pacienteId: pacienteActual._id },
        { dispositivoId: datosPaciente.dispositivoId, pacienteId: pacienteActual._id, ...(pacienteActual.dispositivoId !== datosPaciente.dispositivoId ? { estado: 'DESCONECTADO', ultimaConexion: null, versionFirmware: 'Pendiente' } : {}) },
        { upsert: true, new: true, runValidators: true },
      );
      const paciente = await Paciente.findByIdAndUpdate(req.params.id, datosPaciente, { new: true, runValidators: true });
      return ok(res, await enriquecerPaciente(paciente), 'Datos y acceso del adulto actualizados');
    }

    const paciente = demoStore.pacientes.find((item) => item._id === req.params.id && String(item.hijoAdminId) === String(req.usuario.sub));
    if (!paciente) return fail(res, 'Paciente no encontrado', 404);
    if (await dispositivoOcupado(datosPaciente.dispositivoId, paciente._id)) return fail(res, 'Ese dispositivo ya está vinculado a otro adulto', 409);
    const usuario = demoStore.usuarios.find((item) => item._id === paciente.usuarioAdultoId);
    const duplicado = demoStore.usuarios.some((item) => item.correo === correo && item._id !== usuario?._id);
    if (duplicado) return fail(res, 'Ese correo ya está asociado a una cuenta', 409);
    const dispositivoAnterior = paciente.dispositivoId;
    Object.assign(paciente, datosPaciente);
    const dispositivo = demoStore.dispositivos.find((item) => item.pacienteId === paciente._id);
    if (dispositivo) Object.assign(dispositivo, { dispositivoId: datosPaciente.dispositivoId, ...(dispositivoAnterior !== datosPaciente.dispositivoId ? { estado: 'DESCONECTADO', ultimaConexion: null, versionFirmware: 'Pendiente' } : {}) });
    if (usuario) Object.assign(usuario, { nombre: datosPaciente.nombre, correo, telefono: datosPaciente.telefonoContacto, activo: datosPaciente.activo, ...(passwordAcceso ? { password: passwordAcceso } : {}) });
    return ok(res, { ...paciente, correoAcceso: correo }, 'Datos y acceso del adulto actualizados');
  } catch (error) {
    if (error?.code === 11000) return fail(res, 'Ese correo o dispositivo ya está vinculado', 409);
    return handleError(res, error);
  }
}

export async function obtenerResumen(req, res) {
  try {
    const pacienteId = req.params.id;
    if (!usingDatabase()) {
      const paciente = demoStore.pacientes.find((item) => item._id === pacienteId);
      if (!paciente) return fail(res, 'Paciente no encontrado', 404);
      const ultimaMedicion = demoStore.mediciones.filter((item) => item.pacienteId === pacienteId).at(-1) ?? null;
      const tomasHoy = demoStore.tomas.filter((t) => t.pacienteId === pacienteId && t.fechaProgramada === dateInTimeZone());
      return ok(res, {
        paciente, ultimaMedicion, medicamentosHoy: tomasHoy,
        tomasResumen: { tomadas: tomasHoy.filter((t) => t.estado === 'TOMADA').length, pendientes: tomasHoy.filter((t) => t.estado === 'PENDIENTE').length, total: tomasHoy.length },
        mediciones: demoStore.mediciones.filter((item) => item.pacienteId === pacienteId),
        alertas: demoStore.alertas.filter((item) => item.pacienteId === pacienteId).sort((a, b) => ({ CRITICA: 3, ADVERTENCIA: 2, INFORMATIVA: 1 }[b.nivel] - { CRITICA: 3, ADVERTENCIA: 2, INFORMATIVA: 1 }[a.nivel]) || new Date(b.fechaHora) - new Date(a.fechaHora)),
        dispositivo: demoStore.dispositivos.find((item) => item.pacienteId === pacienteId) ?? null
      });
    }

    const hoy = dateInTimeZone();
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
    return ok(res, { paciente, ultimaMedicion, medicamentosHoy, tomasResumen: { tomadas: tomasHoy.filter((t) => t.estado === 'TOMADA').length, pendientes: tomasHoy.filter((t) => t.estado === 'PENDIENTE').length, total: tomasHoy.length }, mediciones: mediciones.reverse(), alertas, dispositivo });
  } catch (error) { return handleError(res, error); }
}

export async function obtenerResumenAdulto(req, res) {
  try {
    const pacienteId = req.params.id;
    if (!usingDatabase()) {
      const paciente = demoStore.pacientes.find((item) => item._id === pacienteId && item.activo);
      if (!paciente) return fail(res, 'Paciente no encontrado', 404);
      const hijo = demoStore.usuarios.find((item) => String(item._id) === String(paciente.hijoAdminId));
      const tomas = demoStore.tomas.filter((toma) => toma.pacienteId === pacienteId && toma.fechaProgramada === dateInTimeZone());
      const ultimaMedicion = demoStore.mediciones.filter((item) => item.pacienteId === pacienteId).sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora))[0] ?? null;
      const alertas = demoStore.alertas.filter((item) => item.pacienteId === pacienteId && !item.leida);
      const estadoGeneral = alertas.some((item) => item.nivel === 'CRITICA') ? 'ALERTA' : (ultimaMedicion?.estadoSalud ?? 'REVISAR');
      return ok(res, { paciente: { _id: paciente._id, nombre: paciente.nombre, edad: paciente.edad }, saludo: `Hola, ${paciente.nombre.split(' ')[0]}`, estadoGeneral, nombreHijo: hijo?.nombre ?? 'Su familiar', telefonoHijo: hijo?.telefono ?? paciente.telefonoContacto, medicamentosHoy: tomas.length, tomasPendientes: tomas.filter((item) => item.estado === 'PENDIENTE').length, ultimaMedicion, alertasNoLeidas: alertas.length });
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
    return ok(res, { paciente: { _id: paciente._id, nombre: paciente.nombre, edad: paciente.edad }, saludo: `Hola, ${paciente.nombre.split(' ')[0]}`, estadoGeneral, nombreHijo: hijo?.nombre ?? 'Su familiar', telefonoHijo: hijo?.telefono ?? paciente.telefonoContacto, medicamentosHoy: tomas.length, tomasPendientes: tomas.filter((item) => item.estado === 'PENDIENTE').length, ultimaMedicion, alertasNoLeidas: alertas.length });
  } catch (error) { return handleError(res, error); }
}
