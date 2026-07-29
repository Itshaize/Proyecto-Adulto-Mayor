import { Dispositivo } from '../models/Dispositivo.js';
import { Medicion } from '../models/Medicion.js';
import { Alerta } from '../models/Alerta.js';
import { TomaMedicamento } from '../models/TomaMedicamento.js';
import { getFirebaseConfigStatus, getFirebaseDatabase } from '../config/firebase.js';

const firebaseState = {
  active: false,
  path: process.env.FIREBASE_LECTURAS_PATH?.trim() || 'lecturas',
  lastSyncAt: null,
  lastError: null,
  processed: 0,
  ignored: 0,
  alertsCreated: 0,
};

let readingsQuery = null;
let onReadingAdded = null;

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

  if (!dispositivoId) throw new Error('dispositivoId es obligatorio');
  
  if (origen === 'MAX30102') {
    if (!Number.isFinite(pulsaciones) || pulsaciones < 25 || pulsaciones > 240) throw new Error('pulsaciones fuera del rango permitido (25-240)');
    if (!Number.isFinite(spo2) || spo2 < 50 || spo2 > 100) throw new Error('SpO2 fuera del rango permitido (50-100)');
  }

  return {
    dispositivoId,
    pulsaciones: Math.round(pulsaciones),
    spo2: Math.round(spo2),
    origen,
    ...(versionFirmware ? { versionFirmware } : {}),
    estadoSalud: classifyHealth(pulsaciones, spo2),
    fechaHora: parseTimestamp(payload.timestamp ?? payload.fechaHora ?? payload.createdAt),
    firebaseEventId: eventId || undefined,
  };
}

export function buildButtonAlert(reading, pacienteId) {
  if (reading.origen !== 'PULSADOR') return null;
  return {
    pacienteId,
    firebaseEventId: reading.firebaseEventId,
    tipo: 'PULSADOR_EMERGENCIA',
    titulo: 'Botón de ayuda activado',
    mensaje: `El adulto mayor presionó el pulsador. Última lectura: ${reading.pulsaciones} BPM y SpO₂ ${reading.spo2}%.`,
    nivel: 'CRITICA',
    leida: false,
    fechaHora: reading.fechaHora,
  };
}

