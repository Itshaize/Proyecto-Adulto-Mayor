# Despliegue KAIROS: Hostinger + AWS

Esta es la arquitectura de producción:

```text
ESP32 -> puente USB de Juan -> Firebase Realtime Database
                                      |
                                      v
Angular en Hostinger ----------> API Express en AWS ----------> MongoDB Atlas
```

Cada parte tiene una responsabilidad separada:

- `frontend/`: Angular compilado como archivos estáticos para Hostinger.
- `backend/`: Node.js/Express ejecutado únicamente en la instancia AWS.
- `deploy/hostinger/`: reglas de rutas y publicación del frontend.
- `deploy/aws/`: variables, servicio y proxy inverso del backend.
- `hardware/puente_local/`: proceso local de Juan; nunca se instala en Hostinger ni AWS.

## Estado conocido del servidor

La instancia informada usa la IP `3.131.94.209`.

Durante la preparación del 29 de julio de 2026:

- inicialmente `http://3.131.94.209/api/salud` respondió `502 Bad Gateway`;
- al finalizar el despliegue, los puertos 80 y 443 dejaron de aceptar
  conexiones;
- la API debe recuperarse y publicarse por HTTPS antes de la prueba integral.

La guía de AWS contiene el procedimiento para revisar Express, Nginx, el
firewall y el certificado.

## Frontend publicado

El frontend fue desplegado mediante el MCP oficial de Hostinger en:

```text
https://greenyellow-finch-398448.hostingersite.com
```

Hostinger responde `200` para `/`, `/login` y `/adulto-mayor`. El paquete
publicado conserva temporalmente `http://3.131.94.209/api` en `config.js`.
Cuando exista el dominio HTTPS del backend, se debe reemplazar ese valor sin
necesidad de recompilar Angular.

## Orden obligatorio

1. El encargado de AWS sigue [la guía del backend](deploy/aws/README_AMIGO_AWS.md).
2. La API debe responder JSON en una URL HTTPS, por ejemplo
   `https://api.ejemplo.com/api/salud`.
3. Hostinger crea el dominio temporal o definitivo del frontend.
4. El encargado de AWS coloca ese origen exacto en `FRONTEND_URLS` y reinicia la API.
5. Se genera y sube el paquete siguiendo
   [la guía de Hostinger](deploy/hostinger/README_HOSTINGER.md).
6. Se ejecuta la comprobación automática de API y CORS.

Hostinger publica el frontend con HTTPS. Por seguridad del navegador, no se
debe conectar ese frontend a `http://3.131.94.209`: sería contenido mixto y las
peticiones quedarían bloqueadas. La IP puede usarse para diagnosticar; la
entrega final necesita un dominio con certificado HTTPS en AWS.

## Información que intercambian los dos encargados

El encargado de AWS entrega:

```text
API_PUBLICA=https://api.ejemplo.com/api
SALUD=https://api.ejemplo.com/api/salud
```

El encargado de Hostinger entrega:

```text
FRONTEND_ORIGIN=https://nombre-disponible.hostingersite.com
```

No se intercambian por Git ni por el frontend:

- `backend/.env`
- URI real de MongoDB
- `JWT_SECRET`
- JSON privado de Firebase
- contraseñas o códigos de acceso de Hostinger/AWS

## Comprobación final

Desde cualquier equipo con Node.js 22:

```bash
npm run check:deployment -- \
  --api=https://api.ejemplo.com/api \
  --origin=https://nombre-disponible.hostingersite.com
```

El resultado esperado es:

```text
DESPLIEGUE LISTO: el frontend puede comunicarse con AWS.
```
