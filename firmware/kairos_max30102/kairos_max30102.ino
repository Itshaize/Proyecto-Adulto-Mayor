#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <Preferences.h>
#include <Firebase_ESP_Client.h>
#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"

#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// Las credenciales de Firebase quedan separadas del firmware versionado.
// El Wi-Fi se configura desde el portal cautivo del propio ESP32.
#if __has_include("secrets.h")
  #include "secrets.h"
  #define CONFIGURACION_EXTERNA_OK true
#else
  #warning "Falta secrets.h: configura Firebase antes de cargar el firmware"
  #define FIREBASE_API_KEY "CONFIGURA_FIREBASE_API_KEY"
  #define FIREBASE_DATABASE_URL "CONFIGURA_FIREBASE_DATABASE_URL"
  #define CONFIGURACION_EXTERNA_OK false
#endif

#define VERSION_FIRMWARE "1.2.0-portal"

#define BOTON_PIN 7
#define SDA_PIN 8
#define SCL_PIN 9

// El sensor se lee continuamente, pero Firebase recibe solo un promedio
// cada 30 segundos. Cambia este valor si desean otra frecuencia.
const unsigned long INTERVALO_ENVIO_MS = 30000;
const unsigned long INTERVALO_SERIAL_MS = 1000;
const unsigned long INTERVALO_SPO2_MS = 100;
const unsigned long REBOTE_BOTON_MS = 50;
const unsigned long BLOQUEO_BOTON_MS = 3000;

const long UMBRAL_DEDO = 50000;
const uint16_t MUESTRAS_CALENTAMIENTO = 100;
const uint8_t LATIDOS_MINIMOS = 3;
const uint16_t MUESTRAS_SPO2_MINIMAS = 50;

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
MAX30105 particleSensor;
Preferences prefs;
WebServer server(80);
DNSServer dnsServer;
const byte DNS_PORT = 53;
IPAddress apIP(192, 168, 4, 1);
String dispositivoId;

bool firebaseOK = false;
bool modoAP = false;
int intentosFallidosWifi = 0;
bool dedoPresente = false;

bool botonCrudoAnterior = HIGH;
bool botonEstable = HIGH;
unsigned long ultimoCambioBoton = 0;
unsigned long ultimoEnvioBoton = 0;

unsigned long inicioVentana = 0;
unsigned long ultimoSerial = 0;
unsigned long ultimaMuestraSpO2 = 0;
long ultimoLatido = 0;

float irDC = 0;
float redDC = 0;
float irAC = 0;
float redAC = 0;
uint16_t muestrasFiltro = 0;

double sumaBpm = 0;
uint16_t cantidadBpm = 0;
double sumaSpO2 = 0;
uint16_t cantidadSpO2 = 0;

int ultimoBpmValido = 0;
int ultimoSpO2Valido = 0;

// =========================================================================
// PORTAL DE CONFIGURACION WIFI
// =========================================================================
String paginaConfigWifi() {
  return R"HTML(
<!DOCTYPE html><html><head><meta charset='UTF-8'>
<meta name='viewport' content='width=device-width, initial-scale=1'>
<title>Configurar WiFi</title>
<style>
body{font-family:Arial;background:#111;color:#eee;text-align:center;padding:20px}
input{width:90%;padding:10px;margin:8px 0;border-radius:6px;border:none;font-size:16px}
button{width:95%;padding:12px;background:#00b894;color:#fff;border:none;border-radius:6px;font-size:16px;margin-top:10px}
</style></head><body>
<h2>Configurar WiFi del ESP32</h2>
<form action='/guardar' method='POST'>
  <input type='text' name='ssid' placeholder='Nombre de la red (SSID)' required><br>
  <input type='password' name='pass' placeholder='Contraseña'><br>
  <button type='submit'>Guardar y conectar</button>
</form>
<p>Después de guardar, el ESP32 se reiniciará e intentará conectarse.</p>
</body></html>
)HTML";
}

void manejarRaiz() {
  server.send(200, "text/html", paginaConfigWifi());
}

void manejarGuardar() {
  String ssid = server.arg("ssid");
  String pass = server.arg("pass");

  prefs.begin("wifi", false);
  prefs.putString("ssid", ssid);
  prefs.putString("pass", pass);
  prefs.end();

  server.send(200, "text/html",
    "<html><body style='font-family:Arial;text-align:center;padding:40px;background:#111;color:#eee'>"
    "<h2>Datos guardados</h2><p>Reiniciando e intentando conectar a: " + ssid + "</p></body></html>");

  delay(2500);
  ESP.restart();
}

void manejarNotFound() {
  server.sendHeader("Location", "/", true);
  server.send(302, "text/plain", "");
}

void iniciarModoAP() {
  modoAP = true;
  WiFi.disconnect(true);
  delay(200);
  WiFi.mode(WIFI_AP);
  delay(200);
  WiFi.softAP("ESP32-Config", "12345678");
  delay(200);
  WiFi.softAPConfig(apIP, apIP, IPAddress(255, 255, 255, 0));
  dnsServer.start(DNS_PORT, "*", apIP);

  server.on("/", manejarRaiz);
  server.on("/guardar", HTTP_POST, manejarGuardar);
  server.onNotFound(manejarNotFound);
  server.begin();

  Serial.println("Modo AP iniciado. Red: 'ESP32-Config' clave: 12345678 -> http://192.168.4.1");
}

bool conectarWiFiGuardado() {
  prefs.begin("wifi", true);
  String ssid = prefs.getString("ssid", "");
  String pass = prefs.getString("pass", "");
  prefs.end();

  if (ssid == "") {
    Serial.println("No hay credenciales guardadas todavia.");
    return false;
  }

  Serial.println("Conectando a: " + ssid);
  WiFi.mode(WIFI_STA);
  WiFi.disconnect(true);
  delay(300);
  WiFi.setSleep(false);
  WiFi.begin(ssid.c_str(), pass.c_str());

  const unsigned long inicioConexion = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - inicioConexion < 20000) {
    Serial.print('.');
    delay(500);
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Wi-Fi conectado. IP: ");
    Serial.println(WiFi.localIP());
    return true;
  }
  Serial.println("No se pudo conectar al Wi-Fi.");
  return false;
}

