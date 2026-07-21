const bearer = [{ bearerAuth: [] }];
const publicApiUrl = (process.env.PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');
const idParameter = (name = 'id', description = 'Identificador MongoDB del recurso') => ({ name, in: 'path', required: true, description, schema: { type: 'string' } });
const patientParameter = idParameter('pacienteId', 'Identificador del adulto mayor');
const jsonBody = (schema, example) => ({ required: true, content: { 'application/json': { schema, ...(example ? { example } : {}) } } });
const standardResponses = (description = 'Operación completada') => ({
  200: { description },
  401: { description: 'Token ausente, inválido o expirado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
  404: { description: 'Recurso no encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
  422: { description: 'Datos de entrada no válidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
});

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'KAIRÓS · API de salud y medicación', version: '1.0.0',
    description: 'API REST para administrar adultos mayores, medicamentos, tomas, mediciones del ESP32/MAX30102, alertas, exportaciones y el puente Firebase → MongoDB. Usa **POST /api/auth/login** o **POST /api/auth/register**, copia el token y presiona **Authorize**.',
    contact: { name: 'Equipo KAIRÓS', url: 'https://github.com/Itshaize/Proyecto-Adulto-Mayor' },
  },
  servers: [{ url: publicApiUrl, description: process.env.PUBLIC_API_URL ? 'Servidor AWS' : 'Servidor local' }],
  tags: [
    { name: 'Sistema', description: 'Salud general y documentación de la API' },
    { name: 'Autenticación', description: 'Registro de administradores e inicio de sesión por roles' },
    { name: 'Pacientes', description: 'Adultos mayores vinculados al administrador (máximo 2)' },
    { name: 'Medicamentos', description: 'Medicamentos y recetas completas' },
    { name: 'Tomas', description: 'Programación y confirmación de medicación' },
    { name: 'Mediciones', description: 'Pulsaciones y SpO2 provenientes del MAX30102' },
    { name: 'Alertas', description: 'Avisos clínicos y de medicación' },
    { name: 'Dispositivos', description: 'Estado de conexión del ESP32' },
    { name: 'Integraciones', description: 'Estado del puente Firebase Realtime Database' },
  ],
  paths: {
    '/api/salud': { get: { tags: ['Sistema'], summary: 'Comprobar que la API está activa', responses: { 200: { description: 'API disponible y modo de persistencia actual' } } } },
    '/api/auth/register': { post: { tags: ['Autenticación'], summary: 'Crear una cuenta de administrador', description: 'Crea exclusivamente un usuario HIJO_ADMIN e inicia su sesión. El rol no se recibe desde el cliente.', requestBody: jsonBody({ $ref: '#/components/schemas/RegisterRequest' }, { nombre: 'Daniela Pérez', correo: 'daniela@correo.com', telefono: '+593991234567', password: 'Segura123' }), responses: { 201: { description: 'Administrador creado y sesión iniciada', content: { 'application/json': { schema: { $ref: '#/components/schemas/SessionResponse' } } } }, 409: { description: 'El correo ya está registrado' }, 422: { description: 'Datos no válidos' } } } },
    '/api/auth/login': { post: { tags: ['Autenticación'], summary: 'Iniciar sesión', requestBody: jsonBody({ $ref: '#/components/schemas/LoginRequest' }, { correo: 'daniel@salud.ec', password: 'Admin123' }), responses: { 200: { description: 'Sesión iniciada', content: { 'application/json': { schema: { $ref: '#/components/schemas/SessionResponse' } } } }, 401: { description: 'Credenciales incorrectas' }, 422: { description: 'Datos no válidos' } } } },
    '/api/pacientes': {
      get: { tags: ['Pacientes'], summary: 'Listar adultos del administrador', security: bearer, responses: standardResponses('Listado de pacientes') },
      post: { tags: ['Pacientes'], summary: 'Registrar un adulto y crear su acceso', security: bearer, requestBody: jsonBody({ $ref: '#/components/schemas/PacienteInput' }), responses: { ...standardResponses(), 201: { description: 'Adulto y credenciales creados' }, 409: { description: 'Correo duplicado o máximo de 2 adultos alcanzado' } } },
    },
    '/api/pacientes/{id}': {
      get: { tags: ['Pacientes'], summary: 'Consultar un paciente', security: bearer, parameters: [idParameter()], responses: standardResponses('Datos del paciente') },
      put: { tags: ['Pacientes'], summary: 'Actualizar paciente y credenciales', security: bearer, parameters: [idParameter()], requestBody: jsonBody({ $ref: '#/components/schemas/PacienteInput' }), responses: standardResponses('Paciente actualizado') },
    },
    '/api/pacientes/{id}/resumen': { get: { tags: ['Pacientes'], summary: 'Resumen completo para el administrador', security: bearer, parameters: [idParameter()], responses: standardResponses('Resumen administrativo') } },
    '/api/pacientes/{id}/resumen-adulto': { get: { tags: ['Pacientes'], summary: 'Resumen simplificado para el adulto', security: bearer, parameters: [idParameter()], responses: standardResponses('Resumen del adulto') } },
    '/api/pacientes/{id}/exportar': { get: { tags: ['Pacientes'], summary: 'Descargar historial en Excel o PDF', security: bearer, parameters: [idParameter(), { name: 'formato', in: 'query', required: true, schema: { type: 'string', enum: ['xlsx', 'pdf'] } }, { name: 'seccion', in: 'query', schema: { type: 'string', enum: ['todas', 'medicacion', 'salud'], default: 'todas' } }, { name: 'desde', in: 'query', schema: { type: 'string', format: 'date' } }, { name: 'hasta', in: 'query', schema: { type: 'string', format: 'date' } }], responses: { 200: { description: 'Archivo generado', content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } }, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { schema: { type: 'string', format: 'binary' } } } }, 401: { description: 'Sesión inválida' }, 404: { description: 'Paciente no encontrado' }, 422: { description: 'Filtros inválidos' } } } },
    '/api/medicamentos/paciente/{pacienteId}': { get: { tags: ['Medicamentos'], summary: 'Listar medicamentos del paciente', security: bearer, parameters: [patientParameter], responses: standardResponses('Listado de medicamentos') } },
    '/api/medicamentos': { post: { tags: ['Medicamentos'], summary: 'Crear un medicamento', security: bearer, requestBody: jsonBody({ $ref: '#/components/schemas/MedicamentoInput' }), responses: { ...standardResponses(), 201: { description: 'Medicamento creado' } } } },
    '/api/medicamentos/receta': { post: { tags: ['Medicamentos'], summary: 'Guardar una receta con varios medicamentos', security: bearer, requestBody: jsonBody({ type: 'object', required: ['medicamentos'], properties: { medicamentos: { type: 'array', minItems: 1, items: { $ref: '#/components/schemas/MedicamentoInput' } } } }), responses: { ...standardResponses(), 201: { description: 'Receta completa guardada' } } } },
    '/api/medicamentos/{id}': { put: { tags: ['Medicamentos'], summary: 'Actualizar un medicamento', security: bearer, parameters: [idParameter()], requestBody: jsonBody({ $ref: '#/components/schemas/MedicamentoInput' }), responses: standardResponses('Medicamento actualizado') }, delete: { tags: ['Medicamentos'], summary: 'Eliminar un medicamento sin historial', security: bearer, parameters: [idParameter()], responses: { ...standardResponses('Medicamento eliminado'), 409: { description: 'No se puede eliminar porque tiene historial' } } } },
    '/api/medicamentos/{id}/estado': { patch: { tags: ['Medicamentos'], summary: 'Activar o desactivar medicamento', security: bearer, parameters: [idParameter()], requestBody: jsonBody({ type: 'object', required: ['activo'], properties: { activo: { type: 'boolean' } } }, { activo: false }), responses: standardResponses('Estado actualizado') } },
    '/api/tomas/paciente/{pacienteId}': { get: { tags: ['Tomas'], summary: 'Consultar historial de tomas', security: bearer, parameters: [patientParameter, { name: 'dias', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 90 } }], responses: standardResponses('Historial de tomas') } },
    '/api/tomas/paciente/{pacienteId}/hoy': { get: { tags: ['Tomas'], summary: 'Consultar tomas programadas hoy', security: bearer, parameters: [patientParameter], responses: standardResponses('Tomas del día') } },
    '/api/tomas/paciente/{pacienteId}/resumen': { get: { tags: ['Tomas'], summary: 'Resumen diario de tomas', security: bearer, parameters: [patientParameter], responses: standardResponses('Totales por estado') } },
    '/api/tomas/{id}/confirmar': { patch: { tags: ['Tomas'], summary: 'Confirmar una toma', security: bearer, parameters: [idParameter()], requestBody: jsonBody({ $ref: '#/components/schemas/ConfirmarToma' }, { metodoConfirmacion: 'APP', observacion: 'Tomada con alimentos' }), responses: standardResponses('Toma confirmada') } },
    '/api/mediciones/paciente/{pacienteId}': { get: { tags: ['Mediciones'], summary: 'Historial de pulsaciones y SpO2', security: bearer, parameters: [patientParameter, { name: 'dias', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 90 } }], responses: standardResponses('Listado de mediciones') } },
    '/api/mediciones/paciente/{pacienteId}/ultima': { get: { tags: ['Mediciones'], summary: 'Última medición registrada', security: bearer, parameters: [patientParameter], responses: standardResponses('Última medición') } },
    '/api/mediciones/paciente/{pacienteId}/resumen': { get: { tags: ['Mediciones'], summary: 'Promedios y lecturas recientes', security: bearer, parameters: [patientParameter], responses: standardResponses('Resumen de mediciones') } },
    '/api/alertas/paciente/{pacienteId}': { get: { tags: ['Alertas'], summary: 'Listar alertas del paciente', security: bearer, parameters: [patientParameter], responses: standardResponses('Listado de alertas') } },
    '/api/alertas/{id}/leida': { patch: { tags: ['Alertas'], summary: 'Marcar una alerta como leída', security: bearer, parameters: [idParameter()], responses: standardResponses('Alerta actualizada') } },
    '/api/dispositivos/{dispositivoId}/estado': { get: { tags: ['Dispositivos'], summary: 'Consultar conexión del ESP32', security: bearer, parameters: [idParameter('dispositivoId', 'Código físico del dispositivo, por ejemplo ESP32-001')], responses: standardResponses('Estado del dispositivo') } },
    '/api/integraciones/firebase/estado': { get: { tags: ['Integraciones'], summary: 'Consultar configuración y sincronización Firebase', security: bearer, responses: standardResponses('Estado seguro, sin exponer credenciales') } },
  },
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Pega únicamente el token devuelto por login o register.' } },
    schemas: {
      ApiError: { type: 'object', properties: { ok: { type: 'boolean', example: false }, mensaje: { type: 'string' }, errores: { type: 'array', items: { type: 'object' } } } },
      LoginRequest: { type: 'object', required: ['correo', 'password'], properties: { correo: { type: 'string', format: 'email' }, password: { type: 'string', format: 'password' } } },
      RegisterRequest: { type: 'object', required: ['nombre', 'correo', 'telefono', 'password'], properties: { nombre: { type: 'string', minLength: 3, maxLength: 80 }, correo: { type: 'string', format: 'email' }, telefono: { type: 'string', minLength: 7, maxLength: 20 }, password: { type: 'string', format: 'password', minLength: 8, maxLength: 72, description: 'Debe incluir mayúscula, minúscula y número.' } } },
      UsuarioSesion: { type: 'object', properties: { _id: { type: 'string' }, nombre: { type: 'string' }, correo: { type: 'string', format: 'email' }, rol: { type: 'string', enum: ['HIJO_ADMIN', 'ADULTO_MAYOR', 'TECNICO'] }, pacienteId: { type: 'string' } } },
      SessionResponse: { type: 'object', properties: { ok: { type: 'boolean', example: true }, mensaje: { type: 'string' }, data: { type: 'object', properties: { token: { type: 'string' }, usuario: { $ref: '#/components/schemas/UsuarioSesion' } } } } },
      PacienteInput: { type: 'object', required: ['nombre', 'edad', 'fechaNacimiento', 'telefonoContacto', 'dispositivoId', 'correoAcceso'], properties: { nombre: { type: 'string' }, edad: { type: 'integer', minimum: 1 }, fechaNacimiento: { type: 'string', format: 'date' }, diagnosticos: { type: 'array', items: { type: 'string' } }, telefonoContacto: { type: 'string' }, dispositivoId: { type: 'string', example: 'ESP32-002' }, correoAcceso: { type: 'string', format: 'email' }, passwordAcceso: { type: 'string', format: 'password', minLength: 6 }, activo: { type: 'boolean', default: true } } },
      MedicamentoInput: { type: 'object', required: ['pacienteId', 'nombre', 'concentracion', 'dosis', 'horarios'], properties: { pacienteId: { type: 'string' }, nombre: { type: 'string', example: 'Losartán' }, concentracion: { type: 'string', example: '50 mg' }, dosis: { type: 'string', example: '1 tableta' }, horarios: { type: 'array', minItems: 1, items: { type: 'string', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$', example: '08:00' } }, frecuencia: { type: 'string', example: 'DIARIA' }, indicaciones: { type: 'string' }, recetaMedico: { type: 'string' }, recetaFecha: { type: 'string', format: 'date' }, recetaObservacion: { type: 'string' }, activo: { type: 'boolean', default: true } } },
      ConfirmarToma: { type: 'object', properties: { metodoConfirmacion: { type: 'string', enum: ['PULSADOR', 'APP', 'ADMIN'], default: 'APP' }, observacion: { type: 'string', maxLength: 500 } } },
    },
  },
};

export const swaggerOptions = {
  customSiteTitle: 'KAIRÓS · Documentación API',
  customCss: '.swagger-ui .topbar{display:none}.swagger-ui .info .title{color:#0d3b78}.swagger-ui .opblock-tag{color:#0d3b78}.swagger-ui .btn.authorize{color:#1597a8;border-color:#1597a8}.swagger-ui .btn.authorize svg{fill:#1597a8}',
  swaggerOptions: { persistAuthorization: true, displayRequestDuration: true, filter: true, tagsSorter: 'alpha', operationsSorter: 'method' },
};
