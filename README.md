# Sistema de Monitoreo de Salud y Medicación

Aplicación responsive para el hijo administrador y el adulto mayor, construida con Angular, Node.js, Express y MongoDB. Incluye sesión JWT por roles, registro del padre, seguimiento del paciente, CRUD de medicamentos, carga de recetas completas, confirmación de tomas, historiales, mediciones del MAX30102, alertas y estado del ESP32.

## Inicio rápido

Requisitos: Node.js 20.19 o superior y npm.

```bash
npm run install:all
npm run dev
```

Abre `http://localhost:4200` e ingresa con uno de los dos perfiles:

```text
Administrador: daniel@salud.ec / Admin123
Adulto mayor: carlos@salud.ec / Admin123
```

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
npm test             # pruebas HTTP del backend
npm run verify       # pruebas backend + build frontend
npm run visual:check # capturas headless; requiere Chrome y API activa
```

El backend también sirve el build ubicado en `frontend/dist` desde `http://localhost:3000`, incluyendo fallback para refrescar rutas Angular.

## Rutas implementadas

- `/login`
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

## API

Todas las respuestas usan el contrato `{ ok, mensaje, data }` o `{ ok, mensaje, errores }`.

- `POST /api/auth/login`
- `GET|POST|PUT /api/pacientes`
- `GET|POST|PUT|PATCH|DELETE /api/medicamentos`
- `POST /api/medicamentos/receta` para guardar varios medicamentos juntos
- `GET /api/tomas/paciente/:pacienteId`
- `GET /api/tomas/paciente/:pacienteId/hoy`
- `PATCH /api/tomas/:id/confirmar`
- `GET /api/pacientes/:id/resumen-adulto`
- `GET /api/mediciones/paciente/:pacienteId`
- `GET|PATCH /api/alertas`
- `GET /api/dispositivos/:dispositivoId/estado`

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

## Integración IoT

El panel ya consume las rutas de mediciones y dispositivo previstas para la integración. La lectura Firebase/ESP32 no está implementada aquí porque corresponde al módulo de Juan; debe alimentar Node.js, nunca el frontend directamente.