void reiniciarVentana() {
  inicioVentana = millis();
  sumaBpm = 0;
  cantidadBpm = 0;
  sumaSpO2 = 0;
  cantidadSpO2 = 0;
}

void reiniciarSensor() {
  dedoPresente = false;
  ultimoLatido = 0;
  irDC = redDC = irAC = redAC = 0;
  muestrasFiltro = 0;
  reiniciarVentana();
}

bool enviarLectura(int bpm, int spo2, const char* origen) {
  if (!firebaseOK || !Firebase.ready()) {
    Serial.println("Firebase no esta listo; lectura no enviada.");
    return false;
  }
  if (bpm < 25 || bpm > 240 || spo2 < 50 || spo2 > 100) {
    Serial.println("Lectura fuera de rango; se descarta para proteger la base.");
    return false;
  }

  FirebaseJson json;
  json.set("dispositivoId", dispositivoId);
  json.set("pulsaciones", bpm);
  json.set("spo2", spo2);
  json.set("origen", origen);
  json.set("versionFirmware", VERSION_FIRMWARE);
  // Firebase sustituye este marcador por la hora real del servidor.
  json.set("timestamp/.sv", "timestamp");

  if (Firebase.RTDB.pushJSON(&fbdo, "/lecturas", &json)) {
    Serial.printf("Enviado [%s] BPM=%d SpO2=%d%%\n", origen, bpm, spo2);
    ultimoBpmValido = bpm;
    ultimoSpO2Valido = spo2;
    return true;
  }

  Serial.print("Error Firebase: ");
  Serial.println(fbdo.errorReason());
  return false;
}

void procesarPulsador() {
  const bool lectura = digitalRead(BOTON_PIN);

  if (lectura != botonCrudoAnterior) {
    botonCrudoAnterior = lectura;
    ultimoCambioBoton = millis();
  }

  if (millis() - ultimoCambioBoton < REBOTE_BOTON_MS || lectura == botonEstable) return;
  botonEstable = lectura;

  if (botonEstable != LOW) return;
  if (ultimoEnvioBoton != 0 && millis() - ultimoEnvioBoton < BLOQUEO_BOTON_MS) return;
  ultimoEnvioBoton = millis();

  int bpm = ultimoBpmValido;
  int spo2 = ultimoSpO2Valido;
  if (cantidadBpm >= LATIDOS_MINIMOS && cantidadSpO2 >= 10) {
    bpm = round(sumaBpm / cantidadBpm);
    spo2 = round(sumaSpO2 / cantidadSpO2);
  }

  if (bpm == 0 || spo2 == 0) {
    Serial.println("Pulsador detectado, pero aun no existe una medicion estable.");
    return;
  }

  Serial.println("Pulsador presionado: envio inmediato de la ultima medicion estable.");
  enviarLectura(bpm, spo2, "PULSADOR");
}

