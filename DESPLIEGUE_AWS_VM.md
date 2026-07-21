# Backend en AWS y frontend en la VM de la universidad

La separacion correcta queda asi:

```text
Navegador -> Frontend Angular en la VM -> API Express en AWS -> MongoDB Atlas
```

`localhost` siempre significa "esta misma maquina". Por eso el frontend de la VM no puede usar `http://localhost:3000/api` para llegar a AWS: debe usar la IP publica o el dominio de la API.

## Datos necesarios

- `FRONTEND_ORIGIN`: direccion exacta con la que se abre Angular, por ejemplo `http://192.0.2.20` o `http://192.0.2.20:4200`. No incluye rutas ni `/` final.
- `API_HOST_AWS`: IP publica, Elastic IP o dominio del EC2.
- `API_URL`: para una prueba HTTP, `http://API_HOST_AWS/api`; con dominio y TLS, `https://api.ejemplo.com/api`.

Para este proyecto ya se configuró `API_HOST_AWS` como `3.131.94.209`. Mientras no se conozca la dirección de la VM, `backend/.env` usa temporalmente `FRONTEND_URLS=*`; se debe reemplazar por el origen real antes de una entrega pública.

## 1. Preparar EC2 para el backend

Crear una instancia Linux con IP publica. En su Security Group permitir:

| Puerto | Origen recomendado | Uso |
|---|---|---|
| TCP 22 | La IP del administrador | SSH |
| TCP 80 | La IP/red de la universidad o `0.0.0.0/0` para la demostracion | API HTTP |
| TCP 443 | La IP/red de la universidad o `0.0.0.0/0` | API HTTPS |

No es necesario publicar el puerto 3000: Nginx lo consume internamente. Conviene asociar una Elastic IP o un dominio para que la direccion no cambie al detener e iniciar EC2.

Conectarse por SSH, instalar Git, Nginx y **Node.js 22 o superior**, y copiar/clonar el proyecto en `/opt/kairos`. Después:

```bash
cd /opt/kairos/backend
npm ci --omit=dev
cp .env.example .env
nano .env
```

Valores imprescindibles de `/opt/kairos/backend/.env`:

```dotenv
PORT=3000
HOST=0.0.0.0
FRONTEND_URLS=http://IP_O_DOMINIO_DE_LA_VM
PUBLIC_API_URL=http://IP_O_DOMINIO_AWS
MONGODB_URI=mongodb+srv://USUARIO:CLAVE@CLUSTER/adulto_mayor?retryWrites=true&w=majority
JWT_SECRET=UNA_CADENA_ALEATORIA_Y_PRIVADA_DE_MAS_DE_32_CARACTERES
```

Si Angular se abre de dos formas, se escriben ambas separadas por coma:

```dotenv
FRONTEND_URLS=http://IP_VM:4200,https://frontend.ejemplo.edu.ec
```

No dejar `MONGODB_URI` vacio en AWS: el modo demostracion guarda datos solo en memoria y los pierde al reiniciar.

## 2. Mantener la API ejecutándose

El repositorio incluye una plantilla de `systemd`. Verificar primero que `which node` devuelva `/usr/bin/node`; si devuelve otra ruta, cambiar `ExecStart` en la plantilla.

```bash
sudo cp /opt/kairos/deploy/kairos-api.service.example /etc/systemd/system/kairos-api.service
sudo systemctl daemon-reload
sudo systemctl enable --now kairos-api
sudo systemctl status kairos-api
curl http://127.0.0.1:3000/api/salud
```

Para ver errores:

```bash
sudo journalctl -u kairos-api -n 100 --no-pager
```

## 3. Publicar la API mediante Nginx

Copiar la plantilla y reemplazar `API_HOST_AWS` por la IP o dominio real:

```bash
sudo cp /opt/kairos/deploy/nginx-api.conf.example /etc/nginx/sites-available/kairos-api
sudo nano /etc/nginx/sites-available/kairos-api
sudo ln -s /etc/nginx/sites-available/kairos-api /etc/nginx/sites-enabled/kairos-api
sudo nginx -t
sudo systemctl reload nginx
```

Desde la VM universitaria comprobar:

```bash
curl http://API_HOST_AWS/api/salud
```

Debe devolver JSON con `"ok":true`. La documentación quedará en `http://API_HOST_AWS/api-docs`.

Si el frontend usa HTTPS, la API también debe usar HTTPS; el navegador bloqueará una API HTTP por contenido mixto. Para HTTPS se necesita un dominio apuntando a EC2 y un certificado TLS (por ejemplo, Certbot sobre Nginx). En ese caso se usa `https://DOMINIO_API/api`.

## 4. Apuntar Angular de la VM hacia AWS

Editar `frontend/public/config.js`:

```javascript
window.__KAIROS_CONFIG__ = {
  apiUrl: 'http://API_HOST_AWS/api'
};
```

Usar `https://DOMINIO_API/api` si se configuró TLS. Después se puede ejecutar en desarrollo:

```bash
cd frontend
npm ci
npm start -- --host 0.0.0.0
```

O generar la version para Nginx/Apache de la VM:

```bash
npm run build
```

El archivo también se copia a `frontend/dist/salud-medicacion-web/browser/config.js`. Puede editarse allí para cambiar la API sin recompilar todo Angular.

Para publicar el build mediante Nginx en la VM:

```bash
sudo mkdir -p /var/www/kairos
sudo cp -r frontend/dist/salud-medicacion-web/browser/. /var/www/kairos/
sudo cp deploy/nginx-frontend-vm.conf.example /etc/nginx/sites-available/kairos-web
sudo nano /etc/nginx/sites-available/kairos-web
sudo ln -s /etc/nginx/sites-available/kairos-web /etc/nginx/sites-enabled/kairos-web
sudo nginx -t
sudo systemctl reload nginx
```

En la plantilla se reemplaza `FRONTEND_HOST_VM` por la IP o dominio de la VM. La regla especial de `config.js` evita que el navegador conserve una URL vieja de AWS.

## 5. Prueba final

1. Abrir Angular usando la dirección real de la VM, no `localhost` desde otra computadora.
2. En las herramientas del navegador, pestaña **Network**, iniciar sesión.
3. Confirmar que `POST http(s)://API_HOST_AWS/api/auth/login` responde `200`.
4. Si aparece un error CORS, comprobar que el valor de `FRONTEND_URLS` sea idéntico al encabezado `Origin` mostrado por el navegador y reiniciar: `sudo systemctl restart kairos-api`.
5. Si dice `ERR_CONNECTION_TIMED_OUT`, revisar Security Group, Nginx y la IP/dominio; no es un error de Angular.

También se puede ejecutar la comprobación automática desde cualquier equipo con Node.js 22:

```bash
npm run check:deployment -- --api=http://API_HOST_AWS/api --origin=http://IP_O_DOMINIO_DE_LA_VM
```

El resultado final esperado es `DESPLIEGUE LISTO: la VM puede comunicarse con AWS.`

Nunca copiar `backend/.env`, la clave JWT ni credenciales de MongoDB/Firebase al frontend: todo el JavaScript del frontend es visible para quien abre la página.
