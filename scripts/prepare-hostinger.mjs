import { existsSync, mkdirSync, rmSync, cpSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argumentsMap = Object.fromEntries(process.argv.slice(2).map((argument) => {
  const [key, ...value] = argument.replace(/^--/, '').split('=');
  return [key, value.join('=')];
}));

const apiUrl = argumentsMap.api?.trim().replace(/\/+$/, '');
const allowHttp = Object.hasOwn(argumentsMap, 'allow-http');

if (!apiUrl) {
  console.error('Uso: npm run prepare:hostinger -- --api=https://api.ejemplo.com/api');
  process.exit(1);
}

let parsedApiUrl;
try {
  parsedApiUrl = new URL(apiUrl);
} catch {
  console.error(`La URL de API no es válida: ${apiUrl}`);
  process.exit(1);
}

if (!apiUrl.endsWith('/api')) {
  console.error('La URL debe terminar en /api, por ejemplo https://api.ejemplo.com/api');
  process.exit(1);
}

const isLocalApi = ['localhost', '127.0.0.1'].includes(parsedApiUrl.hostname);
if (parsedApiUrl.protocol !== 'https:' && !isLocalApi && !allowHttp) {
  console.error('Hostinger usa HTTPS: la API pública también debe usar HTTPS.');
  console.error('Usa --allow-http únicamente para una prueba fuera de producción.');
  process.exit(1);
}

const npmArguments = ['run', 'build', '--prefix', 'frontend', '--', '--progress=false'];
const npmCli = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
const build = process.platform === 'win32'
  ? spawnSync(process.execPath, [npmCli, ...npmArguments], { cwd: root, stdio: 'inherit' })
  : spawnSync('npm', npmArguments, { cwd: root, stdio: 'inherit' });

if (build.error) {
  console.error(`No se pudo iniciar la compilación: ${build.error.message}`);
  process.exit(1);
}
if (build.status !== 0) process.exit(build.status ?? 1);

const browserDist = path.join(root, 'frontend', 'dist', 'salud-medicacion-web', 'browser');
const artifactsRoot = path.join(root, 'artifacts');
const outputDirectory = path.join(artifactsRoot, 'hostinger-public_html');
const archivePath = path.join(artifactsRoot, 'kairos-hostinger.tar.gz');
const htaccessTemplate = path.join(root, 'deploy', 'hostinger', '.htaccess');

if (!existsSync(browserDist)) {
  console.error(`No existe el build esperado: ${browserDist}`);
  process.exit(1);
}

rmSync(outputDirectory, { recursive: true, force: true });
mkdirSync(outputDirectory, { recursive: true });
cpSync(browserDist, outputDirectory, { recursive: true });
cpSync(htaccessTemplate, path.join(outputDirectory, '.htaccess'));

writeFileSync(
  path.join(outputDirectory, 'config.js'),
  `// Generado para Hostinger. No contiene secretos.\nwindow.__KAIROS_CONFIG__ = {\n  apiUrl: ${JSON.stringify(apiUrl)}\n};\n`,
  'utf8',
);

writeFileSync(
  path.join(outputDirectory, 'DEPLOYMENT_INFO.txt'),
  `KAIROS - paquete Hostinger\nAPI: ${apiUrl}\nGenerado: ${new Date().toISOString()}\nSubir el contenido de esta carpeta a public_html.\n`,
  'utf8',
);

rmSync(archivePath, { force: true });
const archive = spawnSync(
  process.platform === 'win32' ? 'tar.exe' : 'tar',
  ['-czf', archivePath, '-C', outputDirectory, '.'],
  { cwd: root, stdio: 'inherit' },
);

console.info(`\nCarpeta lista: ${outputDirectory}`);
if (archive.status === 0) {
  console.info(`Archivo listo: ${archivePath}`);
} else {
  console.warn('No se pudo crear el .tar.gz; la carpeta de publicación sí quedó lista.');
}
console.info(`API configurada: ${apiUrl}`);
