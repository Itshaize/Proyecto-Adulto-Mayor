import { Router } from 'express';
import { getFirebaseSyncStatus } from '../services/firebase-sync.service.js';
import { ok } from '../utils/http.js';

export const integracionRoutes = Router();

integracionRoutes.get('/firebase/estado', (_req, res) => {
  return ok(res, getFirebaseSyncStatus(), 'Estado de Firebase consultado');
});
