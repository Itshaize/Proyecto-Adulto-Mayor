# Plan de trabajo individual — Mauricio

## Módulo asignado

**Panel del adulto mayor**

## Objetivo

Construir una interfaz muy sencilla, accesible y responsive para que el adulto mayor pueda ver sus medicamentos, confirmar una toma desde la aplicación, consultar su salud e historial, recibir notificaciones y llamar directamente a su hijo.

Mauricio debe priorizar facilidad de uso, letras grandes y pocas acciones.


# Contrato técnico obligatorio para los tres integrantes

> Este bloque debe respetarse sin cambiar nombres. La finalidad es que los módulos se integren sin tener que renombrar variables, rutas o colecciones al final.

## 1. Tecnologías oficiales

### Frontend
- **Angular**
- TypeScript
- HTML
- SCSS
- Angular Router
- Reactive Forms
- HttpClient
- Diseño responsive, primero para teléfono y compatible con computadora
- Angular Material puede utilizarse para íconos, diálogos y controles, sin alterar el diseño acordado

### Backend
- **Node.js**
- Express
- JavaScript o TypeScript, pero todo el equipo debe utilizar la misma opción
- JWT para sesión de la aplicación web
- bcrypt para proteger contraseñas
- cors
- dotenv
- express-validator
- Mongoose

### Base de datos
- **MongoDB**
- MongoDB Atlas o una instancia local durante el desarrollo
- Mongoose para modelos, validaciones y consultas

### Integración IoT y notificaciones
- ESP32
- MAX30102
- Pulsador físico
- Firebase Realtime Database
- Firebase Admin SDK en Node.js
- Firebase Cloud Messaging para notificaciones, si el tiempo lo permite

## 2. Nombre provisional del sistema

**Sistema de Monitoreo de Salud y Medicación**

No cambiar este nombre en carpetas, documentación o títulos hasta que el grupo decida el nombre definitivo.

## 3. Roles oficiales

Usar exactamente estos valores:

```ts
export type RolUsuario =
  | 'HIJO_ADMIN'
  | 'ADULTO_MAYOR'
  | 'TECNICO';
```

## 4. Estados oficiales

### Medicación

```ts
export type EstadoToma =
  | 'PENDIENTE'
  | 'TOMADA'
  | 'OMITIDA';
```

### Método de confirmación

```ts
export type MetodoConfirmacion =
  | 'PULSADOR'
  | 'APP'
  | 'ADMIN';
```

### Estado del dispositivo

```ts
export type EstadoDispositivo =
  | 'CONECTADO'
  | 'DESCONECTADO'
  | 'ERROR';
```

### Estado general de salud

```ts
export type EstadoSalud =
  | 'NORMAL'
  | 'REVISAR'
  | 'ALERTA';
```

## 5. Nombres oficiales de colecciones en MongoDB

Usar exactamente estos nombres:

- `usuarios`
- `pacientes`
- `medicamentos`
- `tomas_medicamentos`
- `mediciones`
- `alertas`
- `dispositivos`

## 6. Modelos compartidos

### Usuario

```json
{
  "_id": "ObjectId",
  "nombre": "Ismael",
  "correo": "correo@ejemplo.com",
  "passwordHash": "hash",
  "rol": "HIJO_ADMIN",
  "telefono": "+593999999999",
  "activo": true,
  "createdAt": "2026-07-21T00:00:00.000Z",
  "updatedAt": "2026-07-21T00:00:00.000Z"
}
```

### Paciente

```json
{
  "_id": "ObjectId",
  "nombre": "Carlos",
  "edad": 78,
  "fechaNacimiento": "1948-05-10",
  "diagnosticos": ["Hipertensión"],
  "telefonoContacto": "+593999999999",
  "hijoAdminId": "ObjectId",
  "usuarioAdultoId": "ObjectId",
  "dispositivoId": "ESP32-001",
  "activo": true
}
```

### Medicamento

```json
{
  "_id": "ObjectId",
  "pacienteId": "ObjectId",
  "nombre": "Losartán",
  "concentracion": "50 mg",
  "dosis": "1 tableta",
  "horarios": ["08:00"],
  "frecuencia": "DIARIA",
  "indicaciones": "Tomar después del desayuno",
  "activo": true
}
```

### Toma de medicamento

```json
{
  "_id": "ObjectId",
  "pacienteId": "ObjectId",
  "medicamentoId": "ObjectId",
  "fechaProgramada": "2026-07-21",
  "horaProgramada": "08:00",
  "estado": "TOMADA",
  "metodoConfirmacion": "PULSADOR",
  "fechaHoraConfirmacion": "2026-07-21T08:03:00.000Z",
  "observacion": ""
}
```

