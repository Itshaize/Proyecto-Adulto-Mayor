import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { once } from 'node:events';
import { tmpdir } from 'node:os';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const profile = await mkdtemp(path.join(tmpdir(), 'salud-visual-'));
const output = path.resolve('artifacts');
const debugPort = 9300 + Math.floor(Math.random() * 500);
await mkdir(output, { recursive: true });

const chrome = spawn(chromePath, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, '--window-size=1440,1000', 'about:blank'
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitForChrome() {
  for (let attempt = 0; attempt < 40; attempt++) {
    try { const response = await fetch(`http://127.0.0.1:${debugPort}/json/version`); if (response.ok) return; } catch {}
    await sleep(250);
  }
  throw new Error('Chrome no inició el puerto de depuración.');
}

let socket;
const pending = new Map();
let messageId = 0;
const call = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++messageId;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
async function waitForSelector(selector) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const result = await call('Runtime.evaluate', { expression: `Boolean(document.querySelector(${JSON.stringify(selector)}))`, returnByValue: true });
    if (result.result.value) return;
    await sleep(250);
  }
  const body = await call('Runtime.evaluate', { expression: 'document.body.innerText', returnByValue: true });
  throw new Error(`No apareció ${selector}. Contenido: ${body.result.value}`);
}
async function waitForText(selector, text) {
  for (let attempt = 0; attempt < 60; attempt++) {
    const result = await call('Runtime.evaluate', { expression: `document.querySelector(${JSON.stringify(selector)})?.textContent?.includes(${JSON.stringify(text)}) || false`, returnByValue: true });
    if (result.result.value) return;
    await sleep(250);
  }
  throw new Error(`No apareció el texto ${text} en ${selector}.`);
}

