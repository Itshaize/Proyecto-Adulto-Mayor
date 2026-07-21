import { Router } from 'express';
import { body } from 'express-validator';
import { login } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validation.js';

export const authRoutes = Router();
authRoutes.post('/login', [body('correo').isEmail().withMessage('Ingresa un correo válido'), body('password').notEmpty().withMessage('La contraseña es obligatoria')], validate, login);

