# Panel del adulto mayor

Frontend Angular del **Sistema de Monitoreo de Salud y Medicación**.

## Ejecutar

```bash
npm install
npm start
```

Abra `http://localhost:4200/adulto/inicio`.

## Rutas

- `/adulto/inicio`: resumen del día, salud y recordatorios.
- `/adulto/medicinas`: medicinas, confirmación e historial de tomas.
- `/adulto/salud`: medición actual e historial sencillo.
- `/adulto/ayuda`: llamada al hijo e instrucciones del pulsador.

Actualmente la interfaz usa `AdultoDemoService` para poder probar todo el recorrido sin backend. Los servicios HTTP oficiales están en `src/app/core/services` y apuntan a `http://localhost:3000/api` mediante `environment.ts`.

## Verificar

```bash
npm run build
```
