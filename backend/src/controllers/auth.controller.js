import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Usuario } from '../models/Usuario.js';
import { Paciente } from '../models/Paciente.js';
import { ok, fail, handleError } from '../utils/http.js';

export async function login(req, res) {
  try {
    const { correo, password } = req.body;
    let usuario;
    let validPassword;
    if (mongoose.connection.readyState === 1) {
      usuario = await Usuario.findOne({ correo, activo: true }).lean();
      validPassword = usuario && await bcrypt.compare(password, usuario.passwordHash);
    } else {
      usuario = correo === 'daniel@salud.ec'
        ? { _id: '66a000000000000000000010', nombre: 'Daniel Pérez', correo, rol: 'HIJO_ADMIN' }
        : correo === 'carlos@salud.ec'
          ? { _id: '66a000000000000000000011', nombre: 'Carlos Pérez', correo, rol: 'ADULTO_MAYOR', pacienteId: '66a000000000000000000001' }
          : null;
      validPassword = password === 'Admin123';
    }
    if (!usuario || !validPassword) return fail(res, 'Correo o contraseña incorrectos', 401);
    let pacienteId = usuario.pacienteId;
    if (usingDatabaseForAdult(usuario) && !pacienteId) {
      const paciente = await Paciente.findOne({ usuarioAdultoId: usuario._id, activo: true }).select('_id').lean();
      pacienteId = paciente?._id?.toString();
    }
    const token = jwt.sign({ sub: usuario._id, rol: usuario.rol, pacienteId }, process.env.JWT_SECRET || 'demo-secret', { expiresIn: '8h' });
    return ok(res, { token, usuario: { _id: usuario._id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol, ...(pacienteId ? { pacienteId } : {}) } }, 'Sesión iniciada');
  } catch (error) { return handleError(res, error); }
}

function usingDatabaseForAdult(usuario) {
  return mongoose.connection.readyState === 1 && usuario.rol === 'ADULTO_MAYOR';
}
