import { Router } from 'express';
import { body } from 'express-validator';
import { obtenerPaciente, crearPaciente, actualizarPaciente, obtenerResumen, obtenerResumenAdulto } from '../controllers/paciente.controller.js';
import { validate } from '../middleware/validation.js';

export const pacienteRoutes = Router();
const rules = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('edad').isInt({ min: 1 }).withMessage('La edad debe ser mayor a cero'),
  body('fechaNacimiento').isISO8601().withMessage('La fecha de nacimiento no es válida'),
  body('telefonoContacto').trim().notEmpty().withMessage('El teléfono es obligatorio'),
  body('dispositivoId').trim().notEmpty().withMessage('El dispositivo es obligatorio')
];
pacienteRoutes.get('/:id/resumen', obtenerResumen);
pacienteRoutes.get('/:id/resumen-adulto', obtenerResumenAdulto);
pacienteRoutes.get('/:id', obtenerPaciente);
pacienteRoutes.post('/', rules, validate, crearPaciente);
pacienteRoutes.put('/:id', rules, validate, actualizarPaciente);