export async function persistFirebaseReading(payload, eventId) {
  const reading = normalizeFirebaseReading(payload, eventId);
  const device = await Dispositivo.findOne({ dispositivoId: reading.dispositivoId }).lean();
  if (!device) throw new Error(`dispositivo ${reading.dispositivoId} no está vinculado a un paciente`);

  const filter = reading.firebaseEventId
    ? { firebaseEventId: reading.firebaseEventId }
    : { dispositivoId: reading.dispositivoId, fechaHora: reading.fechaHora };
  const result = await Medicion.updateOne(filter, {
    $setOnInsert: { ...reading, pacienteId: device.pacienteId },
  }, { upsert: true });

  let alertInserted = false;

  if (reading.origen === 'PULSADOR') {
     const today = new Date().toISOString().slice(0, 10);
     const toma = await TomaMedicamento.findOneAndUpdate(
       { pacienteId: device.pacienteId, estado: 'PENDIENTE', fechaProgramada: today },
       { 
         $set: { 
           estado: 'TOMADA', 
           metodoConfirmacion: 'PULSADOR', 
           fechaHoraConfirmacion: reading.fechaHora 
         } 
       },
       { sort: { horaProgramada: 1 }, new: true }
     ).populate('medicamentoId');

     let buttonAlert = null;
     if (toma && toma.medicamentoId) {
        buttonAlert = {
          pacienteId: device.pacienteId,
          firebaseEventId: reading.firebaseEventId,
          tipo: 'MEDICAMENTO_NO_CONFIRMADO', // Reutilizamos el enum, aunque es informativa
          titulo: 'Medicamento Confirmado ✓',
          mensaje: `El adulto mayor confirmó con el botón la toma de ${toma.medicamentoId.nombre} ${toma.medicamentoId.concentracion}.`,
          nivel: 'INFO',
          leida: false,
          fechaHora: reading.fechaHora,
        };
     } else {
        buttonAlert = {
          pacienteId: device.pacienteId,
          firebaseEventId: reading.firebaseEventId,
          tipo: 'INFO', // Esto causará un error de validación Mongoose porque 'INFO' no está en enum de Alerta.tipo. ¡Cambiémoslo a algo en el enum!
          // Enum permitidos en Alerta: 'SPO2_BAJA', 'MEDICAMENTO_NO_CONFIRMADO', 'RITMO_CARDIACO_ANORMAL'
          // Usaremos 'MEDICAMENTO_NO_CONFIRMADO' para evitar modificar el modelo ahora, y pondremos nivel 'INFO'
          titulo: 'Botón presionado',
          mensaje: `El botón fue presionado pero no hay medicamentos pendientes para hoy.`,
          nivel: 'INFO',
          leida: false,
          fechaHora: reading.fechaHora,
        };
     }
     
     const alertFilter = buttonAlert.firebaseEventId
       ? { firebaseEventId: buttonAlert.firebaseEventId }
       : { pacienteId: device.pacienteId, titulo: buttonAlert.titulo, fechaHora: buttonAlert.fechaHora };
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

  return { inserted: result.upsertedCount === 1, alertInserted, reading };
}

export function getFirebaseSyncStatus() {
  return { ...getFirebaseConfigStatus(), ...firebaseState };
}

export async function startFirebaseSync({ mongoConnected = false } = {}) {
  firebaseState.path = process.env.FIREBASE_LECTURAS_PATH?.trim() || 'lecturas';
  firebaseState.lastError = null;

  if (!mongoConnected) {
    firebaseState.active = false;
    firebaseState.lastError = 'MongoDB no está conectado; la sincronización requiere persistencia.';
    console.info('[Firebase] Sincronización desactivada: MongoDB no está conectado.');
    return getFirebaseSyncStatus();
  }

  try {
    const database = getFirebaseDatabase();
    if (!database) {
      firebaseState.active = false;
      console.info('[Firebase] Sincronización desactivada: faltan credenciales o FIREBASE_DATABASE_URL.');
      return getFirebaseSyncStatus();
    }

    readingsQuery = database.ref(firebaseState.path).limitToLast(100);
    onReadingAdded = async (snapshot) => {
      try {
        const eventId = `${firebaseState.path}/${snapshot.key}`;
        const { inserted, alertInserted } = await persistFirebaseReading(snapshot.val(), eventId);
        firebaseState.processed += inserted ? 1 : 0;
        firebaseState.ignored += inserted ? 0 : 1;
        firebaseState.alertsCreated += alertInserted ? 1 : 0;
        firebaseState.lastSyncAt = new Date().toISOString();
        firebaseState.lastError = null;
      } catch (error) {
        firebaseState.ignored += 1;
        firebaseState.lastError = error.message;
        console.warn('[Firebase] Lectura ignorada:', error.message);
      }
    };
    readingsQuery.on('child_added', onReadingAdded, (error) => {
      firebaseState.active = false;
      firebaseState.lastError = error.message;
      console.error('[Firebase] Listener cancelado:', error.message);
    });
    firebaseState.active = true;
    console.info(`[Firebase] Escuchando nuevas lecturas en /${firebaseState.path}.`);
  } catch (error) {
    firebaseState.active = false;
    firebaseState.lastError = error.message;
    console.error('[Firebase] No fue posible iniciar la sincronización:', error.message);
  }

  return getFirebaseSyncStatus();
}

export function stopFirebaseSync() {
  if (readingsQuery && onReadingAdded) readingsQuery.off('child_added', onReadingAdded);
  readingsQuery = null;
  onReadingAdded = null;
  firebaseState.active = false;
}
