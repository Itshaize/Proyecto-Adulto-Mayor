# Guía del frontend Angular en Hostinger

Hostinger aloja únicamente el frontend. MongoDB, Firebase Admin, JWT y Express
permanecen en AWS.

## Requisito previo

No publicar el paquete final hasta que esta ruta responda `200`:

```text
https://DOMINIO_API/api/salud
```

Una web de Hostinger con HTTPS no puede consumir
`http://3.131.94.209/api`; el navegador lo bloquea por contenido mixto.

## 1. Crear el sitio

En Hostinger elegir **Implementa tu app web** y usar un dominio propio o un
subdominio gratuito disponible `*.hostingersite.com`.

Anotar el origen exacto, por ejemplo:

```text
https://kairos-adulto-demo.hostingersite.com
```

Entregar esa URL al encargado de AWS para `FRONTEND_URLS`.

## 2. Generar el paquete

Desde la raíz del repositorio:

```bash
npm ci
npm ci --prefix frontend
npm run prepare:hostinger -- --api=https://DOMINIO_API/api
```

El comando:

1. compila Angular en producción;
2. coloca la URL pública de AWS en `config.js`;
3. agrega el fallback de rutas `.htaccess`;
4. genera:

```text
artifacts/hostinger-public_html/
artifacts/kairos-hostinger.tar.gz
```

El paquete nunca incluye `.env`, MongoDB, JWT ni la clave privada Firebase.

La herramienta rechaza por defecto una API HTTP pública. `--allow-http` existe
solo para diagnóstico y no debe usarse en la publicación HTTPS de Hostinger.

## 3. Subir a Hostinger

En el administrador de archivos:

1. Abrir `public_html`.
2. Retirar únicamente la página predeterminada del sitio nuevo.
3. Subir `kairos-hostinger.tar.gz`.
4. Extraerlo directamente dentro de `public_html`.
5. Confirmar que `index.html`, `config.js` y `.htaccess` estén en la raíz, no
   dentro de otra carpeta.

La regla `.htaccess` permite abrir directamente rutas como `/login`,
`/admin/inicio` y `/adulto/inicio` sin obtener 404.

## 4. Verificar

Abrir el sitio en una ventana privada y comprobar:

1. La URL usa HTTPS.
2. `/login` carga al refrescar.
3. En Network, `POST /api/auth/login` se dirige al dominio AWS.
4. No aparece `Mixed Content`.
5. Login, medicamentos, monitor, gráficas y notificaciones reciben datos.

Desde la raíz del repositorio:

```bash
npm run check:deployment -- \
  --api=https://DOMINIO_API/api \
  --origin=https://TU-SITIO.hostingersite.com
```

## Cambiar la API sin recompilar

Editar `public_html/config.js`:

```javascript
window.__KAIROS_CONFIG__ = {
  apiUrl: 'https://NUEVO_DOMINIO_API/api'
};
```

La plantilla desactiva la caché de este archivo para evitar que el navegador
conserve una dirección antigua.
