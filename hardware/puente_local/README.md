# Puente USB → Firebase

Este proceso se ejecuta únicamente en la computadora que tiene el ESP32 conectado por USB. Lee los eventos JSON del firmware `hardware/esp32_codigo/esp32_codigo.ino` y los escribe de forma autenticada en Firebase Realtime Database.

## Configuración

1. Instala las dependencias con `npm install`.
2. Copia `.env.example` como `.env`.
3. Define `GOOGLE_APPLICATION_CREDENTIALS` con la ruta absoluta de una cuenta de servicio guardada fuera del repositorio.
4. Si la detección automática no encuentra el ESP32, define `SERIAL_PORT=COM5` usando el puerto real mostrado por el Administrador de dispositivos.
5. Cierra el Monitor Serie de Arduino IDE y ejecuta `npm start`.

El puente acepta estos eventos:

```json
{"estado":"RESULTADO","dispositivoId":"ESP32-001","origen":"MAX30102","pulsaciones":72,"spo2":97}
{"estado":"RESULTADO","dispositivoId":"ESP32-001","origen":"PULSADOR"}
```

También publica el estado actual en `/estados_dispositivos/ESP32-001`: conexión USB, detección del dedo, cuenta regresiva y resultado. Ese nodo es temporal y no se guarda como parte del historial médico.

No se aceptan lecturas MAX30102 fuera de rango. El pulsador puede generar una emergencia aunque todavía no exista una medición válida.

Nunca copies `firebase-clave.json` dentro del repositorio ni lo compartas por chat.
