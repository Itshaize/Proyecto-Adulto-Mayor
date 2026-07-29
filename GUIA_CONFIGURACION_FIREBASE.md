# Configuración distribuida ESP32 → Firebase → KAIROS

## Flujo utilizado

```text
ESP32 por USB
  → puente local autenticado en la computadora del dispositivo
  → Firebase Realtime Database /lecturas
  → backend KAIROS con Firebase Admin
  → MongoDB
  → frontend, actualizado desde la API cada 30 segundos
```

El frontend no accede directamente a Realtime Database. Firebase desacopla la computadora del hardware de la computadora que ejecuta KAIROS.

## Computadora del backend

1. Instala dependencias con `npm install --prefix backend`.
2. Crea `backend/.env` desde `backend/.env.example`.
3. Conserva la conexión de MongoDB y configura:

```env
FIREBASE_DATABASE_URL=https://TU-PROYECTO-default-rtdb.firebaseio.com
FIREBASE_LECTURAS_PATH=lecturas
FIREBASE_ESTADOS_PATH=estados_dispositivos
GOOGLE_APPLICATION_CREDENTIALS=C:/ruta/segura/firebase-clave.json
```

4. Ejecuta `npm run dev`.
5. Confirma estos mensajes:

```text
[API] MongoDB conectado.
[Firebase] Sincronizando /lecturas cada 2000 ms.
```

## Computadora del ESP32

1. Carga `hardware/esp32_codigo/esp32_codigo.ino` desde Arduino IDE.
2. Instala la librería `SparkFun MAX3010x Pulse and Proximity Sensor Library`.
3. Cierra el Monitor Serie para liberar el puerto.
4. Configura `hardware/puente_local/.env` a partir de `.env.example`.
5. Ejecuta `npm install` y después `npm start` dentro de `hardware/puente_local`.

El firmware no genera valores aleatorios. Mantiene el dedo durante 8 segundos, calcula dos bloques válidos de 4 segundos y envía el promedio. Si alguno de los bloques no permite calcular BPM y SpO₂ válidos, emite un error y no crea una medición. El pulsador confirma la pastilla pendiente más cercana del día.

## Seguridad

- La cuenta de servicio tiene acceso privilegiado: guárdala fuera del repositorio.
- No publiques `.env`, `firebase-clave.json` ni claves privadas.
- Si una clave se comparte por un canal no seguro, elimínala y genera otra.
- Para producción, usa credenciales separadas y con el mínimo privilegio posible para el puente y el backend.
