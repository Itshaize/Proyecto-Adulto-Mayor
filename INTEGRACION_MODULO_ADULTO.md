# Integración del módulo adulto KAIRÓS

Este documento corresponde exclusivamente al trabajo de Mauricio. No autoriza modificar los módulos de administración, dispositivos, ESP32 o Firebase de otros integrantes.

## 1. Punto de recuperación de la versión de pruebas

La versión visual y simulada anterior a esta preparación quedó publicada en:

```text
Repositorio: https://github.com/Itshaize/Proyecto-Adulto-Mayor
Rama: mau
Commit: 394484d
```

Esta referencia permite volver al estado de pruebas aunque posteriormente cambie la integración local.

## 2. Dos modos disponibles

### Pruebas con datos simulados

```bash
cd frontend
npm start
```

Utiliza `src/environments/environment.ts`:

```ts
demoMode: true
```

En este modo:

- Se muestran los accesos rápidos del login.
- Se aceptan los usuarios de demostración.
- El panel obtiene sus datos de `AdultoDemoService`.
- Confirmar una toma solo actualiza la memoria del navegador.
- No se necesitan los endpoints de medicamentos o mediciones.

### Compilación para integración

```bash
cd frontend
npm run build:integration
```

Utiliza automáticamente `environment.integration.ts`:

```ts
demoMode: false
```

En este modo:

- El login llama `POST /api/auth/login`.
- Se ocultan los botones de acceso rápido.
- `AdultoDataService` consume los servicios HTTP reales.
- La confirmación llama `PATCH /api/tomas/:id/confirmar`.
- No se cargan medicamentos ni mediciones simuladas en las pantallas.

No es necesario comentar código para alternar entre pruebas e integración. Debe utilizarse el comando correspondiente.

## 3. Archivos propios que se pueden integrar

```text
frontend/src/app/features/adulto/**
frontend/src/app/core/services/paciente.service.ts
frontend/src/app/core/services/medicamento.service.ts
frontend/src/app/core/services/toma.service.ts
frontend/src/app/core/services/medicion.service.ts
frontend/src/app/core/services/alerta.service.ts
frontend/src/app/core/services/notificacion.service.ts
frontend/src/app/core/models/api-response.model.ts
frontend/public/assets/kairos-logo.svg
backend/src/models/TomaMedicamento.js
backend/src/controllers/toma.controller.js
backend/src/controllers/adulto.controller.js
backend/src/routes/toma.routes.js
backend/src/routes/adulto.routes.js
backend/src/utils/date.js
```

`adulto.routes.ts` debe montarse desde las rutas compartidas de esta forma:

```ts
{
  path: 'adulto',
  loadChildren: () =>
    import('./features/adulto/adulto.routes').then(m => m.ADULTO_ROUTES)
}
```

## 4. Archivos que no deben sobrescribirse al unir proyectos

Estos archivos son compartidos y deben fusionarse manualmente:

```text
frontend/src/app/app.routes.ts
frontend/src/app/app.config.ts
frontend/src/styles.scss
frontend/src/environments/environment.ts
frontend/package.json
frontend/angular.json
backend/src/app.js
backend/src/server.js
backend/package.json
```

No se debe reemplazar el contenido completo de ninguno de ellos con la versión de Mauricio.

En el `backend/src/app.js` compartido se agregan solamente estas importaciones y montajes:

```js
const tomaRoutes = require('./routes/toma.routes');
const adultoRoutes = require('./routes/adulto.routes');

app.use('/api/tomas', tomaRoutes);
app.use('/api/pacientes', adultoRoutes);
```

Express permite que `adultoRoutes` conviva con el router general de pacientes. Durante la integración no se debe copiar nuestro `app.js` completo.

Cuando exista middleware JWT compartido, debe colocarse en estos montajes sin modificar los controladores:

```js
app.use('/api/tomas', verificarJwt, tomaRoutes);
app.use('/api/pacientes', verificarJwt, adultoRoutes);
```

## 5. Código temporal que debe quitarse al conectar datos reales

### Quitar después de validar todos los endpoints

```text
frontend/src/app/features/adulto/services/adulto-demo.service.ts
```

Antes de eliminarlo se debe confirmar que `demoMode: false` permite:

1. Cargar el resumen del adulto.
2. Cargar medicamentos del día.
3. Confirmar una toma.
4. Cargar salud actual.
5. Cargar historial de siete días.

Después se elimina la inyección de `AdultoDemoService` y la rama `if (environment.demoMode)` de `AdultoDataService`. `AdultoDataService` debe conservarse como fachada única del panel.

### Quitar del login compartido

En `AuthService` deben eliminarse:

- El arreglo `usuariosDemo`.
- El token `TOKEN_DEMO_NO_USAR_EN_PRODUCCION`.
- La espera artificial de 550 ms.
- La rama de autenticación que compara correo y contraseña localmente.

En `LoginComponent` deben eliminarse:

