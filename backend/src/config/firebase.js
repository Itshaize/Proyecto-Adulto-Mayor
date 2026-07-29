import { GoogleAuth } from 'google-auth-library';

const FIREBASE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/firebase.database',
];

let firebaseClient = null;

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

function createAuth() {
  const projectId = clean(process.env.FIREBASE_PROJECT_ID);
  const clientEmail = clean(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKey = clean(process.env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, '\n');
  const credentials = projectId && clientEmail && privateKey
    ? { project_id: projectId, client_email: clientEmail, private_key: privateKey }
    : undefined;

  return new GoogleAuth({
    scopes: FIREBASE_SCOPES,
    ...(credentials ? { credentials } : {}),
  });
}

export function getFirebaseClient() {
  const status = getFirebaseConfigStatus();
  if (!status.configured) return null;
  if (firebaseClient) return firebaseClient;

  const databaseURL = clean(process.env.FIREBASE_DATABASE_URL).replace(/\/+$/, '');
  const auth = createAuth();

  firebaseClient = {
    async list(path, limit = 100) {
      const accessToken = await auth.getAccessToken();
      if (!accessToken) throw new Error('Google no entregó un token de acceso para Firebase');

      const normalizedPath = String(path || '').replace(/^\/+|\/+$/g, '');
      const query = new URLSearchParams({
        auth: accessToken,
        orderBy: '"$key"',
        limitToLast: String(limit),
      });
      const response = await fetch(`${databaseURL}/${normalizedPath}.json?${query}`);
      if (!response.ok) throw new Error(`Firebase respondió ${response.status}: ${await response.text()}`);
      return (await response.json()) ?? {};
    },
  };

  return firebaseClient;
}
