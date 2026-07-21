declare global {
  interface Window {
    __KAIROS_CONFIG__?: { apiUrl?: string };
  }
}

const runtimeApiUrl = window.__KAIROS_CONFIG__?.apiUrl?.trim().replace(/\/+$/, '');

export const environment = {
  production: false,
  // config.js permite cambiar de servidor sin volver a compilar Angular.
  apiUrl: runtimeApiUrl || 'http://localhost:3000/api',
  firebase: {
    apiKey: 'AIzaSyAqWkm7LhEhD3gAMO-J-g2qGv06KKjTqTA',
    authDomain: 'prueba-bca78.firebaseapp.com',
    projectId: 'prueba-bca78',
    storageBucket: 'prueba-bca78.firebasestorage.app',
    messagingSenderId: '175523467755',
    appId: '1:175523467755:web:3de9e3e761c41548a809ae',
    measurementId: 'G-7BSVXN2GMY',
  }
};
