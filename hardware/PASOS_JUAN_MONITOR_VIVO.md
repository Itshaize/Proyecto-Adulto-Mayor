# Actualización para Juan: monitor en vivo

1. En Arduino IDE, abre `esp32_codigo.ino`, selecciona la placa ESP32-C3 y carga el programa.
2. Cierra por completo el Monitor Serie.
3. Reemplaza los archivos del puente por `index.js`, `package.json` y `package-lock.json`.
4. Conserva `firebase-clave.json` fuera de esta carpeta.
5. En el `.env`, usa:

```env
FIREBASE_DATABASE_URL=https://prueba-bca78-default-rtdb.firebaseio.com
FIREBASE_LECTURAS_PATH=lecturas
FIREBASE_ESTADOS_PATH=estados_dispositivos
GOOGLE_APPLICATION_CREDENTIALS=C:/Users/ASUS/OneDrive/Escritorio/firebase-clave.json
DEVICE_ID=ESP32-001
SERIAL_PORT=COM3
SERIAL_BAUD_RATE=115200
SERIAL_RECONNECT_DELAY_MS=5000
STATUS_HEARTBEAT_MS=5000
```

6. En PowerShell, dentro de la carpeta del puente:

```powershell
npm ci
npm start
```

La consola debe mostrar que publica eventos en `/lecturas` y el estado en `/estados_dispositivos/ESP32-001`.