- `usarAdulto()`.
- `usarAdmin()`.
- La sección HTML marcada por `@if (modoDemo)`.

No debe eliminarse la llamada real a `/api/auth/login`, `rutaInicial()`, `cerrarSesion()` ni los guards.

### Quitar cuando entre el panel administrativo real

```text
frontend/src/app/features/auth/admin-espera/**
```

También debe eliminarse únicamente la ruta temporal que carga `AdminEsperaComponent`. El equipo responsable montará su propia ruta `/admin`.

Esto no requiere cambiar ninguna ruta de `/adulto`.

## 6. Datos todavía fijos que deben venir de la API

| Dato actual | Ubicación | Fuente real esperada |
|---|---|---|
| Cita del 19 de mayo | `adulto-layout.component.html` | Alertas o citas del backend |
| Dr. Andrés Ruiz | Layout y Receta | Receta del paciente |
| Centro Médico Vida | Layout y Receta | Receta o cita real |
| Detalle de receta | `receta-adulto.component.html` | Endpoint de receta |
| Recordatorio de agua | `inicio-adulto.component.html` | Alertas/recordatorios |
| Una notificación nueva | `adulto-layout.component.html` | Alertas no leídas |

Estos bloques deben reemplazarse por propiedades recibidas de servicios. No deben borrarse hasta disponer del contrato del endpoint correspondiente, para evitar romper la interfaz de pruebas.

## 7. Contratos mínimos que espera nuestro módulo

Todas las respuestas deben usar:

```json
{
  "ok": true,
  "mensaje": "Operación realizada correctamente",
  "data": {}
}
```

El login debe devolver `token`, `usuario.rol` y `usuario.pacienteId` para un adulto mayor.

El resumen del adulto debe incluir como mínimo:

```json
{
  "telefonoHijo": "+593999999999"
}
```

Los medicamentos usados por la vista deben incluir:

```json
{
  "_id": "id-de-la-toma",
  "nombre": "Losartán",
  "concentracion": "50 mg",
  "dosis": "1 tableta",
  "horaProgramada": "08:00 AM",
  "indicaciones": "Tomar después del desayuno",
  "estado": "PENDIENTE"
}
```

Es importante que `_id` corresponda a la toma que acepta `PATCH /api/tomas/:id/confirmar`.

## 7.1 Colecciones compartidas y ausencia de duplicados

Nuestro backend registra únicamente el modelo `TomaMedicamento`, con colección explícita:

```text
tomas_medicamentos
```

El resumen adulto consulta directamente estas colecciones oficiales:

```text
pacientes
usuarios
medicamentos
mediciones
alertas
```

No crea modelos Mongoose alternativos para ellas. Los modelos de los compañeros pueden registrarse normalmente sin `OverwriteModelError` ni colecciones duplicadas.

## 7.2 Responsabilidad de las rutas

| Ruta | Responsable |
|---|---|
| `GET /api/tomas/paciente/:pacienteId/hoy` | Mauricio |
| `GET /api/tomas/paciente/:pacienteId?dias=7` | Mauricio |
| `PATCH /api/tomas/:id/confirmar` | Mauricio |
| `GET /api/pacientes/:id/resumen-adulto` | Mauricio |
| Medicamentos, mediciones y alertas generales | Otros módulos; nuestro código solo consume sus datos |

No deben crearse versiones duplicadas de nuestras cuatro rutas en otro router.

## 8. Variables que nunca deben subirse

```text
backend/.env
frontend/src/environments/* con credenciales reales de Firebase
```

Solo debe versionarse `backend/.env.example`. Antes de cualquier commit se debe comprobar que `.env` no figure en `git status`.

## 9. Verificación antes de entregar para integración

```bash
cd frontend
npm run build
npm run build:integration

cd ../backend
npm run check
```

La versión de pruebas y la de integración deben compilar. Que la compilación de integración termine no significa que los endpoints de los compañeros ya estén disponibles; esa conexión debe validarse durante la unión final.

## 10. Elementos ya preparados para datos reales

- `AdultoDataService` carga tomas de hoy e historial desde `TomaService`.
- La confirmación persiste mediante el endpoint real en modo integración.
- Los estados `PENDIENTE`, `TOMADA` y `OMITIDA` tienen texto e identidad visual.
- Salud representa `NORMAL`, `REVISAR` y `ALERTA` sin depender solo del color.
- `NotificacionService.registrarToken()` recibe el token que genere Firebase.
- `NotificacionService.procesarMensaje()` muestra el mensaje y redirige a Medicinas cuando corresponda.
- `AlertaService` consulta `GET /api/alertas/paciente/:pacienteId?soloNoLeidas=true`; en modo de pruebas usa el aviso simulado y en integración nunca inventa una cita.

La inicialización concreta de Firebase Messaging queda fuera del módulo de Mauricio hasta que el responsable entregue su configuración.

## 11. Pruebas técnicas realizadas

