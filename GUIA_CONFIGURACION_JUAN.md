# 🚀 Guía Definitiva de Configuración (Rama Juan)

Esta guía explica cómo levantar el proyecto de forma distribuida: **El hardware (ESP32) estará físicamente en la computadora de Juan**, mientras que **el Backend y Frontend pueden correr en otra computadora**. Ambos se comunican en tiempo real mediante **Firebase**.

---

## 🏗️ 1. Configuración del Backend (Para quien corre el servidor)

El Backend ahora está **totalmente desvinculado del puerto USB local**. Únicamente escucha eventos de Firebase para guardarlos en MongoDB.

### Pasos:
1. **Instalar dependencias:**
   Abre una terminal en la carpeta `backend` y ejecuta:
   ```bash
   npm install
   ```

2. **Archivo `.env`:**
   Copia el archivo `.env.example` y renómbralo a `.env`.

3. **La Clave de Firebase (`firebase-clave.json`):**
   - Juan debe pasarte el archivo secreto llamado `firebase-clave.json`.
   - Guarda este archivo en algún lugar seguro de tu computadora.
   - Abre tu nuevo archivo `.env` y busca la línea que dice `GOOGLE_APPLICATION_CREDENTIALS`. 
   - Pon la ruta **exacta** de tu computadora hacia ese archivo. Ejemplo en Windows:
     ```env
     GOOGLE_APPLICATION_CREDENTIALS="C:\\Users\\TuUsuario\\Escritorio\\firebase-clave.json"
     ```

4. **Arrancar el Backend:**
   ```bash
   npm run dev
   ```
   *Deberías ver en la consola un mensaje confirmando que se conectó a MongoDB y que está "Escuchando nuevas lecturas en /lecturas" de Firebase.*

---

## 🎨 2. Configuración del Frontend

El Frontend se conecta tanto al Backend (para el historial) como a Firebase (para gráficas en tiempo real).

### Pasos:
1. Abre una nueva terminal en la carpeta `frontend`.
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Ejecuta el servidor de Angular:
   ```bash
   npm start
   ```
4. Abre `http://localhost:4200` en tu navegador.

---

## 🔌 3. Configuración del Hardware (Solo para Juan)

Juan es quien tiene el prototipo físico (ESP32). **No necesita correr el Backend localmente**, solo necesita su script puente.

### Pasos para Juan:
1. **No abras el Monitor Serie del Arduino IDE.** (Si lo abres, bloquearás el puerto USB).
2. Abre una terminal en tu computadora (donde tienes guardada la carpeta `script_firebase` en tu escritorio).
3. Entra a la carpeta y corre el script:
   ```bash
   cd C:\Users\ASUS\OneDrive\Escritorio\script_firebase
   npm start
   ```
4. Cuando el script diga que está escuchando, pon tu dedo en el sensor MAX30102.
5. El script leerá los datos por el cable USB y los enviará **directamente a Firebase**.

---

## ✨ ¿Cómo probar que todo funciona junto?

1. El compañero arranca el **Backend** y el **Frontend** en su PC.
2. Juan arranca el **script_firebase** en su PC y pone el dedo en el sensor.
3. El script de Juan envía el pulso a Firebase.
4. El Backend del compañero detecta el cambio en Firebase, descarga el dato, y lo guarda en su MongoDB local.
5. El Frontend del compañero detecta el cambio y actualiza las gráficas en vivo en la pantalla.

¡Listo! Así logran una integración real en la Nube (IoT).
