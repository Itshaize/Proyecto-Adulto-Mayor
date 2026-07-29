import 'dotenv/config';
import { SerialPort, ReadlineParser } from 'serialport';
import { GoogleAuth } from 'google-auth-library';

const databaseURL = process.env.FIREBASE_DATABASE_URL?.trim();
const readingsPath = (process.env.FIREBASE_LECTURAS_PATH || 'lecturas').replace(/^\/+|\/+$/g, '');
const configuredPort = process.env.SERIAL_PORT?.trim();
const baudRate = Number(process.env.SERIAL_BAUD_RATE || 115200);
const reconnectDelayMs = Number(process.env.SERIAL_RECONNECT_DELAY_MS || 5000);

if (!databaseURL) throw new Error('Falta FIREBASE_DATABASE_URL en .env');

const auth = new GoogleAuth({
  scopes: [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/firebase.database',
  ],
});
const firebaseEndpoint = `${databaseURL.replace(/\/+$/, '')}/${readingsPath}.json`;

let activePort = null;
let reconnectTimer = null;
let connecting = false;
let writeQueue = Promise.resolve();

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void startBridge();
  }, reconnectDelayMs);
}

function isEsp32Port(port) {
  const manufacturer = String(port.manufacturer || '').toLowerCase();
  const vendorId = String(port.vendorId || '').toLowerCase();
  return manufacturer.includes('wch')
    || manufacturer.includes('arduino')
    || manufacturer.includes('silicon labs')
    || manufacturer.includes('espressif')
    || ['1a86', '10c4', '303a'].includes(vendorId);
}

function normalizeEvent(data) {
  if (!data || data.estado !== 'RESULTADO') return null;

  const dispositivoId = String(data.dispositivoId || '').trim().toUpperCase();
  const origen = String(data.origen || '').trim().toUpperCase();
  if (!/^ESP32-[A-Z0-9-]{3,24}$/.test(dispositivoId)) throw new Error('dispositivoId inválido');
  if (!['MAX30102', 'PULSADOR'].includes(origen)) throw new Error('origen inválido');

  const pulsaciones = Number(data.pulsaciones);
  const spo2 = Number(data.spo2);
  const validVitals = Number.isFinite(pulsaciones)
    && pulsaciones >= 25
    && pulsaciones <= 240
    && Number.isFinite(spo2)
    && spo2 >= 50
    && spo2 <= 100;

  if (origen === 'MAX30102' && !validVitals) throw new Error('lectura MAX30102 fuera de rango');

  return {
    dispositivoId,
    origen,
    ...(validVitals ? { pulsaciones: Math.round(pulsaciones), spo2: Math.round(spo2) } : {}),
    ...(data.versionFirmware ? { versionFirmware: String(data.versionFirmware) } : {}),
    timestamp: { '.sv': 'timestamp' },
  };
}

async function uploadLine(line) {
  let data;
  try {
    data = JSON.parse(line.trim());
  } catch {
    return;
  }

  const payload = normalizeEvent(data);
  if (!payload) return;

  const accessToken = await auth.getAccessToken();
  if (!accessToken) throw new Error('Google no entregó un token de acceso');
  const response = await fetch(`${firebaseEndpoint}?auth=${encodeURIComponent(accessToken)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Firebase respondió ${response.status}: ${await response.text()}`);
  const result = await response.json();
  const vitals = payload.pulsaciones
    ? `, ${payload.pulsaciones} BPM, SpO₂ ${payload.spo2}%`
    : '';
  console.log(`[Firebase] ${payload.origen}${vitals} guardado en ${readingsPath}/${result.name}`);
}

async function startBridge() {
  if (connecting || activePort?.isOpen) return;
  connecting = true;

  try {
    const ports = await SerialPort.list();
    const selected = configuredPort
      ? ports.find((port) => port.path.toLowerCase() === configuredPort.toLowerCase())
      : ports.find(isEsp32Port);

    if (!selected) {
      console.log(configuredPort
        ? `[Puente] No se encontró ${configuredPort}; reintentando...`
        : '[Puente] No se detectó un ESP32 compatible; reintentando...');
      scheduleReconnect();
      return;
    }

    const port = new SerialPort({ path: selected.path, baudRate, autoOpen: false });
    activePort = port;
    const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

    parser.on('data', (line) => {
      writeQueue = writeQueue
        .then(() => uploadLine(line))
        .catch((error) => console.error('[Firebase] No se pudo guardar el evento:', error.message));
    });

    const reconnect = (message) => {
      if (activePort === port) activePort = null;
      console.warn(message);
      scheduleReconnect();
    };

    port.once('close', () => reconnect('[Puente] Puerto cerrado; reintentando...'));
    port.on('error', (error) => {
      console.error('[Puente] Error serial:', error.message);
      if (port.isOpen) port.close();
      else reconnect('[Puente] No se pudo abrir el puerto; reintentando...');
    });

    port.open((error) => {
      if (error) {
        reconnect(`[Puente] No se pudo abrir ${selected.path}: ${error.message}`);
        return;
      }
      console.log(`[Puente] ESP32 conectado en ${selected.path} a ${baudRate} baudios.`);
      console.log(`[Firebase] Enviando eventos autenticados a /${readingsPath}.`);
    });
  } catch (error) {
    console.error('[Puente] Error buscando el ESP32:', error.message);
    scheduleReconnect();
  } finally {
    connecting = false;
  }
}

function shutdown() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (activePort?.isOpen) activePort.close(() => process.exit(0));
  else process.exit(0);
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

console.log('==================================================');
console.log('  PUENTE USB -> FIREBASE AUTENTICADO');
console.log('==================================================');
void startBridge();
