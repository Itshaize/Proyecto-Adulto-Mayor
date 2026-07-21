const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/health.routes');
const tomaRoutes = require('./routes/toma.routes');
const adultoRoutes = require('./routes/adulto.routes');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:4200').split(',').map((origin) => origin.trim());

app.disable('x-powered-by');
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

app.get('/api', (_req, res) => res.json({ ok: true, mensaje: 'API de KAIRÓS activa', data: {} }));
app.use('/api/health', healthRoutes);
// Rutas propias del módulo de Mauricio. Pueden convivir con otros routers en las mismas bases.
app.use('/api/tomas', tomaRoutes);
app.use('/api/pacientes', adultoRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
