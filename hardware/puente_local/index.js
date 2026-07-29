import 'dotenv/config';
import { SerialPort, ReadlineParser } from 'serialport';
import { GoogleAuth } from 'google-auth-library';

const databaseURL = process.env.FIREBASE_DATABASE_URL?.trim();
const readingsPath = (process.env.FIREBASE_LECTURAS_PATH || 'lecturas').replace(/^\/+|\/+$/g, '');
const statusesPath = (process.env.FIREBASE_ESTADOS_PATH || 'estados_dispositivos').replace(/^\/+|\/+$/g, '');
const configuredPort = process.env.SERIAL_PORT?.trim();
const baudRate = Number(process.env.SERIAL_BAUD_RATE || 115200);
const reconnectDelayMs = Number(process.env.SERIAL_RECONNECT_DELAY_MS || 5000);
const heartbeatMs = Math.max(2000, Number(process.env.STATUS_HEARTBEAT_MS || 5000));
let deviceId = String(process.env.DEVICE_ID || 'ESP32-001').trim().toUpperCase();

if (!databaseURL) throw new Error('Falta FIREBASE_DATABASE_URL en .env');
if (!/^ESP32-[A-Z0-9-]{3,24}$/.test(deviceId)) throw new Error('DEVICE_ID inválido');

const auth = new GoogleAuth({
  scopes: [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/firebase.database',
  ],
});
const firebaseBaseURL = databaseURL.replace(/\/+$/, '');
const firebaseEndpoint = `${firebaseBaseURL}/${readingsPath}.json`;

let activePort = null;
let reconnectTimer = null;
let heartbeatTimer = null;
let connecting = false;
let writeQueue = Promise.resolve();
let lastDeviceStatus = { estado: 'INICIANDO', segundos: null, mensaje: 'Conectando con el ESP32' };

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

  const incomingDeviceId = String(data.dispositivoId || deviceId).trim().toUpperCase();
  const origen = String(data.origen || '').trim().toUpperCase();
  if (!/^ESP32-[A-Z0-9-]{3,24}$/.test(incomingDeviceId)) throw new Error('dispositivoId inválido');
  if (!['MAX30102', 'PULSADOR'].includes(origen)) throw new Error('origen inválido');
  deviceId = incomingDeviceId;

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
    dispositivoId: incomingDeviceId,
    origen,
    ...(validVitals ? { pulsaciones: Math.round(pulsaciones), spo2: Math.round(spo2) } : {}),
    ...(data.versionFirmware ? { versionFirmware: String(data.versionFirmware) } : {}),
    timestamp: { '.sv': 'timestamp' },
  };
}

function normalizeStatus(data) {
  if (!data || typeof data !== 'object') return null;
  const estado = String(data.estado || '').trim().toUpperCase();
  if (!['LISTO', 'ESPERANDO_DEDO', 'LEYENDO', 'RESULTADO', 'ERROR', 'INFO'].includes(estado)) return null;

  const incomingDeviceId = String(data.dispositivoId || '').trim().toUpperCase();
  if (incomingDeviceId) deviceId = incomingDeviceId;
  if (!/^ESP32-[A-Z0-9-]{3,24}$/.test(deviceId)) throw new Error('dispositivoId inválido');

  const segundos = Number(data.segundos);
  const pulsaciones = Number(data.pulsaciones);
  const spo2 = Number(data.spo2);
  const senalIR = Number(data.senalIR);
  const origen = String(data.origen || '').trim().toUpperCase();
  return {
    estado,
    ...(origen ? { origen } : {}),
    segundos: data.segundos !== undefined && Number.isFinite(segundos)
      ? Math.max(0, Math.min(8, Math.round(segundos)))
      : null,
    dedoDetectado: estado === 'LEYENDO' || (estado === 'RESULTADO' && origen === 'MAX30102'),
    ...(Number.isFinite(senalIR) ? { senalIR: Math.max(0, Math.round(senalIR)) } : {}),
    ...(Number.isFinite(pulsaciones) ? { pulsaciones: Math.round(pulsaciones) } : {}),
    ...(Number.isFinite(spo2) ? { spo2: Math.round(spo2) } : {}),
    ...(data.mensaje ? { mensaje: String(data.mensaje).slice(0, 180) } : {}),
    ...(data.versionFirmware ? { versionFirmware: String(data.versionFirmware) } : {}),
  };
}

async function firebaseRequest(url, method, payload) {
  const accessToken = await auth.getAccessToken();
  if (!accessToken) throw new Error('Google no entregó un token de acceso');
  const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}auth=${encodeURIComponent(accessToken)}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Firebase respondió ${response.status}: ${await response.text()}`);
  return response.json();
}

async function uploadDeviceStatus(status = lastDeviceStatus) {
  lastDeviceStatus = status;
  await firebaseRequest(`${firebaseBaseURL}/${statusesPath}/${encodeURIComponent(deviceId)}.json`, 'PUT', {
    dispositivoId: deviceId,
    conectado: Boolean(activePort?.isOpen),
    ...status,
    actualizadoEn: { '.sv': 'timestamp' },
  });
}

async function uploadLine(line) {
  let data;
  try {
    data = JSON.parse(line.trim());
  } catch {
    return;
  }

  const status = normalizeStatus(data);
  if (status) await uploadDeviceStatus(status);

  const payload = normalizeEvent(data);
  if (!payload) return;

  const result = await firebaseRequest(firebaseEndpoint, 'POST', payload);
  const vitals = payload.pulsaciones
    ? `, ${payload.pulsaciones} BPM, SpO₂ ${payload.spo2}%`
    : '';
  console.log(`[Firebase] ${payload.origen}${vitals} guardado en ${readingsPath}/${result.name}`);
}

function queueStatus(status) {
  writeQueue = writeQueue
    .then(() => uploadDeviceStatus(status))
    .catch((error) => console.error('[Firebase] No se pudo actualizar el estado:', error.message));
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
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      heartbeatTimer = null;
      queueStatus({ estado: 'DESCONECTADO', segundos: null, mensaje: 'Se perdió la conexión USB' });
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
      console.log(`[Firebase] Publicando estado en /${statusesPath}/${deviceId}.`);
      queueStatus({ estado: 'LISTO', segundos: null, mensaje: 'Sensor conectado; esperando el dedo' });
      heartbeatTimer = setInterval(() => queueStatus(lastDeviceStatus), heartbeatMs);
      heartbeatTimer.unref?.();
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
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  if (activePort?.isOpen) activePort.close(() => process.exit(0));
  else process.exit(0);
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

console.log('==================================================');
console.log('  PUENTE USB -> FIREBASE AUTENTICADO');
console.log('==================================================');
void startBridge();
