import { Router } from 'express';
import { listarTomas, tomasHoy, confirmarToma, resumenTomas, listarMediciones, ultimaMedicion, resumenMediciones, estadoDispositivo } from '../controllers/consulta.controller.js';

export const tomaRoutes = Router();
tomaRoutes.get('/paciente/:pacienteId/hoy', tomasHoy);
tomaRoutes.get('/paciente/:pacienteId/resumen', resumenTomas);
tomaRoutes.get('/paciente/:pacienteId', listarTomas);
tomaRoutes.patch('/:id/confirmar', confirmarToma);

export const medicionRoutes = Router();
medicionRoutes.get('/paciente/:pacienteId/ultima', ultimaMedicion);
medicionRoutes.get('/paciente/:pacienteId/resumen', resumenMediciones);
medicionRoutes.get('/paciente/:pacienteId', listarMediciones);

export const dispositivoRoutes = Router();
dispositivoRoutes.get('/:dispositivoId/estado', estadoDispositivo);
