// Modo local temporal: usa el mismo equipo/IP donde se abrió Angular.
// 127.0.0.1 evita conflictos con otros servicios locales que escuchen por IPv6.
const kairosApiHost = window.location.hostname === 'localhost'
  ? '127.0.0.1'
  : window.location.hostname;
window.__KAIROS_CONFIG__ = {
  apiUrl: `${window.location.protocol}//${kairosApiHost}:3000/api`
};

// Para volver a AWS, reemplaza apiUrl por: 'http://3.131.94.209/api'
