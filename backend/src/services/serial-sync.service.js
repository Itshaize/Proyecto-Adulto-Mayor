import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { persistFirebaseReading } from './firebase-sync.service.js';
import mongoose from 'mongoose';
import { EventEmitter } from 'events';

export const serialEvents = new EventEmitter();
let port = null;
let isConnected = false;

export async function startSerialSync() {
  if (!mongoose.connection.readyState) {
    console.info('[Serial] Sincronización desactivada: MongoDB no está conectado.');
    return;
  }

  try {
    const ports = await SerialPort.list();
    const arduinoPort = ports.find(p => p.manufacturer?.toLowerCase().includes('wch') || p.manufacturer?.toLowerCase().includes('arduino') || p.manufacturer?.toLowerCase().includes('silicon') || p.vendorId);
    
    if (!arduinoPort) {
      if (isConnected) console.info('[Serial] No se detectó ningún ESP32 conectado por USB. Reintentando en 5s...');
      isConnected = false;
      setTimeout(() => {
        if (!isConnected) startSerialSync();
      }, 5000);
      return;
    }

    console.info(`[Serial] Conectando al puerto ${arduinoPort.path}...`);
    
    port = new SerialPort({
      path: arduinoPort.path,
      baudRate: 115200,
      autoOpen: true
    });

    const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    port.on('open', () => {
      isConnected = true;
      serialEvents.emit('status', { estado: 'CONECTADO' });
    });

    parser.on('data', async (line) => {
      try {
        const data = JSON.parse(line.trim());
        
        // Si es un resultado final (o pulsador), lo guardamos en BD
        if (data.origen && (data.estado === 'RESULTADO' || !data.estado)) {
          const payload = { ...data };
          delete payload.estado; // Limpiamos campos extra antes de guardar
          
          const { inserted, alertInserted } = await persistFirebaseReading(payload);
          if (inserted || alertInserted) {
            console.log(`[Serial] Datos guardados: BPM ${payload.pulsaciones}, SpO2 ${payload.spo2}%`);
          }
          serialEvents.emit('status', { estado: 'RESULTADO', pulsaciones: payload.pulsaciones, spo2: payload.spo2 });
          
          // --- NUEVO: Puente hacia Firebase ---
          const firebaseUrl = process.env.FIREBASE_DATABASE_URL;
          if (firebaseUrl) {
            const cleanUrl = firebaseUrl.endsWith('/') ? firebaseUrl.slice(0, -1) : firebaseUrl;
            const path = process.env.FIREBASE_LECTURAS_PATH || 'lecturas';
            try {
               await fetch(`${cleanUrl}/${path}.json`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                   ...payload,
                   timestamp: Date.now() // Firebase standard timestamp
                 })
               });
               console.log(`[Firebase] Lectura de ${payload.origen} respaldada en la nube.`);
            } catch(e) {
               console.error('[Firebase] Error al respaldar en la nube:', e.message);
            }
          }
          // ------------------------------------
        } else if (data.estado === 'INFO') {
          console.info(`[ESP32] ${data.mensaje}`);
        } else {
          // Reenviamos estados intermedios (ESPERANDO_DEDO, LEYENDO, ERROR) a la UI
          serialEvents.emit('status', data);
        }
      } catch (err) {
        if (!err.message.includes('Unexpected token')) {
          console.error('[Serial] Error al guardar lectura:', err.message);
        }
      }
    });

    port.on('error', (err) => {
      if (isConnected) console.error('[Serial] Error en el puerto:', err.message);
      isConnected = false;
      serialEvents.emit('status', { estado: 'DESCONECTADO' });
      
      // Auto-reconnect
      setTimeout(() => {
        if (!isConnected) startSerialSync();
      }, 3000);
    });

    port.on('close', () => {
      if (isConnected) console.info('[Serial] Puerto cerrado.');
      isConnected = false;
      serialEvents.emit('status', { estado: 'DESCONECTADO' });
      
      // Auto-reconnect
      setTimeout(() => {
        if (!isConnected) startSerialSync();
      }, 3000);
    });

  } catch (error) {
    if (isConnected) console.error('[Serial] Error al iniciar la sincronización serial:', error.message);
    
    // Auto-reconnect on initial failure too (e.g. board not plugged in yet)
    setTimeout(() => {
        if (!isConnected) startSerialSync();
    }, 5000);
  }
}

export function stopSerialSync() {
  if (port && port.isOpen) {
    port.close();
  }
}

export function isSerialConnected() {
  return isConnected;
}
