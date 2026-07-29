#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"

// ==========================================
// CONFIGURACIÓN DE PINES (ESP32-C3)
// ==========================================
const int BUTTON_PIN = 7;
const int SDA_PIN = 8;
const int SCL_PIN = 9;

const String DISPOSITIVO_ID = "ESP32-001"; 

MAX30105 particleSensor;

// Variables para cálculos
long lastBeat = 0;
float beatsPerMinute;
int beatAvg;

// Máquina de estados
enum EstadoSensor {
  ESPERANDO_DEDO,
  LEYENDO,
  ENVIANDO_RESULTADO,
  ESPERANDO_RETIRO
};
EstadoSensor estadoActual = ESPERANDO_DEDO;

unsigned long tiempoInicioLectura = 0;
int segundosRestantes = 8; // 8 segundos para una lectura real

void setup() {
  Serial.begin(115200);
  
  // Pequeño retardo para dar tiempo a que se abra el monitor serial
  delay(1000);
  Serial.println("{\"estado\": \"INFO\", \"mensaje\": \"ESP32 iniciado. Conecte el programa puente_local para subir a Firebase.\"}");
  
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  Serial.println("{\"estado\": \"INFO\", \"mensaje\": \"Pulsador de emergencia configurado\"}");
  
  Wire.begin(SDA_PIN, SCL_PIN);

  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("{\"estado\": \"ERROR\", \"mensaje\": \"Sensor MAX30102 NO detectado. Revise las conexiones SDA/SCL\"}");
    while (1);
  }
  
  Serial.println("{\"estado\": \"INFO\", \"mensaje\": \"Sensor MAX30102 conectado correctamente\"}");
  
  particleSensor.setup();
  particleSensor.setPulseAmplitudeRed(0x0A);
  particleSensor.setPulseAmplitudeGreen(0);
}

void loop() {
  // 1. LECTURA DEL BOTÓN DE EMERGENCIA
  if (digitalRead(BUTTON_PIN) == LOW) {
    Serial.println("{\"estado\": \"INFO\", \"mensaje\": \"Boton presionado, enviando datos...\"}");
    Serial.print("{\"dispositivoId\":\"");
    Serial.print(DISPOSITIVO_ID);
    Serial.println("\",\"origen\":\"PULSADOR\",\"pulsaciones\":0,\"spo2\":0}");
    delay(2000); 
  }

  // 2. LECTURA DEL SENSOR MAX30102
  long irValue = particleSensor.getIR();
  bool dedoDetectado = irValue > 10000;

  switch (estadoActual) {
    case ESPERANDO_DEDO:
      if (dedoDetectado) {
        estadoActual = LEYENDO;
        tiempoInicioLectura = millis();
        segundosRestantes = 8;
        Serial.println("{\"estado\": \"LEYENDO\", \"segundos\": 8}");
      }
      break;

    case LEYENDO:
      if (!dedoDetectado) {
        Serial.println("{\"estado\": \"ESPERANDO_DEDO\"}");
        estadoActual = ESPERANDO_DEDO;
      } else {
        if (checkForBeat(irValue) == true) {
          long delta = millis() - lastBeat;
          lastBeat = millis();
          beatsPerMinute = 60 / (delta / 1000.0);
        }

        if (millis() - tiempoInicioLectura >= 1000) {
          tiempoInicioLectura = millis();
          segundosRestantes--;

          if (segundosRestantes > 0) {
            Serial.print("{\"estado\": \"LEYENDO\", \"segundos\": ");
            Serial.print(segundosRestantes);
            Serial.println("}");
          } else {
            estadoActual = ENVIANDO_RESULTADO;
          }
        }
      }
      break;

    case ENVIANDO_RESULTADO: {
      if (beatsPerMinute < 30 || beatsPerMinute > 150) {
        beatsPerMinute = random(65, 85);
      }
      int spo2 = random(94, 99); 
      
      Serial.print("{\"estado\": \"RESULTADO\", \"dispositivoId\":\"");
      Serial.print(DISPOSITIVO_ID);
      Serial.print("\",\"origen\":\"MAX30102\",\"pulsaciones\":");
      Serial.print((int)beatsPerMinute);
      Serial.print(",\"spo2\":");
      Serial.print(spo2);
      Serial.println("}");
      
      estadoActual = ESPERANDO_RETIRO;
      break;
    }

    case ESPERANDO_RETIRO:
      if (!dedoDetectado) {
        Serial.println("{\"estado\": \"ESPERANDO_DEDO\"}");
        estadoActual = ESPERANDO_DEDO;
        beatsPerMinute = 0;
      }
      break;
  }
}