### Medición

```json
{
  "_id": "ObjectId",
  "pacienteId": "ObjectId",
  "dispositivoId": "ESP32-001",
  "pulsaciones": 72,
  "spo2": 96,
  "estadoSalud": "NORMAL",
  "fechaHora": "2026-07-21T08:05:00.000Z"
}
```

### Alerta

```json
{
  "_id": "ObjectId",
  "pacienteId": "ObjectId",
  "tipo": "MEDICAMENTO_NO_CONFIRMADO",
  "titulo": "Medicamento pendiente",
  "mensaje": "Losartán 50 mg no ha sido confirmado",
  "nivel": "ADVERTENCIA",
  "leida": false,
  "fechaHora": "2026-07-21T08:20:00.000Z"
}
```

### Dispositivo

```json
{
  "_id": "ObjectId",
  "dispositivoId": "ESP32-001",
  "pacienteId": "ObjectId",
  "estado": "CONECTADO",
  "ultimaConexion": "2026-07-21T08:05:00.000Z",
  "versionFirmware": "1.0.0"
}
```

## 7. Contrato de respuesta de la API

Todas las respuestas exitosas deben utilizar:

```json
{
  "ok": true,
  "mensaje": "Operación realizada correctamente",
  "data": {}
}
```

Todas las respuestas de error deben utilizar:

```json
{
  "ok": false,
  "mensaje": "Descripción clara del error",
  "errores": []
}
```

## 8. Rutas base oficiales

```text
/api/auth
/api/pacientes
/api/medicamentos
/api/tomas
/api/mediciones
/api/alertas
/api/dispositivos
```

## 9. Rutas de Angular

```text
/login
/admin/inicio
/admin/paciente
/admin/medicamentos
/admin/historial
/admin/alertas
/adulto/inicio
/adulto/medicinas
/adulto/salud
/adulto/ayuda
/pruebas/dispositivo
```

## 10. Nombres de servicios de Angular

No crear servicios con nombres alternativos.

```text
AuthService
PacienteService
MedicamentoService
TomaService
MedicionService
AlertaService
DispositivoService
NotificacionService
```

## 11. Criterio visual compartido

### Colores

```scss
$color-primary: #0f8fa5;
$color-secondary: #2684d8;
$color-success: #2eae73;
$color-warning: #f4a62a;
$color-danger: #e45252;
$color-background: #f5f8fb;
$color-surface: #ffffff;
$color-text: #17345b;
$color-text-muted: #6c7a90;
$color-border: #e4ebf2;
```

### Reglas visuales
- Fondo general claro.
- Tarjetas blancas.
- Bordes redondeados de `16px`.
- Sombras suaves.
- Tipografía legible: Inter, Roboto o Arial.
- No usar azul rey oscuro como color dominante.
- Verde únicamente para estados correctos.
- Naranja para pendientes.
- Rojo para alertas reales.
- Mantener los mismos íconos y nombres en ambas interfaces.
- En celular, botones con altura mínima de `48px`.
- En el panel del adulto mayor, botones principales de mínimo `56px`.
- Diseño mobile-first.
- Breakpoint principal: `768px`.
- Breakpoint de escritorio: `1200px`.

## 12. Variables de entorno

### Backend `.env`

```env
PORT=3000
MONGODB_URI=mongodb+srv://USUARIO:CLAVE@cluster.mongodb.net/salud_medicacion
JWT_SECRET=cambiar_esta_clave
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

### Angular `environment.ts`

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  firebase: {
    apiKey: '',
    authDomain: '',
    databaseURL: '',
    projectId: '',
    messagingSenderId: '',
    appId: ''
  }
};
```

## 13. Reglas de Git

- Rama principal: `main`
- Rama de integración: `develop`
- Ramas personales:
  - `feature/ismael-admin`
  - `feature/mauricio-adulto`
  - `feature/juan-dispositivo`
- No subir archivos `.env`.
- No subir `node_modules`.
- Cada integrante debe hacer commits pequeños y claros.
- Antes de integrar, ejecutar el proyecto y corregir errores.
- No cambiar modelos o endpoints sin avisar al grupo.

## 14. Datos de prueba compartidos

Usar durante el desarrollo:

```text
Paciente: Carlos Pérez
Edad: 78
Dispositivo: ESP32-001
Hijo: Daniel Pérez
Teléfono del hijo: +593999999999
```

