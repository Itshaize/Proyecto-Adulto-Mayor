#include <Wire.h>
#include "MAX30105.h"
#include "spo2_algorithm.h"

// ESP32-C3 + MAX30102. Este firmware solo escribe JSON por USB/Serial.
// El programa puente_local autentica y envía los eventos a Firebase.
constexpr int BUTTON_PIN = 7;
constexpr int SDA_PIN = 8;
constexpr int SCL_PIN = 9;
constexpr long UMBRAL_DEDO = 10000;
constexpr size_t BUFFER_LENGTH = 100;
constexpr unsigned long DEBOUNCE_MS = 50;

const char* DISPOSITIVO_ID = "ESP32-001";
const char* VERSION_FIRMWARE = "2.0.0-usb";

MAX30105 particleSensor;
uint32_t irBuffer[BUFFER_LENGTH];
uint32_t redBuffer[BUFFER_LENGTH];
size_t sampleCount = 0;

int32_t spo2Calculado = 0;
int8_t spo2Valido = 0;
int32_t ritmoCalculado = 0;
int8_t ritmoValido = 0;
int ultimoBpmValido = 0;
int ultimoSpo2Valido = 0;

enum EstadoSensor {
  ESPERANDO_DEDO,
  LEYENDO,
  ESPERANDO_RETIRO
};

EstadoSensor estadoActual = ESPERANDO_DEDO;
bool botonCrudoAnterior = HIGH;
bool botonEstable = HIGH;
unsigned long ultimoCambioBoton = 0;
int ultimoSegundoInformado = -1;

void imprimirEstado(const char* estado) {
  Serial.print("{\"estado\":\"");
  Serial.print(estado);
  Serial.println("\"}");
}

void enviarEvento(const char* origen, bool incluirSignosVitales) {
  Serial.print("{\"estado\":\"RESULTADO\",\"dispositivoId\":\"");
  Serial.print(DISPOSITIVO_ID);
  Serial.print("\",\"origen\":\"");
  Serial.print(origen);
  Serial.print("\",\"versionFirmware\":\"");
  Serial.print(VERSION_FIRMWARE);
  Serial.print("\"");

  if (incluirSignosVitales) {
    Serial.print(",\"pulsaciones\":");
    Serial.print(ultimoBpmValido);
    Serial.print(",\"spo2\":");
    Serial.print(ultimoSpo2Valido);
  }

  Serial.println("}");
}

void procesarPulsador() {
  const bool lectura = digitalRead(BUTTON_PIN);

  if (lectura != botonCrudoAnterior) {
    botonCrudoAnterior = lectura;
    ultimoCambioBoton = millis();
  }

  if (millis() - ultimoCambioBoton < DEBOUNCE_MS || lectura == botonEstable) return;
  botonEstable = lectura;

  if (botonEstable == LOW) {
    const bool hayLecturaPrevia = ultimoBpmValido > 0 && ultimoSpo2Valido > 0;
    enviarEvento("PULSADOR", hayLecturaPrevia);
  }
}

void iniciarLectura() {
  sampleCount = 0;
  ultimoSegundoInformado = 4;
  estadoActual = LEYENDO;
  Serial.println("{\"estado\":\"LEYENDO\",\"segundos\":4}");
}

void cancelarLectura() {
  sampleCount = 0;
  estadoActual = ESPERANDO_DEDO;
  imprimirEstado("ESPERANDO_DEDO");
}

void terminarLectura() {
  maxim_heart_rate_and_oxygen_saturation(
    irBuffer,
    BUFFER_LENGTH,
    redBuffer,
    &spo2Calculado,
    &spo2Valido,
    &ritmoCalculado,
    &ritmoValido
  );

  const bool resultadoValido = ritmoValido == 1
    && spo2Valido == 1
    && ritmoCalculado >= 25
    && ritmoCalculado <= 240
    && spo2Calculado >= 50
    && spo2Calculado <= 100;

  if (resultadoValido) {
    ultimoBpmValido = ritmoCalculado;
    ultimoSpo2Valido = spo2Calculado;
    enviarEvento("MAX30102", true);
  } else {
    Serial.println("{\"estado\":\"ERROR\",\"mensaje\":\"Lectura inestable; mantenga el dedo quieto e intente nuevamente\"}");
  }

  estadoActual = ESPERANDO_RETIRO;
}

void procesarSensor() {
  particleSensor.check();

  if (estadoActual == ESPERANDO_DEDO) {
    while (particleSensor.available()) {
      const uint32_t ir = particleSensor.getIR();
      particleSensor.nextSample();
      if (ir > UMBRAL_DEDO) {
        iniciarLectura();
        break;
      }
    }
    return;
  }

  if (estadoActual == ESPERANDO_RETIRO) {
    while (particleSensor.available()) {
      const uint32_t ir = particleSensor.getIR();
      particleSensor.nextSample();
      if (ir <= UMBRAL_DEDO) {
        cancelarLectura();
        break;
      }
    }
    return;
  }

  while (particleSensor.available() && sampleCount < BUFFER_LENGTH) {
    const uint32_t red = particleSensor.getRed();
    const uint32_t ir = particleSensor.getIR();
    particleSensor.nextSample();

    if (ir <= UMBRAL_DEDO) {
      cancelarLectura();
      return;
    }

    redBuffer[sampleCount] = red;
    irBuffer[sampleCount] = ir;
    sampleCount += 1;

    const int segundosRestantes = max(1, 4 - static_cast<int>(sampleCount / 25));
    if (segundosRestantes != ultimoSegundoInformado && sampleCount < BUFFER_LENGTH) {
      ultimoSegundoInformado = segundosRestantes;
      Serial.print("{\"estado\":\"LEYENDO\",\"segundos\":");
      Serial.print(segundosRestantes);
      Serial.println("}");
    }
  }

  if (sampleCount == BUFFER_LENGTH) terminarLectura();
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(BUTTON_PIN, INPUT_PULLUP);
  Wire.begin(SDA_PIN, SCL_PIN);

  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("{\"estado\":\"ERROR\",\"mensaje\":\"MAX30102 no detectado; revise alimentación, SDA y SCL\"}");
    while (true) {
      procesarPulsador();
      delay(10);
    }
  }

  // Configuración oficial usada por el ejemplo SpO2 de SparkFun:
  // brillo 60, promedio 4, LEDs rojo+IR, 100 Hz, pulso 411, ADC 4096.
  particleSensor.setup(60, 4, 2, 100, 411, 4096);
  particleSensor.setPulseAmplitudeGreen(0);
  particleSensor.clearFIFO();

  Serial.print("{\"estado\":\"LISTO\",\"dispositivoId\":\"");
  Serial.print(DISPOSITIVO_ID);
  Serial.print("\",\"versionFirmware\":\"");
  Serial.print(VERSION_FIRMWARE);
  Serial.println("\"}");
}

void loop() {
  procesarPulsador();
  procesarSensor();
  delay(2);
}
