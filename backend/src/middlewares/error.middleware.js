function notFoundHandler(req, res) {
  res.status(404).json({ ok: false, mensaje: `La ruta ${req.method} ${req.originalUrl} no existe`, errores: [] });
}

function errorHandler(error, _req, res, _next) {
  console.error(error);
  res.status(error.status ?? 500).json({ ok: false, mensaje: error.message ?? 'Error interno del servidor', errores: error.errors ?? [] });
}

module.exports = { notFoundHandler, errorHandler };