Medicamentos:

```json
[
  {
    "nombre": "Losartán",
    "concentracion": "50 mg",
    "dosis": "1 tableta",
    "horarios": ["08:00"]
  },
  {
    "nombre": "Metformina",
    "concentracion": "850 mg",
    "dosis": "1 tableta",
    "horarios": ["13:00"]
  },
  {
    "nombre": "Atorvastatina",
    "concentracion": "20 mg",
    "dosis": "1 tableta",
    "horarios": ["22:00"]
  }
]
```

## 15. Regla de integración más importante

El frontend nunca debe conectarse directamente a MongoDB.

La comunicación correcta es:

```text
Angular → API Node.js/Express → MongoDB
ESP32 → Firebase Realtime Database → Node.js → MongoDB
Node.js/Firebase Cloud Messaging → notificación al usuario
```


# Trabajo específico de Mauricio

## 1. Estructura Angular que debe crear

```text
src/app/features/adulto/
├── adulto.routes.ts
├── layout/
│   ├── adulto-layout.component.ts
│   ├── adulto-layout.component.html
│   └── adulto-layout.component.scss
├── pages/
│   ├── inicio-adulto/
│   ├── medicinas-adulto/
│   ├── salud-adulto/
│   └── ayuda-adulto/
└── components/
    ├── saludo-adulto/
    ├── proxima-pastilla/
    ├── lista-medicamentos-hoy/
    ├── salud-actual/
    ├── grafico-pulsaciones-simple/
    ├── grafico-spo2-simple/
    ├── recordatorios/
    ├── boton-llamar-hijo/
    └── boton-confirmar-toma/
```

## 2. Pantallas obligatorias

### 2.1 Inicio del adulto mayor

Ruta:

```text
/adulto/inicio
```

Debe mostrar únicamente:

- Saludo: `Hola, Papá`.
- Estado general: `Todo en orden`, `Debe revisar` o `Necesita ayuda`.
- Próxima pastilla.
- Medicamentos de hoy.
- Oxígeno actual.
- Pulsaciones actuales.
- Pulsaciones recientes.
- Recordatorios.
- Botón grande `Llamar a mi hijo`.

No agregar formularios administrativos.

### 2.2 Medicinas

Ruta:

```text
/adulto/medicinas
```

Debe mostrar:

- Próxima pastilla.
- Lista de medicamentos del día.
- Estado `PENDIENTE`, `TOMADA` u `OMITIDA`.
- Botón `Ya tomé mi pastilla`.
- Historial simple de los últimos siete días.

Cada medicamento debe mostrarse como tarjeta, no como tabla.

### 2.3 Salud

Ruta:

```text
/adulto/salud
```

Debe mostrar:

- Última medición.
- Pulsaciones.
- SpO₂.
- Estado sencillo: `Normal`, `Revisar` o `Alerta`.
- Historial de pulsaciones.
- Historial de oxígeno.
- Selector simple: `Hoy` o `7 días`.

No mostrar términos médicos complejos.

### 2.4 Ayuda

Ruta:

```text
/adulto/ayuda
```

Debe incluir:

- Botón grande `Llamar a mi hijo`.
- Número del hijo.
- Texto simple para explicar el pulsador.
- Instrucciones:
  1. Tome la pastilla.
  2. Presione el pulsador.
  3. Espere el mensaje de confirmación.
- Botón opcional `Volver al inicio`.

## 3. Botón para llamar al hijo

```html
<a
  class="boton-llamar"
  [href]="'tel:' + telefonoHijo">
  Llamar a mi hijo
</a>
```

Requisitos:

- Visible en Inicio y Ayuda.
- Ocupar todo el ancho en teléfono.
- Tener ícono de teléfono.
- No requiere API externa.
- En computadora mostrar el número y una indicación para llamar desde el celular.

## 4. Confirmación desde la aplicación

Botón:

```text
Ya tomé mi pastilla
```

Flujo:

1. El usuario pulsa el botón.
2. Angular muestra una confirmación sencilla.
3. Se envía la toma con método `APP`.
4. Node.js actualiza MongoDB.
5. La tarjeta cambia a `TOMADA`.
6. El panel del hijo ve el cambio.

Payload:

```json
{
  "metodoConfirmacion": "APP"
}
```

Endpoint:

```http
PATCH /api/tomas/:id/confirmar
```

## 5. Servicios que debe consumir

```text
PacienteService
MedicamentoService
TomaService
MedicionService
NotificacionService
```

