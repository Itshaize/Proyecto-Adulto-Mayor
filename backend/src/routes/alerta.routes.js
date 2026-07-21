import { Router } from 'express';
import { listarAlertas, marcarLeida } from '../controllers/alerta.controller.js';

export const alertaRoutes = Router();
alertaRoutes.get('/paciente/:pacienteId', listarAlertas);
alertaRoutes.patch('/:id/leida', marcarLeida);

