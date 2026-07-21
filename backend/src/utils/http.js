export const ok = (res, data, mensaje = 'Operación realizada correctamente', status = 200) =>
  res.status(status).json({ ok: true, mensaje, data });

export const fail = (res, mensaje, status = 400, errores = []) =>
  res.status(status).json({ ok: false, mensaje, errores });

export const handleError = (res, error) => {
  console.error(error);
  return fail(res, 'No fue posible completar la operación', 500, [{ msg: error.message }]);
};

