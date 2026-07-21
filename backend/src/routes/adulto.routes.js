const router = require('express').Router();
const { param } = require('express-validator');
const { getAdultSummary } = require('../controllers/adulto.controller');

router.get('/:id/resumen-adulto', param('id').isMongoId().withMessage('El pacienteId no es válido'), getAdultSummary);

module.exports = router;
