# Firmware KAIROS 1.2.0: ESP32 + MAX30102 + portal Wi-Fi

Este firmware envía a Firebase un único promedio estable cada 30 segundos, en vez de escribir una lectura cada 1.5 segundos. La ruta y el contrato coinciden con el puente del sistema:

```text
/lecturas/{idFirebase}
  dispositivoId: ESP32-A1B2C3
  pulsaciones: numero
  spo2: numero
  timestamp: hora del servidor Firebase
  origen: MAX30102 | PULSADOR
```

## Preparación en Arduino IDE

1. Instalar las librerías `Firebase Arduino Client Library for ESP8266 and ESP32` y `SparkFun MAX3010x Pulse and Proximity Sensor Library`.
2. En Arduino IDE, usa **Sketch → Add File...** y agrega `secrets.h`, o crea una pestaña nueva llamada exactamente `secrets.h`. Copia la estructura de `secrets.example.h` y completa únicamente los datos de Firebase. El archivo real está ignorado por Git.
3. Abrir `kairos_max30102.ino`, seleccionar la placa ESP32 correcta y cargarlo.
4. Abrir el monitor serie a `115200` baudios.

## Conectar el dispositivo a Wi-Fi

1. Si el ESP32 todavía no tiene una red guardada o no logra conectarse, crea la red `ESP32-Config`.
2. Conecta un teléfono o computador a `ESP32-Config` usando la clave `12345678`.
3. Abre `http://192.168.4.1`. El DNS cautivo también redirige las páginas no encontradas al formulario.
4. Escribe el nombre y la contraseña de la red doméstica y pulsa **Guardar y conectar**.
5. El ESP32 guarda los datos en memoria y se reinicia. En los siguientes arranques intentará conectarse automáticamente.

Al iniciar, el equipo genera automáticamente un código único y estable a partir de su chip, por ejemplo `ESP32-A1B2C3`, y lo muestra como `Codigo para vincular este equipo: ESP32-A1B2C3`. No hay que editar el firmware para cada placa: durante la preparación se copia una vez ese código en una etiqueta pegada al equipo. Es el único dato que el familiar escribe en KAIROS.

Los pines actuales son botón `GPIO 7`, SDA `GPIO 8` y SCL `GPIO 9`. El botón usa `INPUT_PULLUP`, así que debe conectarse entre GPIO 7 y GND.

## Comportamiento

- Al colocar el dedo comienza una ventana local de 30 segundos.
- Solo se envía si existen al menos 3 latidos y 50 muestras válidas de SpO2.
- Al retirar el dedo se cancela la ventana y nunca se guardan valores cero.
- El pulsador tiene antirrebote y bloqueo de 3 segundos. Envía inmediatamente la última lectura estable, sin crear ráfagas. El backend reconoce `origen=PULSADOR` y crea una alerta crítica para el familiar.
- Si se pierde el Wi-Fi, el dispositivo reintenta la conexión guardada con esperas progresivas de hasta 30 segundos.
- El código automático mostrado por el ESP32 debe registrarse en KAIROS y queda vinculado al paciente al guardar el formulario.

El pulsador funciona como botón de ayuda o emergencia. No confirma automáticamente una medicina: esa acción requiere conocer la toma concreta que está pendiente.
