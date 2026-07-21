# Backend KAIRÓS

## Configurar MongoDB

Edite `backend/.env` y reemplace únicamente los valores privados:

```env
PORT=4000
JWT_SECRET=una-clave-larga-y-aleatoria
MONGODB_URI=mongodb+srv://USUARIO:CONTRASENA@cluster.mongodb.net/salud_medicacion?retryWrites=true&w=majority
```

Si la contraseña contiene caracteres especiales como `@`, `#`, `/` o `:`, debe codificarlos para URL desde MongoDB Atlas o copiar directamente la cadena que ofrece Atlas.

## Ejecutar

```bash
cd backend
npm install
npm run dev
```

Comprobar la conexión:

```text
GET http://localhost:4000/api/health
```

Una conexión correcta responde con `mongodb: "CONECTADO"`.

## Endpoints del módulo adulto

```text
GET   /api/pacientes/:id/resumen-adulto
GET   /api/tomas/paciente/:pacienteId/hoy
GET   /api/tomas/paciente/:pacienteId?dias=7
PATCH /api/tomas/:id/confirmar
```

Estas rutas pertenecen al módulo de Mauricio. `adulto.controller.js` consulta las colecciones compartidas por su nombre oficial y no registra modelos alternativos de pacientes, medicamentos, mediciones o alertas.
