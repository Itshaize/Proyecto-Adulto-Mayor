import 'dotenv/config';
import { app } from './app.js';
import { connectDatabase } from './config/database.js';
import { startFirebaseSync, stopFirebaseSync } from './services/firebase-sync.service.js';

const port = Number(process.env.PORT || 3000);

connectDatabase(process.env.MONGODB_URI)
  .then(async (mongoConnected) => {
    await startFirebaseSync({ mongoConnected });
    const server = app.listen(port, () => console.info(`[API] http://localhost:${port}/api/salud`));
    const shutdown = () => {
      stopFirebaseSync();
      server.close(() => process.exit(0));
    };
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  })
  .catch((error) => {
    console.error('[API] No fue posible conectar con MongoDB:', error.message);
    process.exit(1);
  });
