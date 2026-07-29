import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { classifyHealth, normalizeFirebaseReading, selectPendingMedication } from '../src/services/firebase-sync.service.js';

test('normaliza el contrato de lectura enviado por el ESP32', () => {
  const reading = normalizeFirebaseReading({
    deviceId: 'ESP32-001',
    bpm: 72.4,
    oxigeno: 96,
    versionFirmware: '1.1.0',
    timestamp: 1_721_600_000,
  }, 'lecturas/evento-1');

  assert.equal(reading.dispositivoId, 'ESP32-001');
  assert.equal(reading.pulsaciones, 72);
  assert.equal(reading.spo2, 96);
  assert.equal(reading.origen, 'MAX30102');
  assert.equal(reading.versionFirmware, '1.1.0');
  assert.equal(reading.estadoSalud, 'NORMAL');
  assert.equal(reading.firebaseEventId, 'lecturas/evento-1');
  assert.equal(reading.fechaHora.toISOString(), '2024-07-21T22:13:20.000Z');
});

test('normaliza el pulsador como confirmación de medicamento', () => {
  const reading = normalizeFirebaseReading({
    dispositivoId: 'ESP32-001',
    origen: 'PULSADOR',
    timestamp: 1_721_600_000_000,
  }, 'lecturas/evento-boton-1');

  assert.equal(reading.origen, 'PULSADOR');
  assert.equal(reading.firebaseEventId, 'lecturas/evento-boton-1');
  assert.equal(reading.pulsaciones, null);
  assert.equal(reading.spo2, null);
});

test('el pulsador elige la toma vencida más cercana o la próxima del día', () => {
  const takes = [
    { _id: 'noche', horaProgramada: '20:00' },
    { _id: 'desayuno', horaProgramada: '08:00' },
    { _id: 'almuerzo', horaProgramada: '13:00' },
  ];
  assert.equal(selectPendingMedication(takes, '14:00')._id, 'almuerzo');
  assert.equal(selectPendingMedication(takes, '07:00')._id, 'desayuno');
  assert.equal(selectPendingMedication([], '14:00'), null);
});

test('rechaza lecturas imposibles antes de escribir en MongoDB', () => {
  assert.throws(
    () => normalizeFirebaseReading({ dispositivoId: 'ESP32-001', pulsaciones: 300, spo2: 96 }),
    /pulsaciones fuera del rango/i,
  );
  assert.throws(
    () => normalizeFirebaseReading({ dispositivoId: 'ESP32-001', pulsaciones: 72, spo2: 20 }),
    /SpO2 fuera del rango/i,
  );
});

test('clasifica normal, revisión y alerta', () => {
  assert.equal(classifyHealth(72, 96), 'NORMAL');
  assert.equal(classifyHealth(105, 94), 'REVISAR');
  assert.equal(classifyHealth(140, 88), 'ALERTA');
});

test('GET /api/integraciones/firebase/estado no expone secretos', async () => {
  const token = jwt.sign({ sub: '66a000000000000000000010', rol: 'HIJO_ADMIN' }, 'demo-secret');
  const response = await request(app)
    .get('/api/integraciones/firebase/estado')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(typeof response.body.data.configured, 'boolean');
  assert.equal(response.body.data.privateKey, undefined);
  assert.equal(response.body.data.clientEmail, undefined);
});

test('GET /api/integraciones/firebase/monitor entrega un estado seguro por defecto', async () => {
  const token = jwt.sign({ sub: '66a000000000000000000010', rol: 'HIJO_ADMIN' }, 'demo-secret');
  const response = await request(app)
    .get('/api/integraciones/firebase/monitor/ESP32-001')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.data.dispositivoId, 'ESP32-001');
  assert.equal(response.body.data.estado, 'ESPERANDO_CONEXION');
  assert.equal(response.body.data.conectado, false);
  assert.equal(response.body.data.dedoDetectado, false);
});
