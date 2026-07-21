const mongoose = require('mongoose');

const stateNames = { 0: 'DESCONECTADO', 1: 'CONECTADO', 2: 'CONECTANDO', 3: 'DESCONECTANDO' };

function getHealth(_req, res) {
  const databaseState = stateNames[mongoose.connection.readyState] ?? 'DESCONOCIDO';
  const connected = mongoose.connection.readyState === 1;
  return res.status(connected ? 200 : 503).json({
    ok: connected,
    mensaje: connected ? 'API y MongoDB funcionando correctamente' : 'API activa, pero MongoDB no está conectado',
    data: { api: 'CONECTADA', mongodb: databaseState, entorno: process.env.NODE_ENV ?? 'development' },
  });
}

module.exports = { getHealth };
