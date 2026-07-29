import { Router } from 'express';
import { getDeviceLiveStatus, getFirebaseSyncStatus } from '../services/firebase-sync.service.js';
import { ok } from '../utils/http.js';

export const integracionRoutes = Router();

integracionRoutes.get('/firebase/estado', (_req, res) => {
  return ok(res, getFirebaseSyncStatus(), 'Estado de Firebase consultado');
});

integracionRoutes.get('/firebase/monitor/:dispositivoId', (req, res) => {
  return ok(res, getDeviceLiveStatus(req.params.dispositivoId), 'Estado en vivo del sensor');
});
