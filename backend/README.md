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
