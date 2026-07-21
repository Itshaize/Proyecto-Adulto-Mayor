const router = require('express').Router();
const { param, query, body } = require('express-validator');
const { getToday, getHistory, confirm } = require('../controllers/toma.controller');

const patientIdValidation = param('pacienteId').isMongoId().withMessage('pacienteId no es válido');

router.get('/paciente/:pacienteId/hoy', patientIdValidation, getToday);
router.get('/paciente/:pacienteId', [
  patientIdValidation,
  query('dias').optional().isInt({ min: 1, max: 90 }).withMessage('dias debe estar entre 1 y 90'),
], getHistory);
router.patch('/:id/confirmar', [
  param('id').isMongoId().withMessage('El identificador de la toma no es válido'),
  body('metodoConfirmacion').optional().isIn(['PULSADOR', 'APP', 'ADMIN']).withMessage('Método de confirmación no válido'),
  body('observacion').optional().isString().isLength({ max: 500 }),
], confirm);

module.exports = router;
