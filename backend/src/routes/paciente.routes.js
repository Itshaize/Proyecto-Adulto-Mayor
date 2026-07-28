import { Router } from 'express';
import { body } from 'express-validator';
import { listarPacientes, obtenerPaciente, crearPaciente, actualizarPaciente, obtenerResumen, obtenerResumenAdulto, exportarHistorial } from '../controllers/paciente.controller.js';
import { validate } from '../middleware/validation.js';

export const pacienteRoutes = Router();
const rules = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('edad').isInt({ min: 1 }).withMessage('La edad debe ser mayor a cero'),
  body('fechaNacimiento').isISO8601().withMessage('La fecha de nacimiento no es válida'),
  body('telefonoContacto').trim().notEmpty().withMessage('El teléfono es obligatorio'),
  body('dispositivoId').trim().toUpperCase().matches(/^ESP32-[A-Z0-9-]{3,24}$/).withMessage('Usa el código impreso en el equipo, por ejemplo ESP32-001')
];
const accessRules = [
  body('correoAcceso').trim().isEmail().withMessage('Ingresa un correo de acceso válido'),
  body('passwordAcceso').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
];
pacienteRoutes.get('/', listarPacientes);
pacienteRoutes.get('/:id/resumen', obtenerResumen);
pacienteRoutes.get('/:id/resumen-adulto', obtenerResumenAdulto);
pacienteRoutes.get('/:id/exportar', exportarHistorial);
pacienteRoutes.get('/:id', obtenerPaciente);
pacienteRoutes.post('/', [...rules, ...accessRules], validate, crearPaciente);
pacienteRoutes.put('/:id', [...rules, body('correoAcceso').trim().isEmail().withMessage('Ingresa un correo de acceso válido'), body('passwordAcceso').optional({ values: 'falsy' }).isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres')], validate, actualizarPaciente);
