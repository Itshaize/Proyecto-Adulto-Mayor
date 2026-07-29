import { SerialPort, ReadlineParser } from 'serialport';

const FIREBASE_URL = 'https://prueba-bca78-default-rtdb.firebaseio.com/lecturas.json';
let isConnected = false;

async function startBridge() {
  try {
    const ports = await SerialPort.list();
    const arduinoPort = ports.find(p => p.manufacturer?.toLowerCase().includes('wch') || p.manufacturer?.toLowerCase().includes('arduino') || p.manufacturer?.toLowerCase().includes('silicon') || p.vendorId);
    
    if (!arduinoPort) {
      if (isConnected) console.log('[Puente] Buscando ESP32 conectado por USB...');
      isConnected = false;
      setTimeout(startBridge, 5000);
      return;
    }

    const port = new SerialPort({ path: arduinoPort.path, baudRate: 115200 });
    const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

    port.on('open', () => {
      isConnected = true;
      console.log(`[Puente] Conectado exitosamente al ESP32 en el puerto ${arduinoPort.path}`);
      console.log(`[Puente] Esperando mediciones para subirlas a Firebase...`);
    });

    parser.on('data', async (line) => {
      try {
        const data = JSON.parse(line.trim());
        if (data.origen && data.estado === 'RESULTADO') {
          console.log(`[Puente] Dato recibido: BPM ${data.pulsaciones || data.bpm}, SpO2 ${data.spo2}%`);
          
          const payload = { ...data, timestamp: Date.now() };
          delete payload.estado;
          
          await fetch(FIREBASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          console.log(`[Firebase] Dato subido a la nube con éxito.`);
        }
      } catch (err) {
        // Ignorar lineas de depuracion del Arduino
      }
    });

    port.on('close', () => {
      console.log('[Puente] Conexión USB perdida. Reintentando...');
      isConnected = false;
      setTimeout(startBridge, 5000);
    });
    
    port.on('error', () => {
      if (isConnected) console.log('[Puente] Error de conexión USB. Reintentando...');
      isConnected = false;
      setTimeout(startBridge, 5000);
    });

  } catch (error) {
    setTimeout(startBridge, 5000);
  }
}

console.log('==================================================');
console.log('   PUENTE LOCAL USB -> FIREBASE INICIADO');
console.log('==================================================');
startBridge();
