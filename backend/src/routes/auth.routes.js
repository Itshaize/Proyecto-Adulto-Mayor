import { Router } from 'express';
import { body } from 'express-validator';
import { login, registerAdmin } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validation.js';

export const authRoutes = Router();
authRoutes.post('/register', [
  body('nombre').trim().isLength({ min: 3, max: 80 }).withMessage('El nombre debe tener entre 3 y 80 caracteres'),
  body('correo').trim().isEmail().withMessage('Ingresa un correo válido'),
  body('telefono').trim().isLength({ min: 7, max: 20 }).withMessage('Ingresa un teléfono válido'),
  body('password').isLength({ min: 8, max: 72 }).withMessage('La contraseña debe tener entre 8 y 72 caracteres')
    .matches(/[a-z]/).withMessage('La contraseña necesita una minúscula')
    .matches(/[A-Z]/).withMessage('La contraseña necesita una mayúscula')
    .matches(/\d/).withMessage('La contraseña necesita un número'),
], validate, registerAdmin);
authRoutes.post('/login', [body('correo').isEmail().withMessage('Ingresa un correo válido'), body('password').notEmpty().withMessage('La contraseña es obligatoria')], validate, login);