void procesarSensor() {
  const long irValue = particleSensor.getIR();
  const long redValue = particleSensor.getRed();

  if (irValue <= UMBRAL_DEDO) {
    if (dedoPresente) Serial.println("Dedo retirado; ventana cancelada sin enviar ceros.");
    reiniciarSensor();
    return;
  }

  if (!dedoPresente) {
    dedoPresente = true;
    irDC = irValue;
    redDC = redValue;
    inicioVentana = millis();
    Serial.println("Dedo detectado; recopilando 30 segundos de muestras...");
  }

  irDC = (0.95f * irDC) + (0.05f * irValue);
  redDC = (0.95f * redDC) + (0.05f * redValue);
  const float irActual = fabsf(irValue - irDC);
  const float redActual = fabsf(redValue - redDC);
  irAC = (0.95f * irAC) + (0.05f * irActual);
  redAC = (0.95f * redAC) + (0.05f * redActual);
  if (muestrasFiltro < 65535) muestrasFiltro++;

  if (checkForBeat(irValue)) {
    const unsigned long ahora = millis();
    if (ultimoLatido > 0) {
      const float bpm = 60000.0f / (ahora - ultimoLatido);
      if (bpm >= 35 && bpm <= 220) {
        sumaBpm += bpm;
        cantidadBpm++;
      }
    }
    ultimoLatido = ahora;
  }

  if (muestrasFiltro >= MUESTRAS_CALENTAMIENTO && millis() - ultimaMuestraSpO2 >= INTERVALO_SPO2_MS) {
    ultimaMuestraSpO2 = millis();
    if (irDC > 0 && redDC > 0 && irAC > 0) {
      const float ratio = (redAC / redDC) / (irAC / irDC);
      const float spo2Calculado = 110.0f - (25.0f * ratio);
      if (isfinite(spo2Calculado) && spo2Calculado >= 70 && spo2Calculado <= 100) {
        sumaSpO2 += spo2Calculado;
        cantidadSpO2++;
      }
    }
  }

  if (millis() - ultimoSerial >= INTERVALO_SERIAL_MS) {
    ultimoSerial = millis();
    const int bpmParcial = cantidadBpm ? round(sumaBpm / cantidadBpm) : 0;
    const int spo2Parcial = cantidadSpO2 ? round(sumaSpO2 / cantidadSpO2) : 0;
    Serial.printf("Midiendo... BPM=%d (%u latidos), SpO2=%d%% (%u muestras)\n",
                  bpmParcial, cantidadBpm, spo2Parcial, cantidadSpO2);
  }

  if (millis() - inicioVentana < INTERVALO_ENVIO_MS) return;

  if (cantidadBpm >= LATIDOS_MINIMOS && cantidadSpO2 >= MUESTRAS_SPO2_MINIMAS) {
    const int bpmPromedio = round(sumaBpm / cantidadBpm);
    const int spo2Promedio = round(sumaSpO2 / cantidadSpO2);
    enviarLectura(bpmPromedio, spo2Promedio, "MAX30102");
  } else {
    Serial.println("Ventana inestable o insuficiente; no se envia nada a Firebase.");
  }

  reiniciarVentana();
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  char sufijoDispositivo[7];
  snprintf(sufijoDispositivo, sizeof(sufijoDispositivo), "%06llX", ESP.getEfuseMac() & 0xFFFFFFULL);
  dispositivoId = "ESP32-" + String(sufijoDispositivo);
  Serial.println("\n--- KAIROS ESP32 / MAX30102 v" VERSION_FIRMWARE " (con portal WiFi) ---");
  Serial.print("Codigo para vincular este equipo: ");
  Serial.println(dispositivoId);

  pinMode(BOTON_PIN, INPUT_PULLUP);
  Wire.begin(SDA_PIN, SCL_PIN);

  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("No se encontro el MAX30102. Revisa SDA, SCL, 3.3V y GND.");
    // Se continúa para que el portal Wi-Fi siga disponible y el error
    // pueda revisarse en el monitor serie.
  } else {
    particleSensor.setup();
    particleSensor.setPulseAmplitudeRed(0x0A);
    particleSensor.setPulseAmplitudeIR(0x0A);
    particleSensor.setPulseAmplitudeGreen(0);
  }
  reiniciarSensor();

  if (!CONFIGURACION_EXTERNA_OK) {
    Serial.println("CONFIGURACION PENDIENTE: agrega secrets.h con los datos de Firebase.");
    return;
  }

  if (!conectarWiFiGuardado()) {
    iniciarModoAP();
    return;
  }

  config.api_key = FIREBASE_API_KEY;
  config.database_url = FIREBASE_DATABASE_URL;
  config.token_status_callback = tokenStatusCallback;

  if (Firebase.signUp(&config, &auth, "", "")) {
    firebaseOK = true;
    Serial.println("Autenticacion anonima Firebase correcta.");
  } else {
    Serial.print("Error autenticando Firebase: ");
    Serial.println(config.signer.signupError.message.c_str());
  }

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  if (modoAP) {
    dnsServer.processNextRequest();
    server.handleClient();
    return;
  }

  if (WiFi.status() != WL_CONNECTED) {
    intentosFallidosWifi++;
    int espera = min(5 + (intentosFallidosWifi * 5), 30);
    Serial.println("Se perdio la conexion WiFi. Reintentando en " + String(espera) + "s...");
    delay(espera * 1000);
    if (!conectarWiFiGuardado()) return;
    intentosFallidosWifi = 0;
  }

  procesarPulsador();
  procesarSensor();
}
