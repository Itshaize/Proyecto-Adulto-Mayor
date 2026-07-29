import 'dotenv/config';
import { app } from './app.js';
import { connectDatabase } from './config/database.js';
import { startFirebaseSync, stopFirebaseSync } from './services/firebase-sync.service.js';
import { startSerialSync, stopSerialSync } from './services/serial-sync.service.js';

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';

connectDatabase(process.env.MONGODB_URI)
  .then(async (mongoConnected) => {
    await startFirebaseSync({ mongoConnected });
    await startSerialSync();
    const server = app.listen(port, host, () => console.info(`[API] escuchando en ${host}:${port}/api/salud`));
    const shutdown = () => {
      stopFirebaseSync();
      stopSerialSync();
      server.close(() => process.exit(0));
    };
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  })
  .catch((error) => {
    console.error('[API] No fue posible conectar con MongoDB:', error.message);
    process.exit(1);
  });
