import { Router } from 'express';
import { body } from 'express-validator';
import { listarMedicamentos, crearMedicamento, crearReceta, actualizarMedicamento, cambiarEstado, eliminarMedicamento } from '../controllers/medicamento.controller.js';
import { validate } from '../middleware/validation.js';

export const medicamentoRoutes = Router();
const rules = [
  body('pacienteId').notEmpty().withMessage('El paciente es obligatorio'),
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('concentracion').trim().notEmpty().withMessage('La concentración es obligatoria'),
  body('dosis').trim().notEmpty().withMessage('La dosis es obligatoria'),
  body('horarios').isArray({ min: 1 }).withMessage('Agrega al menos un horario'),
  body('horarios.*').matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Usa horarios HH:mm')
];
medicamentoRoutes.get('/paciente/:pacienteId', listarMedicamentos);
medicamentoRoutes.post('/receta', [
  body('medicamentos').isArray({ min: 1 }).withMessage('Agrega al menos un medicamento'),
  body('medicamentos.*.pacienteId').notEmpty().withMessage('El paciente es obligatorio'),
  body('medicamentos.*.nombre').trim().notEmpty().withMessage('Cada medicamento necesita un nombre'),
  body('medicamentos.*.concentracion').trim().notEmpty().withMessage('Cada medicamento necesita una concentración'),
  body('medicamentos.*.dosis').trim().notEmpty().withMessage('Cada medicamento necesita una dosis'),
  body('medicamentos.*.horarios').isArray({ min: 1 }).withMessage('Cada medicamento necesita un horario'),
  body('medicamentos.*.horarios.*').matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Usa horarios HH:mm'),
  body('medicamentos.*.recetaFecha').optional({ values: 'falsy' }).isISO8601().withMessage('La fecha de receta no es válida'),
  body('medicamentos.*.recetaObservacion').optional().isLength({ max: 1000 }).withMessage('La observación es demasiado extensa')
], validate, crearReceta);
medicamentoRoutes.post('/', rules, validate, crearMedicamento);
medicamentoRoutes.put('/:id', rules, validate, actualizarMedicamento);
medicamentoRoutes.patch('/:id/estado', body('activo').isBoolean(), validate, cambiarEstado);
medicamentoRoutes.delete('/:id', eliminarMedicamento);
