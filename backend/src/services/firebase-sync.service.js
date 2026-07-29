import { Dispositivo } from '../models/Dispositivo.js';
import { Medicion } from '../models/Medicion.js';
import { Alerta } from '../models/Alerta.js';
import { getFirebaseClient, getFirebaseConfigStatus } from '../config/firebase.js';

const firebaseState = {
  active: false,
  path: process.env.FIREBASE_LECTURAS_PATH?.trim() || 'lecturas',
  lastSyncAt: null,
  lastError: null,
  processed: 0,
  ignored: 0,
  alertsCreated: 0,
  intervalMs: Number(process.env.FIREBASE_SYNC_INTERVAL_MS || 2000),
  statusesPath: process.env.FIREBASE_ESTADOS_PATH?.trim() || 'estados_dispositivos',
};

let syncTimer = null;
let syncInProgress = false;
const seenEvents = new Set();
const deviceStatuses = new Map();

function rememberEvent(eventId) {
  seenEvents.add(eventId);
  while (seenEvents.size > 500) {
    const oldest = seenEvents.values().next().value;
    seenEvents.delete(oldest);
  }
}

const firstNumber = (...values) => {
  for (const value of values) {
    if (value !== '' && value !== null && value !== undefined && Number.isFinite(Number(value))) return Number(value);
  }
  return Number.NaN;
};

function parseTimestamp(value) {
  if (value === undefined || value === null || value === '') return new Date();
  const numeric = Number(value);
  const date = Number.isFinite(numeric)
    ? new Date(numeric < 10_000_000_000 ? numeric * 1000 : numeric)
    : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('timestamp no válido');
  return date;
}

export function classifyHealth(pulsaciones, spo2) {
  if (spo2 < 90 || pulsaciones < 40 || pulsaciones > 130) return 'ALERTA';
  if (spo2 < 95 || pulsaciones < 50 || pulsaciones > 100) return 'REVISAR';
  return 'NORMAL';
}

export function normalizeFirebaseReading(payload, eventId = '') {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('lectura vacía o inválida');

  const dispositivoId = String(payload.dispositivoId ?? payload.deviceId ?? payload.dispositivo ?? '').trim();
  const pulsaciones = firstNumber(payload.pulsaciones, payload.bpm, payload.heartRate, payload.ritmoCardiaco);
  const spo2 = firstNumber(payload.spo2, payload.SpO2, payload.oxigeno);
  const rawOrigin = String(payload.origen ?? payload.tipoEvento ?? payload.evento ?? 'MAX30102').trim().toUpperCase();
  const origen = rawOrigin === 'PULSADOR' ? 'PULSADOR' : 'MAX30102';
  const versionFirmware = String(payload.versionFirmware ?? '').trim();
  const vitalsAreValid = Number.isFinite(pulsaciones)
    && pulsaciones >= 25
    && pulsaciones <= 240
    && Number.isFinite(spo2)
    && spo2 >= 50
    && spo2 <= 100;

  if (!dispositivoId) throw new Error('dispositivoId es obligatorio');
  if (origen === 'MAX30102') {
    if (!Number.isFinite(pulsaciones) || pulsaciones < 25 || pulsaciones > 240) throw new Error('pulsaciones fuera del rango permitido (25-240)');
    if (!Number.isFinite(spo2) || spo2 < 50 || spo2 > 100) throw new Error('SpO2 fuera del rango permitido (50-100)');
  }

  return {
    dispositivoId,
    pulsaciones: vitalsAreValid ? Math.round(pulsaciones) : null,
    spo2: vitalsAreValid ? Math.round(spo2) : null,
    origen,
    ...(versionFirmware ? { versionFirmware } : {}),
    estadoSalud: vitalsAreValid ? classifyHealth(pulsaciones, spo2) : null,
    fechaHora: parseTimestamp(payload.timestamp ?? payload.fechaHora ?? payload.createdAt),
    firebaseEventId: eventId || undefined,
  };
}

export function buildButtonAlert(reading, pacienteId) {
  if (reading.origen !== 'PULSADOR') return null;
  const readingDetail = reading.pulsaciones !== null && reading.spo2 !== null
    ? ` Última lectura: ${reading.pulsaciones} BPM y SpO₂ ${reading.spo2}%.`
    : ' No había una medición válida disponible al presionar el botón.';
  return {
    pacienteId,
    firebaseEventId: reading.firebaseEventId,
    tipo: 'PULSADOR_EMERGENCIA',
    titulo: 'Botón de ayuda activado',
    mensaje: `El adulto mayor presionó el pulsador.${readingDetail}`,
    nivel: 'CRITICA',
    leida: false,
    fechaHora: reading.fechaHora,
  };
}

