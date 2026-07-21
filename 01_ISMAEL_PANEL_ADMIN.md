# Plan de trabajo individual — Ismael

## Módulo asignado

**Panel del hijo o administrador**

## Objetivo

Construir el módulo principal de administración que utilizará el hijo para registrar al adulto mayor, gestionar medicamentos, revisar mediciones, consultar historiales y atender alertas.

Ismael será responsable del módulo con mayor cantidad de operaciones administrativas y formularios.


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


# Trabajo específico de Ismael

## 1. Estructura Angular que debe crear

```text
src/app/features/admin/
├── admin.routes.ts
├── layout/
│   ├── admin-layout.component.ts
│   ├── admin-layout.component.html
│   └── admin-layout.component.scss
├── pages/
│   ├── inicio-admin/
│   ├── paciente-admin/
│   ├── medicamentos-admin/
│   ├── medicamento-form/
│   ├── historial-admin/
│   ├── alertas-admin/
│   └── configuracion-admin/
└── components/
    ├── resumen-salud/
    ├── tarjeta-paciente/
    ├── tabla-medicamentos/
    ├── grafico-pulsaciones/
    ├── grafico-spo2/
    ├── historial-medicacion/
    └── lista-alertas/
```

## 2. Pantallas obligatorias

### 2.1 Inicio del administrador

Ruta:

```text
/admin/inicio
```

Debe mostrar:

- Oxígeno actual.
- Pulsaciones actuales.
- Pastillas tomadas hoy.
- Pastillas pendientes.
- Última conexión del ESP32.
- Tarjeta resumida del adulto mayor.
- Medicamentos de hoy.
- Gráfico de pulsaciones.
- Gráfico de SpO₂.
- Alertas recientes.

### 2.2 Administración del paciente

Ruta:

```text
/admin/paciente
```

Debe permitir:

- Ver datos del adulto mayor.
- Editar nombre.
- Editar edad y fecha de nacimiento.
- Editar diagnósticos.
- Editar teléfono de contacto.
- Asociar el dispositivo `ESP32-001`.
- Activar o desactivar al paciente.

Formulario Angular:

```ts
this.pacienteForm = this.fb.group({
  nombre: ['', Validators.required],
  edad: [null, [Validators.required, Validators.min(1)]],
  fechaNacimiento: ['', Validators.required],
  diagnosticos: [[]],
  telefonoContacto: ['', Validators.required],
  dispositivoId: ['ESP32-001', Validators.required],
  activo: [true]
});
```

### 2.3 Administración de medicamentos

Ruta:

```text
/admin/medicamentos
```

Funciones:

- Listar medicamentos.
- Crear medicamento.
- Editar medicamento.
- Desactivar medicamento.
- Eliminar únicamente cuando no tenga historial.
- Buscar por nombre.
- Filtrar activos e inactivos.

Formulario:

```ts
this.medicamentoForm = this.fb.group({
  pacienteId: ['', Validators.required],
  nombre: ['', Validators.required],
  concentracion: ['', Validators.required],
  dosis: ['', Validators.required],
  horarios: [[], Validators.required],
  frecuencia: ['DIARIA', Validators.required],
  indicaciones: [''],
  activo: [true]
});
```

### 2.4 Historial

Ruta:

```text
/admin/historial
```

Debe incluir dos pestañas:

1. Historial de medicamentos.
2. Historial de salud.

Filtros:

- Fecha inicial.
- Fecha final.
- Estado de toma.
- Medicamento.
- Tipo de medición.

Columnas para medicamentos:

```text
Fecha | Hora programada | Medicamento | Dosis | Estado | Método | Hora confirmada
```

Columnas para mediciones:

```text
Fecha y hora | Pulsaciones | SpO₂ | Estado de salud | Dispositivo
```

### 2.5 Alertas

Ruta:

```text
/admin/alertas
```

Debe mostrar:

- Medicamento no confirmado.
- SpO₂ baja.
- Pulsaciones fuera del rango.
- Dispositivo desconectado.
- Última conexión inusual.

Acciones:

- Marcar como leída.
- Filtrar leídas y no leídas.
- Abrir detalle.
- Ver a qué paciente corresponde.

## 3. Servicios que debe consumir

Ismael debe usar estos servicios compartidos:

```text
PacienteService
MedicamentoService
TomaService
MedicionService
AlertaService
DispositivoService
```

Ejemplo:

```ts
getResumenPaciente(pacienteId: string) {
  return this.http.get<ApiResponse<ResumenAdmin>>(
    `${environment.apiUrl}/pacientes/${pacienteId}/resumen`
  );
}
```

