require('dotenv').config();
const app = require('./app');
const { connectDatabase, disconnectDatabase } = require('./config/database');
const { validateEnvironment } = require('./config/env');

const port = Number(process.env.PORT) || 4000;
let server;

async function start() {
  try {
    validateEnvironment();
    await connectDatabase();
    server = app.listen(port, () => console.log(`API KAIRÓS disponible en http://localhost:${port}/api`));
  } catch (error) {
    console.error(`No se pudo iniciar la API: ${error.message}`);
    process.exitCode = 1;
  }
}

async function shutdown(signal) {
  console.log(`\n${signal}: cerrando servidor...`);
  if (server) await new Promise((resolve) => server.close(resolve));
  await disconnectDatabase();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (error) => console.error('Promesa no controlada:', error));

start();
