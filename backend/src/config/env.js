const requiredVariables = ['MONGODB_URI', 'JWT_SECRET'];

function validateEnvironment() {
  const missing = requiredVariables.filter((name) => !process.env[name]?.trim());
  if (missing.length) throw new Error(`Faltan variables de entorno obligatorias: ${missing.join(', ')}`);
  if (process.env.MONGODB_URI.includes('USUARIO:CONTRASENA')) {
    throw new Error('Debes reemplazar USUARIO y CONTRASENA en backend/.env con tus credenciales de MongoDB.');
  }
}

module.exports = { validateEnvironment };
