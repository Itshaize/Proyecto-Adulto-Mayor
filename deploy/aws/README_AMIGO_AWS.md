# Guía para el encargado del backend AWS

Esta guía prepara exclusivamente el backend. El frontend se publicará por
separado en Hostinger.

## Datos actuales

```text
Repositorio: https://github.com/Itshaize/Proyecto-Adulto-Mayor.git
Rama: main
IP AWS: 3.131.94.209
Puerto interno de Express: 3000
```

La IP responde actualmente mediante Nginx, pero devuelve `502 Bad Gateway`.
Primero hay que recuperar el proceso Node.

## 1. Diagnosticar el 502 actual

Conectarse por SSH y ejecutar:

```bash
sudo systemctl status kairos-api --no-pager
sudo journalctl -u kairos-api -n 150 --no-pager
sudo ss -lntp | grep 3000
curl -i http://127.0.0.1:3000/api/salud
```

Interpretación:

- Si `systemctl` dice que la unidad no existe, instalarla en el paso 4.
- Si Node se reinicia, leer el error de MongoDB, Firebase o `.env` en `journalctl`.
- Si no aparece el puerto 3000, Express no está ejecutándose.
- Si la prueba local responde `200` pero la IP devuelve `502`, revisar la
  configuración de Nginx del paso 5.

## 2. Preparar Ubuntu y el repositorio

El proyecto requiere Node.js 22 o superior:

```bash
sudo apt update
sudo apt install -y git curl nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

Para una instalación nueva:

```bash
sudo mkdir -p /opt/kairos
sudo chown ubuntu:ubuntu /opt/kairos
git clone https://github.com/Itshaize/Proyecto-Adulto-Mayor.git /opt/kairos
cd /opt/kairos
git switch main
npm ci --omit=dev --prefix backend
```

Si `/opt/kairos` ya contiene el proyecto:

```bash
cd /opt/kairos
git fetch origin
git switch main
git pull --ff-only origin main
npm ci --omit=dev --prefix backend
```

## 3. Variables y credenciales privadas

Crear el `.env` a partir de la plantilla:

```bash
cp /opt/kairos/deploy/aws/backend.env.example /opt/kairos/backend/.env
nano /opt/kairos/backend/.env
chmod 600 /opt/kairos/backend/.env
```

Completar obligatoriamente:

- `FRONTEND_URLS`: URL exacta de Hostinger, sin ruta ni `/` final.
- `PUBLIC_API_URL`: dominio HTTPS público de la API, sin `/api`.
- `MONGODB_URI`: conservar la conexión real de MongoDB Atlas.
- `JWT_SECRET`: cadena aleatoria privada de al menos 32 caracteres.
- `GOOGLE_APPLICATION_CREDENTIALS`: ruta Linux del nuevo JSON Firebase.

Guardar Firebase fuera del repositorio:

```bash
sudo mkdir -p /opt/kairos/secrets
sudo chown ubuntu:ubuntu /opt/kairos/secrets
chmod 700 /opt/kairos/secrets
```

Copiar el JSON como `/opt/kairos/secrets/firebase-clave.json` y ejecutar:

```bash
chmod 600 /opt/kairos/secrets/firebase-clave.json
```

La clave Firebase que se compartió anteriormente debe revocarse y sustituirse
antes de la entrega. Nunca se debe ejecutar `git add` sobre `.env` ni el JSON.

MongoDB Atlas debe aceptar conexiones desde la IP pública de la instancia.

## 4. Instalar y arrancar systemd

La plantilla enlaza Express solamente a `127.0.0.1:3000`; Nginx será el único
servicio público:

```bash
sudo cp /opt/kairos/deploy/aws/kairos-api.service /etc/systemd/system/kairos-api.service
sudo systemctl daemon-reload
sudo systemctl enable kairos-api
sudo systemctl restart kairos-api
sudo systemctl status kairos-api --no-pager
curl -i http://127.0.0.1:3000/api/salud
```

La última orden debe devolver `HTTP/1.1 200` y JSON con `"ok":true`.

Si `which node` no devuelve `/usr/bin/node`, corregir `ExecStart` dentro de
`/etc/systemd/system/kairos-api.service`.

## 5. Configurar Nginx

```bash
sudo cp /opt/kairos/deploy/aws/nginx-kairos-api.conf /etc/nginx/sites-available/kairos-api
sudo nano /etc/nginx/sites-available/kairos-api
```

Reemplazar `API_DOMAIN_OR_IP` por `3.131.94.209` durante el diagnóstico o por
el dominio definitivo, por ejemplo `api.ejemplo.com`.

Después:

```bash
sudo ln -sfn /etc/nginx/sites-available/kairos-api /etc/nginx/sites-enabled/kairos-api
sudo nginx -t
sudo systemctl reload nginx
curl -i http://3.131.94.209/api/salud
```

Si todavía devuelve `502`, comparar:

```bash
curl -i http://127.0.0.1:3000/api/salud
sudo tail -n 100 /var/log/nginx/error.log
```

## 6. Activar dominio y HTTPS

En el proveedor DNS crear:

```text
Tipo: A
Nombre: api
Valor: 3.131.94.209
```

Cuando `api.ejemplo.com` resuelva a la instancia:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.ejemplo.com
sudo nginx -t
curl -i https://api.ejemplo.com/api/salud
```

En el Security Group permitir `80` y `443` desde Internet. El puerto `3000` no
debe publicarse. Limitar `22` a la IP del administrador.

Actualizar `/opt/kairos/backend/.env`:

```dotenv
FRONTEND_URLS=https://nombre-disponible.hostingersite.com
PUBLIC_API_URL=https://api.ejemplo.com
```

Aplicar:

```bash
sudo systemctl restart kairos-api
sudo journalctl -u kairos-api -n 80 --no-pager
```

## 7. Verificación que se entrega al equipo

```bash
curl -i https://api.ejemplo.com/api/salud
curl -i -X OPTIONS https://api.ejemplo.com/api/auth/login \
  -H "Origin: https://nombre-disponible.hostingersite.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"
```

La segunda respuesta debe incluir:

```text
Access-Control-Allow-Origin: https://nombre-disponible.hostingersite.com
```

## Actualizaciones futuras

```bash
cd /opt/kairos
git pull --ff-only origin main
npm ci --omit=dev --prefix backend
sudo systemctl restart kairos-api
sudo systemctl status kairos-api --no-pager
```
