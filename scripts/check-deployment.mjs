const options = Object.fromEntries(process.argv.slice(2).map((argument) => {
  const [key, ...value] = argument.replace(/^--/, '').split('=');
  return [key, value.join('=')];
}));

const apiUrl = options.api?.replace(/\/+$/, '');
const origin = options.origin?.replace(/\/+$/, '');

if (!apiUrl || !origin) {
  console.error('Uso: npm run check:deployment -- --api=http://HOST_AWS/api --origin=http://HOST_VM');
  process.exit(1);
}

const healthUrl = `${apiUrl}/salud`;
console.info(`[1/2] Consultando ${healthUrl}`);

try {
  const healthResponse = await fetch(healthUrl, { headers: { Origin: origin } });
  const body = await healthResponse.json().catch(() => null);
  if (!healthResponse.ok || body?.ok !== true) {
    throw new Error(`salud respondio HTTP ${healthResponse.status}: ${JSON.stringify(body)}`);
  }
  console.info(`      API activa; modo: ${body.data?.modo || 'desconocido'}`);

  console.info(`[2/2] Verificando CORS para ${origin}`);
  const preflight = await fetch(`${apiUrl}/auth/login`, {
    method: 'OPTIONS',
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type'
    }
  });
  const allowedOrigin = preflight.headers.get('access-control-allow-origin');
  if (!preflight.ok || allowedOrigin !== origin) {
    throw new Error(`CORS no autorizo el origen. Recibido: ${allowedOrigin || 'sin cabecera'}`);
  }

  console.info('      CORS correcto');
  console.info('\nDESPLIEGUE LISTO: la VM puede comunicarse con AWS.');
} catch (error) {
  console.error(`\nFALLO: ${error.message}`);
  console.error('Revisa PUBLIC_API_URL, FRONTEND_URLS, Nginx y el Security Group de EC2.');
  process.exit(1);
}
