import { validationResult } from 'express-validator';
import { fail } from '../utils/http.js';

export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return fail(res, 'Revisa los datos ingresados', 422, errors.array());
  next();
}

