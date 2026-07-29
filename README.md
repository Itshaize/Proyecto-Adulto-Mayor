# Sistema de Monitoreo de Salud y Medicación

Aplicación responsive para el hijo administrador y el adulto mayor, construida con Angular, Node.js, Express y MongoDB. Incluye sesión JWT por roles, registro de hasta dos adultos por administrador, creación de credenciales con correo, seguimiento del paciente, CRUD de medicamentos, carga de recetas completas, confirmación de tomas, historiales exportables a Excel/PDF, mediciones del MAX30102, alertas y estado del ESP32.

## Inicio rápido

Requisitos: Node.js 22 o superior y npm.

```bash
npm run install:all
npm run dev
```

Abre `http://localhost:4200` e ingresa con uno de los dos perfiles:

En desarrollo, Angular usa `http://127.0.0.1:3000/api`. Para producción, el
paquete de Hostinger se genera con la URL HTTPS pública de AWS:

```bash
npm run prepare:hostinger -- --api=https://DOMINIO_API/api
```

```text
Administrador: daniel@salud.ec / Admin123
Adulto mayor: carlos@salud.ec / Admin123
```

También puedes abrir `/registro` para crear una cuenta nueva de administrador. La sesión se inicia automáticamente al terminar el registro.

Si `MONGODB_URI` no está definido, la API arranca automáticamente en modo demostración con datos temporales. Todas las operaciones siguen pasando por `Angular → Express`; el frontend nunca accede directamente a MongoDB.

> En carpetas sincronizadas con OneDrive la primera instalación de Angular puede tardar varios minutos por la cantidad de archivos. Las instalaciones posteriores usan el lock generado.

## MongoDB Atlas o local

1. Copia `backend/.env.example` como `backend/.env`.
2. Completa `MONGODB_URI` y cambia `JWT_SECRET`.
3. Carga datos iniciales con `npm run seed --prefix backend`.
4. Inicia ambos servicios con `npm run dev`.

La semilla usa `upsert`: puede ejecutarse nuevamente sin duplicar el paciente ni los medicamentos.

## Comandos

```bash
npm run dev          # API en :3000 y Angular en :4200
npm run build        # build Angular de producción
npm run prepare:hostinger -- --api=https://DOMINIO_API/api # paquete public_html
npm test             # pruebas HTTP del backend
npm run test:mongodb --prefix backend # integración real en una base aislada
npm run verify       # pruebas backend + build frontend
npm run visual:check # capturas headless; requiere Chrome y API activa
```

El backend también sirve el build ubicado en `frontend/dist` desde `http://localhost:3000`, incluyendo fallback para refrescar rutas Angular.

## Backend en AWS y frontend en Hostinger

Sigue [DESPLIEGUE_HOSTINGER_AWS.md](./DESPLIEGUE_HOSTINGER_AWS.md). Las
instrucciones se separan entre
[el encargado de AWS](./deploy/aws/README_AMIGO_AWS.md) y
[el encargado de Hostinger](./deploy/hostinger/README_HOSTINGER.md).
La alternativa donde el frontend también se instala en una VM se conserva en
[deploy/frontend-vm](./deploy/frontend-vm/README.md).

## Rutas implementadas

- `/login`
- `/registro`
- `/admin/inicio`
- `/admin/paciente`
- `/admin/medicamentos`
- `/admin/historial`
- `/admin/alertas`
- `/admin/configuracion`
- `/adulto/inicio`
- `/adulto/medicinas`
- `/adulto/salud`
- `/adulto/ayuda`
- `/adulto/receta`

Cada rol está protegido por guardas de ruta. La navegación es lateral desde `768px` y se convierte en barra inferior en teléfono; las tablas de administración se convierten en tarjetas móviles y la vista del adulto usa controles grandes y lectura simplificada.

Al registrar un adulto desde `/admin/paciente`, el administrador define su correo y una contraseña temporal. El backend crea simultáneamente la cuenta `ADULTO_MAYOR`, la enlaza con la ficha del paciente y rechaza un tercer adulto o un correo repetido.