- `npm run check`: sintaxis correcta de conexión, modelo, controladores y rutas.
- `npm run build`: compilación correcta con datos de prueba.
- `npm run build:integration`: compilación correcta consumiendo API real.
- `GET /api/tomas/paciente/:pacienteId/hoy`: responde `200` y arreglo vacío para un paciente sin tomas.
- `GET /api/tomas/paciente/:pacienteId?dias=7`: responde `200` y respeta el período solicitado.
- `PATCH /api/tomas/:id/confirmar`: responde `404` con contrato de error cuando la toma no existe.
- `GET /api/pacientes/:id/resumen-adulto`: responde `404` con contrato de error cuando el paciente no existe.
- MongoDB: conexión comprobada mediante `/api/health`.

No se insertaron ni eliminaron documentos de las colecciones de los compañeros durante estas pruebas.

## 12. Auditoría contra `02_MAURICIO_PANEL_ADULTO.md`

### Contratos implementados por Mauricio

| Requisito | Estado | Observación |
|---|---|---|
| Rutas `/adulto/inicio`, `/medicinas`, `/salud` y `/ayuda` | Cumplido | Se conserva además `/adulto/receta` como ampliación solicitada. |
| Componentes accesibles y responsive | Cumplido | Menú inferior móvil, lateral en escritorio, tarjetas y botones principales de al menos 56 px. |
| `GET /api/pacientes/:id/resumen-adulto` | Cumplido | Controlador de Mauricio; consulta colecciones compartidas sin crear modelos duplicados. |
| `GET /api/tomas/paciente/:pacienteId/hoy` | Cumplido | Entrega tomas enriquecidas con datos del medicamento. |
| `GET /api/tomas/paciente/:pacienteId?dias=7` | Cumplido | Acepta `dias` y devuelve historial dentro del período. |
| `PATCH /api/tomas/:id/confirmar` | Cumplido | Envía y persiste `metodoConfirmacion: 'APP'`. |
| `PacienteService`, `MedicamentoService`, `TomaService`, `MedicionService` y `NotificacionService` | Cumplido | Conservan exactamente los nombres y métodos indicados. |
| Endpoint de alertas | Preparado para integración | `AlertaService` usa la ruta oficial. El backend pertenece al módulo compartido/administrativo. |
| Notificaciones FCM | Preparado para integración | Permiso, token, presentación y redirección están listos; falta la configuración Firebase de Juan. |
| Formato `HH:mm` y estados oficiales | Cumplido | Demo y API usan `08:00`, `13:00`, `22:00`, y los enums acordados. |
| Colección `tomas_medicamentos` | Cumplido | Nombre explícito y modelo único. |

### Dependencias externas que todavía no pueden probarse de extremo a extremo

| Prueba pendiente | Motivo |
|---|---|
| Carga real de `/api/medicamentos/paciente/:pacienteId/hoy` | El endpoint lo entrega el módulo de medicamentos de Ismael. Nuestro servicio y consumo ya están listos. |
| Carga real de `/api/mediciones/.../ultima` e historial | Los datos y endpoints de medición dependen del módulo/dispositivo de Juan. |
| Alertas reales y citas dinámicas | El endpoint oficial de alertas debe incorporarse desde el módulo compartido. En integración no se muestra la cita ficticia si el endpoint no existe. |
| Que Ismael vea inmediatamente una toma confirmada | Requiere ejecutar juntos el panel administrativo y este módulo sobre la misma base de datos. La toma sí queda persistida en MongoDB. |
| Medición simulada desde ESP32 y FCM | Requiere Firebase, credenciales y flujo IoT de Juan. |
| Llamada telefónica física | El enlace `tel:` está implementado; la prueba final requiere un teléfono con capacidad de llamada. |
| Login con usuarios reales | Requiere el `POST /api/auth/login` compartido del panel administrativo. El modo integración ya lo consume. |

### Diferencias acordadas que no rompen la integración

- El producto usa el nombre definitivo **KAIRÓS** en vez del nombre provisional del documento.
- El entorno local usa el puerto `4000` porque fue el valor acordado durante la configuración. La URL está centralizada en `environment`, por lo que puede cambiarse sin modificar componentes.
- La receta médica es una pantalla adicional solicitada después del plan inicial. Sus datos continúan simulados hasta que el equipo defina el contrato de recetas.
- Las variaciones visuales mantienen el criterio del documento: alto contraste, navegación de cuatro opciones, texto grande, estados con texto e icono y diseño mobile-first.

## 13. Lista final antes de unir módulos

1. Mantener `demoMode: false` en la configuración de integración.
2. Fusionar únicamente los montajes de rutas documentados; no reemplazar los archivos compartidos completos.
3. Probar login, medicamentos, mediciones y alertas con los endpoints de los compañeros.
4. Sustituir los datos simulados de receta cuando exista un contrato oficial.
5. Tras completar esas pruebas, retirar `AdultoDemoService`, los accesos rápidos y `AdminEsperaComponent` según la sección 5.
