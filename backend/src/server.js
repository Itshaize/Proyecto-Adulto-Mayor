import 'dotenv/config';
import { app } from './app.js';
import { connectDatabase } from './config/database.js';

const port = Number(process.env.PORT || 3000);

connectDatabase(process.env.MONGODB_URI)
  .then(() => app.listen(port, () => console.info(`[API] http://localhost:${port}/api/salud`)))
  .catch((error) => {
    console.error('[API] No fue posible conectar con MongoDB:', error.message);
    process.exit(1);
  });

