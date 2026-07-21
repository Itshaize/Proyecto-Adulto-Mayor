import { getApps, initializeApp } from 'firebase/app';
import { environment } from '../../../environments/environment';

export const firebaseApp = getApps()[0] ?? initializeApp(environment.firebase);

export async function initializeFirebaseAnalytics(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const { getAnalytics, isSupported } = await import('firebase/analytics');
    if (await isSupported()) getAnalytics(firebaseApp);
  } catch (error) {
    console.warn('[Firebase] Analytics no está disponible en este navegador.', error);
  }
}
