# Guía de pruebas e integración — KAIRÓS

> Para el procedimiento de unión del módulo y la lista exacta de código temporal, consulte también `INTEGRACION_MODULO_ADULTO.md`.

## 1. Estado actual

El frontend Angular contiene:

- Login compartido para `ADULTO_MAYOR` y `HIJO_ADMIN`.
- Panel responsive y accesible del adulto mayor.
- Inicio, Medicinas, Salud, Ayuda y Receta médica.
- Confirmación simulada en modo de pruebas y persistente en modo de integración.
- Notificación y ventana emergente de cita próxima.
- Botón telefónico para llamar al hijo.
- Servicios HTTP preparados para la API oficial.
- Ruta temporal `/admin/inicio` para probar la redirección por rol.
- Modelo Mongoose `TomaMedicamento` con colección `tomas_medicamentos`.
- Endpoints reales de tomas y resumen del adulto.

La conexión a MongoDB y los endpoints propios de Mauricio están incluidos: tomas de hoy, historial, confirmación y resumen del adulto. Los endpoints generales de medicamentos, mediciones, alertas, Firebase y el panel administrativo real pertenecen a otros módulos.

## 2. Cómo ejecutar

Desde la raíz del repositorio:

```bash
cd frontend
npm install
npm start
```

Abrir `http://localhost:4200/login`.

Para ejecutar el backend, primero escriba las credenciales de MongoDB en `backend/.env` y luego use:

```bash
cd backend
npm install
npm run dev
```

La conexión puede verificarse en `http://localhost:4000/api/health`.

Para comprobar la compilación:

```bash
npm run build
```

## 3. Usuarios exclusivos para pruebas

| Rol | Correo | Contraseña | Redirección |
|---|---|---|---|
| Adulto mayor | `adulto@kairos.com` | `Adulto123!` | `/adulto/inicio` |
| Hijo administrador | `admin@kairos.com` | `Admin123!` | `/admin/inicio` |

El login también incluye botones que completan automáticamente estas credenciales.

> Estas contraseñas y el token de demostración no deben utilizarse en producción.

## 4. Pruebas manuales

### Login y roles

1. Ingresar datos vacíos y comprobar los mensajes de validación.
2. Probar una contraseña incorrecta y comprobar el mensaje de error.
3. Usar “Ver” para mostrar y ocultar la contraseña.
4. Ingresar como adulto y comprobar la redirección a `/adulto/inicio`.
5. Cerrar sesión y comprobar que se regresa a `/login`.
6. Ingresar como administrador y comprobar la redirección a `/admin/inicio`.
7. Intentar abrir `/adulto/inicio` con el administrador y verificar que el guard lo devuelve a su panel.

### Panel del adulto

1. Revisar la aplicación con ancho de teléfono.
2. Cerrar el aviso de cita y abrirlo nuevamente desde la campana.
3. Comprobar la animación de notificación nueva.
4. Abrir Medicinas y confirmar una toma pendiente.
5. Comprobar que el estado cambia a `TOMADA`.
6. Abrir la receta y revisar dosis, horarios e indicaciones.
7. Cambiar el historial de Salud entre “Hoy” y “7 días”.
8. Probar “Llamar a mi hijo” desde un dispositivo compatible con `tel:`.

## 5. Datos simulados actuales

Los siguientes elementos son temporales:

- Usuarios y contraseñas en `AuthService`.
- Token `TOKEN_DEMO_NO_USAR_EN_PRODUCCION`.
- Paciente Carlos Pérez y teléfono del hijo.
- Medicamentos, mediciones e historial en `AdultoDemoService`.
- Cita del 19 de mayo y Dr. Andrés Ruiz.
- Receta médica y sus indicaciones.
- Conteo fijo de una notificación nueva.
- Pantalla `AdminEsperaComponent`.

La sesión simulada se guarda en `localStorage` con la clave `kairos_sesion_demo`.

## 6. Qué quitar o reemplazar durante la integración

### Obligatorio

1. Eliminar `AdultoDemoService` cuando todos los endpoints reales estén disponibles y hayan sido validados con `demoMode: false`.
2. Eliminar `usuariosDemo` y la espera artificial de `AuthService`.
3. Eliminar los botones “Acceso rápido para pruebas” del login.
4. Cambiar `localStorage` de demostración por el manejo acordado del JWT real.
5. Sustituir `AdminEsperaComponent` y su ruta por el módulo administrativo de Ismael.
6. Obtener cita, receta y notificaciones desde el backend.
7. Ocultar la animación de la campana cuando no existan alertas sin leer.
8. Reemplazar fechas fijas por fechas recibidas de la API.

### No quitar

- `RolUsuario` y sus valores oficiales.
- `AuthService` como nombre del servicio compartido.
- Guards de autenticación y rol; deben adaptarse al JWT real.
- Rutas oficiales `/login`, `/adulto/*` y `/admin/*`.
- Contrato visual, accesibilidad y diseño responsive.
- Servicios `PacienteService`, `MedicamentoService`, `TomaService`, `MedicionService` y `NotificacionService`.

## 7. Integración del login con el backend

Endpoint esperado:

```http
POST /api/auth/login
Content-Type: application/json
```

Payload:

```json
{
  "correo": "adulto@kairos.com",
  "password": "contraseña_real"
}
```

Respuesta esperada:

```json
{
  "ok": true,
  "mensaje": "Inicio de sesión correcto",
  "data": {
    "token": "jwt",
    "usuario": {
      "_id": "ObjectId",
      "nombre": "Carlos Pérez",
      "correo": "adulto@kairos.com",
      "rol": "ADULTO_MAYOR",
      "pacienteId": "ObjectId"
    }
  }
}
```

Al integrar, `AuthService.iniciarSesion()` debe llamar este endpoint, guardar la sesión acordada y conservar `rutaInicial()` para redirigir según el rol.

## 8. Servicios y endpoints preparados

```text
GET   /api/pacientes/:id/resumen-adulto
GET   /api/medicamentos/paciente/:pacienteId/hoy
GET   /api/tomas/paciente/:pacienteId/hoy
GET   /api/tomas/paciente/:pacienteId?dias=7
PATCH /api/tomas/:id/confirmar
GET   /api/mediciones/paciente/:pacienteId/ultima
GET   /api/mediciones/paciente/:pacienteId?dias=7
GET   /api/alertas/paciente/:pacienteId?soloNoLeidas=true
```

Implementados por Mauricio en esta entrega:

```text
GET   /api/pacientes/:id/resumen-adulto
GET   /api/tomas/paciente/:pacienteId/hoy
GET   /api/tomas/paciente/:pacienteId?dias=7
PATCH /api/tomas/:id/confirmar
```

La URL base actual está en `frontend/src/environments/environment.ts`:

```ts
apiUrl: 'http://localhost:4000/api'
```

## 9. Integración con el panel administrativo

El equipo de administración debe:

1. Mantener el login compartido.
2. Reemplazar la definición temporal de `/admin/inicio` en `app.routes.ts` por sus rutas reales.
3. Mantener el rol exacto `HIJO_ADMIN`.
4. Usar `AuthService.usuarioActual()` para consultar al usuario autenticado.
5. Llamar `AuthService.cerrarSesion()` desde su propio layout.

No deben copiarse dos servicios de autenticación ni crearse dos rutas `/login`.
