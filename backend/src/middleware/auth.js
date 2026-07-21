import jwt from 'jsonwebtoken';
import { fail } from '../utils/http.js';

export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET || 'demo-secret');
  } catch {
    return fail(res, 'Sesión inválida o expirada', 401);
  }
  next();
}
