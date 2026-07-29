#include <Wire.h>
#include "MAX30105.h"
#include "spo2_algorithm.h"

// ESP32-C3 + MAX30102. Este firmware solo escribe JSON por USB/Serial.
// El programa puente_local autentica y envía los eventos a Firebase.
constexpr int BUTTON_PIN = 7;
constexpr int SDA_PIN = 8;
constexpr int SCL_PIN = 9;
constexpr long UMBRAL_DEDO = 5000;
constexpr int MUESTRAS_DEDO_CONSECUTIVAS = 5;
constexpr int DURACION_LECTURA_SEGUNDOS = 8;
constexpr int MUESTRAS_POR_SEGUNDO = 25;
constexpr size_t BUFFER_LENGTH = DURACION_LECTURA_SEGUNDOS * MUESTRAS_POR_SEGUNDO;
constexpr size_t ALGORITHM_BUFFER_LENGTH = 100;
constexpr unsigned long DEBOUNCE_MS = 50;
constexpr unsigned long REPORTE_ESPERA_MS = 2000;
constexpr unsigned long RECUPERACION_RETIRO_MS = 4000;

const char* DISPOSITIVO_ID = "ESP32-001";
const char* VERSION_FIRMWARE = "2.1.0-usb";

MAX30105 particleSensor;
uint32_t irBuffer[BUFFER_LENGTH];
uint32_t redBuffer[BUFFER_LENGTH];
size_t sampleCount = 0;

int ultimoBpmValido = 0;
int ultimoSpo2Valido = 0;
int muestrasDedoConsecutivas = 0;

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
unsigned long ultimoReporteEspera = 0;
unsigned long tiempoInicioRetiro = 0;

bool calcularBloque(size_t offset, int32_t* bpm, int32_t* spo2) {
  int32_t bpmBloque = 0;
  int8_t bpmValidoBloque = 0;
  int32_t spo2Bloque = 0;
  int8_t spo2ValidoBloque = 0;

  maxim_heart_rate_and_oxygen_saturation(
    irBuffer + offset,
    ALGORITHM_BUFFER_LENGTH,
    redBuffer + offset,
    &spo2Bloque,
    &spo2ValidoBloque,
    &bpmBloque,
    &bpmValidoBloque
  );

  const bool valido = bpmValidoBloque == 1
    && spo2ValidoBloque == 1
    && bpmBloque >= 25
    && bpmBloque <= 240
    && spo2Bloque >= 50
    && spo2Bloque <= 100;
  if (!valido) return false;

  *bpm = bpmBloque;
  *spo2 = spo2Bloque;
  return true;
}

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
    enviarEvento("PULSADOR", false);
  }
}

void iniciarLectura() {
  sampleCount = 0;
  ultimoSegundoInformado = DURACION_LECTURA_SEGUNDOS;
  estadoActual = LEYENDO;
  Serial.print("{\"estado\":\"LEYENDO\",\"segundos\":");
  Serial.print(DURACION_LECTURA_SEGUNDOS);
  Serial.println("}");
}

void cancelarLectura() {
  sampleCount = 0;
  muestrasDedoConsecutivas = 0;
  estadoActual = ESPERANDO_DEDO;
  particleSensor.clearFIFO();
  imprimirEstado("ESPERANDO_DEDO");
}

void terminarLectura() {
  const size_t offsets[] = { 0, 33, 66, 100 };
  int64_t sumaBpm = 0;
  int64_t sumaSpo2 = 0;
  int bloquesValidos = 0;

  for (const size_t offset : offsets) {
    int32_t bpmBloque = 0;
    int32_t spo2Bloque = 0;
    if (calcularBloque(offset, &bpmBloque, &spo2Bloque)) {
      sumaBpm += bpmBloque;
      sumaSpo2 += spo2Bloque;
      bloquesValidos += 1;
    }
  }

  const bool resultadoValido = bloquesValidos >= 2;

  if (resultadoValido) {
    ultimoBpmValido = static_cast<int>((sumaBpm + bloquesValidos / 2) / bloquesValidos);
    ultimoSpo2Valido = static_cast<int>((sumaSpo2 + bloquesValidos / 2) / bloquesValidos);
    enviarEvento("MAX30102", true);
  } else {
    Serial.println("{\"estado\":\"ERROR\",\"mensaje\":\"Señal inestable durante los 8 segundos; mantenga el dedo firme e intente nuevamente\"}");
  }

  estadoActual = ESPERANDO_RETIRO;
  tiempoInicioRetiro = millis();
}

void procesarSensor() {
  particleSensor.check();

  if (estadoActual == ESPERANDO_DEDO) {
    while (particleSensor.available()) {
      const uint32_t ir = particleSensor.getIR();
      particleSensor.nextSample();
      if (ir > UMBRAL_DEDO) {
        muestrasDedoConsecutivas += 1;
        if (muestrasDedoConsecutivas >= MUESTRAS_DEDO_CONSECUTIVAS) {
          iniciarLectura();
          break;
        }
      } else {
        muestrasDedoConsecutivas = 0;
      }

      if (millis() - ultimoReporteEspera >= REPORTE_ESPERA_MS) {
        ultimoReporteEspera = millis();
        Serial.print("{\"estado\":\"ESPERANDO_DEDO\",\"senalIR\":");
        Serial.print(ir);
        Serial.println("}");
      }
    }
    return;
  }

  if (estadoActual == ESPERANDO_RETIRO) {
    if (millis() - tiempoInicioRetiro >= RECUPERACION_RETIRO_MS) {
      cancelarLectura();
      return;
    }
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

    const int segundosRestantes = max(
      1,
      DURACION_LECTURA_SEGUNDOS - static_cast<int>(sampleCount / MUESTRAS_POR_SEGUNDO)
    );
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