## API

Todas las respuestas usan el contrato `{ ok, mensaje, data }` o `{ ok, mensaje, errores }`.

La documentación interactiva completa está en `http://localhost:3000/api-docs`. Desde allí la profesora puede revisar los endpoints por módulo, ver ejemplos, descargar la especificación OpenAPI desde `/api-docs.json` y autorizar las rutas protegidas con un token JWT.

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET|POST|PUT /api/pacientes`
- `GET|POST|PUT|PATCH|DELETE /api/medicamentos`
- `POST /api/medicamentos/receta` para guardar varios medicamentos juntos
- `GET /api/tomas/paciente/:pacienteId`
- `GET /api/tomas/paciente/:pacienteId/hoy`
- `PATCH /api/tomas/:id/confirmar`
- `GET /api/pacientes/:id/resumen-adulto`
- `GET /api/pacientes/:id/exportar?formato=xlsx|pdf&seccion=todas|medicacion|salud`
- `GET /api/mediciones/paciente/:pacienteId`
- `GET|PATCH /api/alertas`
- `GET /api/dispositivos/:dispositivoId/estado`
- `GET /api/integraciones/firebase/estado`

Los endpoints administrativos requieren `Authorization: Bearer <JWT>`. Las validaciones impiden edad menor a 1, dispositivo vacío, medicamentos incompletos, horarios repetidos y eliminación de medicamentos con historial. El paciente registrado queda seleccionado para todo el panel mediante el contexto local de la sesión.

## Estructura

```text
frontend/src/app/
├── core/                 modelos, guard, interceptor y servicios
├── features/auth/        inicio de sesión
└── features/             autenticación, panel administrador y panel adulto

backend/src/
├── controllers/          pacientes, medicamentos, alertas y consultas
├── models/               7 colecciones oficiales de Mongoose
├── routes/               rutas base acordadas
├── middleware/           JWT y validación
└── data/                  almacén demostrativo
```

## Evidencia visual

`npm run visual:check` genera localmente capturas del login, ambos paneles, registro de paciente, receta completa y vistas de escritorio/teléfono dentro de `artifacts/`.

## Integración IoT con Firebase

El backend consulta de forma autenticada hasta las 100 lecturas más recientes de Realtime Database cada dos segundos y guarda sólo eventos nuevos en MongoDB. Angular nunca recibe las credenciales ni se conecta directamente a Firebase.

Configura `FIREBASE_DATABASE_URL` y una de estas opciones en `backend/.env`:

- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY`.
- `GOOGLE_APPLICATION_CREDENTIALS` con la ruta absoluta al JSON de la cuenta de servicio.

El ESP32 debe crear cada lectura en `/lecturas/{idEvento}` (ruta configurable con `FIREBASE_LECTURAS_PATH`) usando este contrato:

```json
{
  "dispositivoId": "ESP32-001",
  "pulsaciones": 72,
  "spo2": 96,
  "origen": "MAX30102",
  "timestamp": 1784637900000
}
```

Cuando `origen` es `PULSADOR`, el backend confirma una sola pastilla pendiente del día con el método `PULSADOR`. Prioriza la toma vencida más cercana y, si aún no hay una vencida, la siguiente programada. El evento no crea una emergencia ni duplica los últimos signos vitales. El identificador de Firebase evita confirmar dos pastillas durante una reconexión.

También se aceptan los alias `deviceId`, `bpm`, `heartRate`, `oxigeno` y marcas de tiempo ISO o Unix. El dispositivo debe existir previamente y estar vinculado al paciente. El estado se consulta, con sesión iniciada, en `GET /api/integraciones/firebase/estado`; esa respuesta nunca expone secretos.

Consulta [GUIA_CONFIGURACION_FIREBASE.md](GUIA_CONFIGURACION_FIREBASE.md) para preparar la computadora del backend, el firmware real y el puente USB autenticado.
