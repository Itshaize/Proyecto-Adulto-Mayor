function notFoundHandler(req, res) {
  res.status(404).json({ ok: false, mensaje: `La ruta ${req.method} ${req.originalUrl} no existe`, errores: [] });
}

function errorHandler(error, _req, res, _next) {
  console.error(error);
  if (error?.name === 'CastError') return res.status(400).json({ ok: false, mensaje: 'El identificador enviado no es válido', errores: [] });
  if (error?.code === 11000) return res.status(409).json({ ok: false, mensaje: 'La toma programada ya existe', errores: [] });
  if (error?.name === 'ValidationError') return res.status(400).json({ ok: false, mensaje: 'Los datos no cumplen las validaciones', errores: Object.values(error.errors).map((item) => item.message) });
  res.status(error.status ?? 500).json({ ok: false, mensaje: error.message ?? 'Error interno del servidor', errores: error.errors ?? [] });
}

module.exports = { notFoundHandler, errorHandler };
