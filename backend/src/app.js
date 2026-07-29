import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { authRoutes } from './routes/auth.routes.js';
import { pacienteRoutes } from './routes/paciente.routes.js';
import { medicamentoRoutes } from './routes/medicamento.routes.js';
import { alertaRoutes } from './routes/alerta.routes.js';
import { tomaRoutes, medicionRoutes, dispositivoRoutes } from './routes/consulta.routes.js';
import { integracionRoutes } from './routes/integracion.routes.js';
import { requireAuth } from './middleware/auth.js';
import { fail, ok } from './utils/http.js';
import swaggerUi from 'swagger-ui-express';
import { openApiDocument, swaggerOptions } from './docs/openapi.js';

export const app = express();

const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:4200')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);
const allowAllOrigins = allowedOrigins.includes('*');

app.use(cors({
  origin(origin, callback) {
    // Las peticiones sin Origin (curl, Swagger, monitoreo) no son peticiones CORS.
    if (!origin || allowAllOrigins || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  }
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api/salud', (_req, res) => ok(res, { servicio: 'API Salud y Medicación', modo: process.env.MONGODB_URI ? 'mongodb' : 'demostracion' }));
app.get('/api-docs.json', (_req, res) => res.json(openApiDocument));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, swaggerOptions));
app.use('/api/auth', authRoutes);
app.use('/api/pacientes', requireAuth, pacienteRoutes);
app.use('/api/medicamentos', requireAuth, medicamentoRoutes);
app.use('/api/tomas', requireAuth, tomaRoutes);
app.use('/api/mediciones', requireAuth, medicionRoutes);
app.use('/api/alertas', requireAuth, alertaRoutes);
app.use('/api/dispositivos', requireAuth, dispositivoRoutes);
app.use('/api/integraciones', requireAuth, integracionRoutes);


const frontendDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist/salud-medicacion-web/browser');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('/', (_req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
  app.get('/*splat', (req, res, next) => req.path.startsWith('/api/') ? next() : res.sendFile(path.join(frontendDist, 'index.html')));
}
app.use((_req, res) => fail(res, 'Ruta no encontrada', 404));