try {
  await waitForChrome();
  const loginResponse = await fetch('http://localhost:3000/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ correo: 'daniel@salud.ec', password: 'Admin123' }) }).then((response) => response.json());
  if (!loginResponse.ok) throw new Error(`No se pudo iniciar la sesión visual: ${loginResponse.mensaje}`);
  const target = await fetch(`http://127.0.0.1:${debugPort}/json/new?http://localhost:3000/`, { method: 'PUT' }).then((response) => response.json());
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.method === 'Runtime.exceptionThrown') console.error('Chrome:', message.params.exceptionDetails?.exception?.description || message.params.exceptionDetails?.text);
    if (!message.id || !pending.has(message.id)) return;
    const handler = pending.get(message.id);
    pending.delete(message.id);
    message.error ? handler.reject(new Error(message.error.message)) : handler.resolve(message.result);
  });
  await call('Page.enable');
  await call('Runtime.enable');
  const downloads = path.join(profile, 'downloads');
  await mkdir(downloads, { recursive: true });
  await call('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads, eventsEnabled: true });
  await waitForSelector('.login-page');

  const loginShot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true });
  await writeFile(path.join(output, 'login-desktop.png'), Buffer.from(loginShot.data, 'base64'));

  await call('Page.navigate', { url: 'http://localhost:3000/registro' });
  await waitForSelector('.register-page');
  await sleep(500);
  const registerShot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true });
  await writeFile(path.join(output, 'registro-administrador.png'), Buffer.from(registerShot.data, 'base64'));

  const usuario = JSON.stringify({ _id: '66a000000000000000000010', nombre: 'Daniel Pérez', correo: 'daniel@salud.ec', rol: 'HIJO_ADMIN' });
  await call('Runtime.evaluate', { expression: `localStorage.setItem('salud_token',${JSON.stringify(loginResponse.data.token)});localStorage.setItem('salud_usuario',${JSON.stringify(usuario)});location.href='/'` });
  await waitForSelector('.dashboard');
  await sleep(1200);
  const desktopShot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true });
  await writeFile(path.join(output, 'dashboard-desktop.png'), Buffer.from(desktopShot.data, 'base64'));

  await call('Runtime.evaluate', { expression: `document.querySelector('a[href="/admin/historial"]')?.click()` });
  await waitForSelector('.export-panel');
  await sleep(500);
  const exportShot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true });
  await writeFile(path.join(output, 'historial-exportar-desktop.png'), Buffer.from(exportShot.data, 'base64'));
  await call('Runtime.evaluate', { expression: `document.querySelectorAll('.export-button')[0]?.click()` });
  await waitForText('.success-message', 'Excel');
  await call('Runtime.evaluate', { expression: `document.querySelectorAll('.export-button')[1]?.click()` });
  await waitForText('.success-message', 'PDF');

  await call('Runtime.evaluate', { expression: `document.querySelector('a[href="/admin/paciente"]')?.click()` });
  await waitForSelector('.patient-switcher');
  await call('Runtime.evaluate', { expression: `document.querySelector('.register-button')?.click()` });
  await waitForSelector('#correo-acceso');
  await sleep(500);
  const patientShot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true });
  await writeFile(path.join(output, 'registro-paciente.png'), Buffer.from(patientShot.data, 'base64'));

  await call('Runtime.evaluate', { expression: `document.querySelector('a[href="/admin/medicamentos"]')?.click()` });
  await waitForSelector('.recipe-add');
  await call('Runtime.evaluate', { expression: `document.querySelector('.recipe-add')?.click()` });
  await waitForSelector('.recipe-modal');
  await sleep(500);
  const recipeShot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true });
  await writeFile(path.join(output, 'receta-completa.png'), Buffer.from(recipeShot.data, 'base64'));

  const adultoResponse = await fetch('http://localhost:3000/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ correo: 'carlos@salud.ec', password: 'Admin123' }) }).then((response) => response.json());
  if (!adultoResponse.ok) throw new Error(`No se pudo iniciar la sesión del adulto: ${adultoResponse.mensaje}`);
  const adultoUsuario = JSON.stringify(adultoResponse.data.usuario);
  await call('Runtime.evaluate', { expression: `localStorage.setItem('salud_token',${JSON.stringify(adultoResponse.data.token)});localStorage.setItem('salud_usuario',${JSON.stringify(adultoUsuario)});location.href='/adulto/inicio'` });
  await waitForSelector('.dashboard-grid');
  await sleep(1200);
  const adultoShot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true });
  await writeFile(path.join(output, 'adulto-desktop.png'), Buffer.from(adultoShot.data, 'base64'));

  await call('Runtime.evaluate', { expression: `document.querySelector('a[href="/adulto/medicinas"]')?.click()` });
  await waitForSelector('.medicine-cards');
  await sleep(500);
  const adultoMedicinasShot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true });
  await writeFile(path.join(output, 'adulto-medicinas.png'), Buffer.from(adultoMedicinasShot.data, 'base64'));

  await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true, screenWidth: 390, screenHeight: 844 });
  await call('Page.navigate', { url: 'http://localhost:3000/adulto/inicio' });
  await waitForSelector('.dashboard-grid');
  await sleep(1200);
  const adultoMobileShot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true });
  await writeFile(path.join(output, 'adulto-mobile.png'), Buffer.from(adultoMobileShot.data, 'base64'));

  await call('Runtime.evaluate', { expression: `localStorage.setItem('salud_token',${JSON.stringify(loginResponse.data.token)});localStorage.setItem('salud_usuario',${JSON.stringify(usuario)});location.href='/admin/inicio'` });
  await waitForSelector('.dashboard');
  await sleep(1200);
  const mobileShot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true });
  await writeFile(path.join(output, 'dashboard-mobile.png'), Buffer.from(mobileShot.data, 'base64'));

  await call('Runtime.evaluate', { expression: `document.querySelector('a[href="/admin/historial"]')?.click()` });
  await waitForSelector('.export-panel');
  await sleep(500);
  const exportMobileShot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true });
  await writeFile(path.join(output, 'historial-exportar-mobile.png'), Buffer.from(exportMobileShot.data, 'base64'));

  const mobileLogout = await call('Runtime.evaluate', {
    expression: `(() => { const button = document.querySelector('.mobile-logout'); if (!button) return false; button.click(); return true; })()`,
    returnByValue: true,
  });
  if (!mobileLogout.result.value) throw new Error('No apareció el botón móvil para cerrar sesión.');
  await waitForSelector('.login-page');
  const sessionRemoved = await call('Runtime.evaluate', {
    expression: `!localStorage.getItem('salud_token') && !localStorage.getItem('salud_usuario')`,
    returnByValue: true,
  });
  if (!sessionRemoved.result.value) throw new Error('Cerrar sesión no limpió las credenciales locales.');
  console.info(`Capturas creadas en ${output}`);
} finally {
  if (socket) {
    try { await Promise.race([call('Browser.close'), sleep(1500)]); } catch {}
    socket.close();
  }
  await Promise.race([once(chrome, 'exit'), sleep(2500)]);
  if (chrome.exitCode === null) {
    const killer = spawn('taskkill.exe', ['/PID', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' });
    await Promise.race([once(killer, 'exit'), sleep(2500)]);
  }
  await sleep(600);
  for (let attempt = 0; attempt < 6; attempt++) {
    try { await rm(profile, { recursive: true, force: true }); break; }
    catch (error) { if (attempt === 5) console.warn(`No se pudo limpiar el perfil temporal: ${error.message}`); else await sleep(700); }
  }
}