## 4. Endpoints que necesita

### Paciente

```http
GET    /api/pacientes/:id
POST   /api/pacientes
PUT    /api/pacientes/:id
GET    /api/pacientes/:id/resumen
```

### Medicamentos

```http
GET    /api/medicamentos/paciente/:pacienteId
POST   /api/medicamentos
PUT    /api/medicamentos/:id
PATCH  /api/medicamentos/:id/estado
DELETE /api/medicamentos/:id
```

### Tomas

```http
GET /api/tomas/paciente/:pacienteId
GET /api/tomas/paciente/:pacienteId/hoy
GET /api/tomas/paciente/:pacienteId/resumen
```

### Mediciones

```http
GET /api/mediciones/paciente/:pacienteId
GET /api/mediciones/paciente/:pacienteId/ultima
GET /api/mediciones/paciente/:pacienteId/resumen
```

### Alertas

```http
GET   /api/alertas/paciente/:pacienteId
PATCH /api/alertas/:id/leida
```

### Dispositivo

```http
GET /api/dispositivos/:dispositivoId/estado
```

## 5. Trabajo backend asignado a Ismael

Ismael implementará los controladores administrativos de:

```text
pacientes
medicamentos
alertas
```

Archivos sugeridos:

```text
backend/src/
├── controllers/
│   ├── paciente.controller.js
│   ├── medicamento.controller.js
│   └── alerta.controller.js
├── routes/
│   ├── paciente.routes.js
│   ├── medicamento.routes.js
│   └── alerta.routes.js
└── models/
    ├── Paciente.js
    ├── Medicamento.js
    └── Alerta.js
```

No debe desarrollar la lectura del ESP32. Esa tarea corresponde a Juan.

## 6. Modelos TypeScript que debe crear

```ts
export interface Paciente {
  _id: string;
  nombre: string;
  edad: number;
  fechaNacimiento: string;
  diagnosticos: string[];
  telefonoContacto: string;
  hijoAdminId: string;
  usuarioAdultoId: string;
  dispositivoId: string;
  activo: boolean;
}

export interface Medicamento {
  _id: string;
  pacienteId: string;
  nombre: string;
  concentracion: string;
  dosis: string;
  horarios: string[];
  frecuencia: string;
  indicaciones: string;
  activo: boolean;
}
```

## 7. Diseño obligatorio

Debe reproducir el criterio visual del mockup administrativo:

- Barra lateral en computadora.
- Navegación inferior en teléfono.
- Tarjetas de resumen.
- Tablas únicamente en escritorio.
- En teléfono, las tablas se convierten en tarjetas.
- Botón principal: `Agregar medicamento`.
- Alertas ordenadas por gravedad y fecha.
- Gráficos sencillos y legibles.
- No saturar con demasiados datos en una sola pantalla.

## 8. Validaciones mínimas

- No guardar un medicamento sin nombre, dosis y horario.
- No admitir horarios repetidos.
- No permitir edad menor a 1.
- No permitir un dispositivo vacío.
- Mostrar mensajes de error devueltos por Node.js.
- Desactivar el botón de guardar mientras se procesa la solicitud.

## 9. Pruebas que debe realizar

1. Crear un medicamento y comprobar que aparece en el listado.
2. Editar el horario y comprobar que MongoDB conserva el cambio.
3. Abrir el panel con pantalla de teléfono.
4. Mostrar mediciones simuladas entregadas por Juan.
5. Marcar una alerta como leída.

## 10. Orden recomendado de trabajo

1. Crear layout y rutas.
2. Crear modelos TypeScript.
3. Crear servicios.
4. Diseñar dashboard con datos simulados.
5. Crear formularios.
6. Conectar paciente y medicamentos con Node.js.
7. Conectar mediciones, tomas y alertas.
8. Revisar responsive.
9. Probar integración con Juan y Mauricio.

## 11. Entregables de Ismael

- Panel administrativo responsive.
- CRUD del paciente.
- CRUD de medicamentos.
- Historial de medicación.
- Historial de pulsaciones y SpO₂.
- Alertas.
- Controladores Node.js de paciente, medicamentos y alertas.
- Validaciones.
- README breve con pasos para ejecutar su módulo.

## 12. Criterio de terminado

El trabajo se considera terminado cuando el hijo puede:

- Iniciar sesión.
- Ver el estado actual del padre.
- Crear y modificar medicamentos.
- Consultar el historial.
- Ver mediciones del MAX30102.
- Revisar alertas.
- Ver si el dispositivo está conectado.