Métodos esperados:

```ts
obtenerInicioAdulto(pacienteId: string)
obtenerMedicamentosHoy(pacienteId: string)
confirmarToma(tomaId: string)
obtenerSaludActual(pacienteId: string)
obtenerHistorialSalud(pacienteId: string, dias: number)
```

## 6. Endpoints que necesita

```http
GET   /api/pacientes/:id/resumen-adulto
GET   /api/medicamentos/paciente/:pacienteId/hoy
GET   /api/tomas/paciente/:pacienteId/hoy
GET   /api/tomas/paciente/:pacienteId?dias=7
PATCH /api/tomas/:id/confirmar
GET   /api/mediciones/paciente/:pacienteId/ultima
GET   /api/mediciones/paciente/:pacienteId?dias=7
GET   /api/alertas/paciente/:pacienteId?soloNoLeidas=true
```

## 7. Trabajo backend asignado a Mauricio

Mauricio implementará:

```text
tomas de medicamentos
consultas simplificadas para el adulto mayor
```

Archivos sugeridos:

```text
backend/src/
├── controllers/
│   ├── toma.controller.js
│   └── adulto.controller.js
├── routes/
│   ├── toma.routes.js
│   └── adulto.routes.js
└── models/
    └── TomaMedicamento.js
```

## 8. Modelo TypeScript principal

```ts
export interface TomaMedicamento {
  _id: string;
  pacienteId: string;
  medicamentoId: string;
  fechaProgramada: string;
  horaProgramada: string;
  estado: 'PENDIENTE' | 'TOMADA' | 'OMITIDA';
  metodoConfirmacion: 'PULSADOR' | 'APP' | 'ADMIN';
  fechaHoraConfirmacion?: string;
  observacion?: string;
}
```

## 9. Reglas de accesibilidad

- Texto normal mínimo: `18px`.
- Títulos principales: `24px` a `30px`.
- Botones mínimos: `56px` de alto.
- No colocar más de cuatro botones principales por pantalla.
- No depender únicamente del color.
- Acompañar estados con texto e ícono.
- Evitar párrafos largos.
- Mantener alto contraste.
- Usar mensajes concretos.

## 10. Notificaciones

Mensajes:

```text
Es hora de tomar Losartán 50 mg.
Su pastilla fue registrada.
No se ha confirmado la pastilla de las 08:00.
Su medición fue guardada.
```

Si Juan configura Firebase Cloud Messaging, Mauricio integrará la recepción en Angular.

Crear:

```text
NotificacionService
```

Responsabilidades:

- Solicitar permiso.
- Recibir token.
- Mostrar mensajes.
- Redirigir a Medicinas cuando corresponda.

## 11. Diseño obligatorio

- Cabecera sencilla.
- Menú inferior en teléfono.
- Menú lateral corto en computadora.
- Tarjetas grandes.
- Próxima pastilla como elemento principal.
- Botón `Llamar a mi hijo` muy visible.
- Gráficos simples.
- No usar tablas.
- Máximo cuatro opciones:
  - Inicio.
  - Medicinas.
  - Salud.
  - Ayuda.

## 12. Pruebas que debe realizar

1. Abrir la aplicación en pantalla pequeña.
2. Confirmar una toma desde la aplicación.
3. Comprobar que Ismael ve la toma.
4. Pulsar `Llamar a mi hijo` desde un teléfono.
5. Ver historial de siete días.
6. Recibir una medición simulada de Juan.

## 13. Orden recomendado de trabajo

1. Crear layout y rutas.
2. Crear componentes con datos simulados.
3. Crear servicios.
4. Conectar medicamentos y tomas.
5. Crear botón de llamada.
6. Conectar mediciones.
7. Integrar notificaciones.
8. Revisar accesibilidad.
9. Probar con Ismael y Juan.

## 14. Entregables de Mauricio

- Panel responsive del adulto mayor.
- Próxima pastilla.
- Medicamentos de hoy.
- Confirmación mediante la aplicación.
- Salud actual.
- Historial de pulsaciones y SpO₂.
- Botón de llamada.
- Pantalla de ayuda.
- Controladores Node.js de tomas y resumen.
- README breve.

## 15. Criterio de terminado

El adulto mayor puede:

- Ver qué pastilla debe tomar.
- Saber la hora.
- Ver si está pendiente o tomada.
- Confirmarla desde la aplicación.
- Ver pulsaciones y oxígeno.
- Consultar un historial simple.
- Recibir recordatorios.
- Llamar a su hijo.