export async function persistFirebaseReading(payload, eventId) {
  const reading = normalizeFirebaseReading(payload, eventId);
  const device = await Dispositivo.findOne({ dispositivoId: reading.dispositivoId }).lean();
  if (!device) throw new Error(`dispositivo ${reading.dispositivoId} no está vinculado a un paciente`);

  let inserted = false;
  let alertInserted = false;
  if (reading.pulsaciones !== null && reading.spo2 !== null) {
    const filter = reading.firebaseEventId
      ? { firebaseEventId: reading.firebaseEventId }
      : { dispositivoId: reading.dispositivoId, fechaHora: reading.fechaHora };
    const result = await Medicion.updateOne(filter, {
      $setOnInsert: { ...reading, pacienteId: device.pacienteId },
    }, { upsert: true });
    inserted = result.upsertedCount === 1;
  }

  const buttonAlert = buildButtonAlert(reading, device.pacienteId);
  if (buttonAlert) {
    const alertFilter = buttonAlert.firebaseEventId
      ? { firebaseEventId: buttonAlert.firebaseEventId }
      : { pacienteId: device.pacienteId, tipo: buttonAlert.tipo, fechaHora: buttonAlert.fechaHora };
    const alertResult = await Alerta.updateOne(alertFilter, { $setOnInsert: buttonAlert }, { upsert: true });
    alertInserted = alertResult.upsertedCount === 1;
  }

  await Dispositivo.updateOne({ _id: device._id }, {
    $set: {
      estado: 'CONECTADO',
      ultimaConexion: reading.fechaHora,
      ...(reading.versionFirmware ? { versionFirmware: reading.versionFirmware } : {}),
    },
  });

  return { inserted, alertInserted, reading };
}

export function getFirebaseSyncStatus() {
  return { ...getFirebaseConfigStatus(), ...firebaseState };
}

export function getDeviceLiveStatus(dispositivoId) {
  const id = String(dispositivoId || '').trim().toUpperCase();
  const status = deviceStatuses.get(id);
  if (!status) {
    return {
      dispositivoId: id,
      estado: 'ESPERANDO_CONEXION',
      conectado: false,
      dedoDetectado: false,
      segundos: null,
      actualizadoEn: null,
    };
  }

  const actualizadoEn = Number(status.actualizadoEn);
  const stale = !Number.isFinite(actualizadoEn) || Date.now() - actualizadoEn > 15_000;
  return {
    dispositivoId: id,
    ...status,
    conectado: !stale && status.conectado !== false,
    estado: stale ? 'DESCONECTADO' : status.estado,
  };
}

export async function startFirebaseSync({ mongoConnected = false } = {}) {
  firebaseState.path = process.env.FIREBASE_LECTURAS_PATH?.trim() || 'lecturas';
  firebaseState.statusesPath = process.env.FIREBASE_ESTADOS_PATH?.trim() || 'estados_dispositivos';
  firebaseState.intervalMs = Math.max(1000, Number(process.env.FIREBASE_SYNC_INTERVAL_MS || 2000));
  firebaseState.lastError = null;

  if (!mongoConnected) {
    firebaseState.active = false;
    firebaseState.lastError = 'MongoDB no está conectado; la sincronización requiere persistencia.';
    console.info('[Firebase] Sincronización desactivada: MongoDB no está conectado.');
    return getFirebaseSyncStatus();
  }

  try {
    const firebase = getFirebaseClient();
    if (!firebase) {
      firebaseState.active = false;
      console.info('[Firebase] Sincronización desactivada: faltan credenciales o FIREBASE_DATABASE_URL.');
      return getFirebaseSyncStatus();
    }

    const syncReadings = async () => {
      if (syncInProgress) return true;
      syncInProgress = true;
      try {
        const [readings, statuses] = await Promise.all([
          firebase.list(firebaseState.path, 100),
          firebase.get(firebaseState.statusesPath),
        ]);
        deviceStatuses.clear();
        if (statuses && typeof statuses === 'object') {
          for (const [id, status] of Object.entries(statuses)) {
            if (status && typeof status === 'object') deviceStatuses.set(id.toUpperCase(), status);
          }
        }
        let lastEventError = null;
        for (const [key, payload] of Object.entries(readings)) {
          const eventId = `${firebaseState.path}/${key}`;
          if (seenEvents.has(eventId)) continue;
          try {
            const { inserted, alertInserted } = await persistFirebaseReading(payload, eventId);
            const handled = inserted || alertInserted;
            firebaseState.processed += handled ? 1 : 0;
            firebaseState.ignored += handled ? 0 : 1;
            firebaseState.alertsCreated += alertInserted ? 1 : 0;
          } catch (error) {
            firebaseState.ignored += 1;
            lastEventError = `${eventId}: ${error.message}`;
            console.warn('[Firebase] Evento ignorado:', lastEventError);
          } finally {
            rememberEvent(eventId);
          }
        }
        firebaseState.lastSyncAt = new Date().toISOString();
        firebaseState.lastError = lastEventError;
        return true;
      } catch (error) {
        firebaseState.ignored += 1;
        firebaseState.lastError = error.message;
        console.warn('[Firebase] No se pudo sincronizar:', error.message);
        return false;
      } finally {
        syncInProgress = false;
      }
    };

    const initialSyncSucceeded = await syncReadings();
    if (!initialSyncSucceeded) throw new Error(firebaseState.lastError || 'Firebase no respondió');
    syncTimer = setInterval(syncReadings, firebaseState.intervalMs);
    syncTimer.unref?.();
    firebaseState.active = true;
    console.info(`[Firebase] Sincronizando /${firebaseState.path} cada ${firebaseState.intervalMs} ms.`);
  } catch (error) {
    firebaseState.active = false;
    firebaseState.lastError = error.message;
    console.error('[Firebase] No fue posible iniciar la sincronización:', error.message);
  }

  return getFirebaseSyncStatus();
}

export function stopFirebaseSync() {
  if (syncTimer) clearInterval(syncTimer);
  syncTimer = null;
  syncInProgress = false;
  seenEvents.clear();
  deviceStatuses.clear();
  firebaseState.active = false;
}
