import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

const APP_NAME = 'kairos-backend';

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function getFirebaseConfigStatus() {
  const databaseURL = clean(process.env.FIREBASE_DATABASE_URL);
  const explicitCredentials = Boolean(
    clean(process.env.FIREBASE_PROJECT_ID)
    && clean(process.env.FIREBASE_CLIENT_EMAIL)
    && clean(process.env.FIREBASE_PRIVATE_KEY),
  );
  const applicationCredentials = Boolean(clean(process.env.GOOGLE_APPLICATION_CREDENTIALS));

  return {
    configured: Boolean(databaseURL && (explicitCredentials || applicationCredentials)),
    databaseURLConfigured: Boolean(databaseURL),
    credentialsConfigured: explicitCredentials || applicationCredentials,
    credentialMode: explicitCredentials ? 'variables-entorno' : applicationCredentials ? 'archivo-servicio' : 'sin-configurar',
  };
}

export function getFirebaseDatabase() {
  const status = getFirebaseConfigStatus();
  if (!status.configured) return null;

  const existingApp = getApps().find((app) => app.name === APP_NAME);
  if (existingApp) return getDatabase(existingApp);

  const projectId = clean(process.env.FIREBASE_PROJECT_ID);
  const clientEmail = clean(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKey = clean(process.env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, '\n');
  const credential = projectId && clientEmail && privateKey
    ? cert({ projectId, clientEmail, privateKey })
    : applicationDefault();

  const firebaseApp = initializeApp({
    credential,
    databaseURL: clean(process.env.FIREBASE_DATABASE_URL),
    ...(projectId ? { projectId } : {}),
  }, APP_NAME);

  return getDatabase(firebaseApp);
}
