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

const MAX_ADULTOS = 2;
const usingDatabase = () => mongoose.connection.readyState === 1;
const isAdmin = (req) => req.usuario?.rol === 'HIJO_ADMIN';

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

    const { correoAcceso, passwordAcceso, ...datosPaciente } = req.body;
    if (usingDatabase()) {
      const usuario = await Usuario.create({ nombre: datosPaciente.nombre, correo, passwordHash: await bcrypt.hash(passwordAcceso, 12), rol: 'ADULTO_MAYOR', telefono: datosPaciente.telefonoContacto, activo: true });
      try {
        const paciente = await Paciente.create({ ...datosPaciente, hijoAdminId: req.usuario.sub, usuarioAdultoId: usuario._id });
        return ok(res, await enriquecerPaciente(paciente), 'Adulto registrado y acceso creado correctamente', 201);
      } catch (error) {
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
    return ok(res, { ...paciente, correoAcceso: correo }, 'Adulto registrado y acceso creado correctamente', 201);
  } catch (error) { return handleError(res, error); }
}

export async function actualizarPaciente(req, res) {
  try {
    if (!isAdmin(req)) return fail(res, 'Sólo el administrador puede actualizar adultos', 403);
    const { correoAcceso, passwordAcceso, ...datosPaciente } = req.body;
    const correo = correoAcceso.trim().toLowerCase();
    if (usingDatabase()) {
      const pacienteActual = await Paciente.findOne({ _id: req.params.id, hijoAdminId: req.usuario.sub });
      if (!pacienteActual) return fail(res, 'Paciente no encontrado', 404);
      const duplicado = await Usuario.exists({ correo, _id: { $ne: pacienteActual.usuarioAdultoId } });
      if (duplicado) return fail(res, 'Ese correo ya está asociado a una cuenta', 409);
      const cambiosUsuario = { nombre: datosPaciente.nombre, correo, telefono: datosPaciente.telefonoContacto, activo: datosPaciente.activo };
      if (passwordAcceso) cambiosUsuario.passwordHash = await bcrypt.hash(passwordAcceso, 12);
      await Usuario.findByIdAndUpdate(pacienteActual.usuarioAdultoId, cambiosUsuario, { runValidators: true });
      const paciente = await Paciente.findByIdAndUpdate(req.params.id, datosPaciente, { new: true, runValidators: true });
      return ok(res, await enriquecerPaciente(paciente), 'Datos y acceso del adulto actualizados');
    }

    const paciente = demoStore.pacientes.find((item) => item._id === req.params.id && String(item.hijoAdminId) === String(req.usuario.sub));
    if (!paciente) return fail(res, 'Paciente no encontrado', 404);
    const usuario = demoStore.usuarios.find((item) => item._id === paciente.usuarioAdultoId);
    const duplicado = demoStore.usuarios.some((item) => item.correo === correo && item._id !== usuario?._id);
    if (duplicado) return fail(res, 'Ese correo ya está asociado a una cuenta', 409);
    Object.assign(paciente, datosPaciente);
    if (usuario) Object.assign(usuario, { nombre: datosPaciente.nombre, correo, telefono: datosPaciente.telefonoContacto, activo: datosPaciente.activo, ...(passwordAcceso ? { password: passwordAcceso } : {}) });
    return ok(res, { ...paciente, correoAcceso: correo }, 'Datos y acceso del adulto actualizados');
  } catch (error) { return handleError(res, error); }
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
        dispositivo: demoStore.dispositivo.pacienteId === pacienteId ? demoStore.dispositivo : null
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
