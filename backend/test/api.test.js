import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import ExcelJS from 'exceljs';
import { app } from '../src/app.js';
import { demoStore } from '../src/data/demo-store.js';

const authorization = `Bearer ${jwt.sign({ sub: '66a000000000000000000010', rol: 'HIJO_ADMIN' }, 'demo-secret')}`;
const adultAuthorization = `Bearer ${jwt.sign({ sub: '66a000000000000000000011', rol: 'ADULTO_MAYOR' }, 'demo-secret')}`;
const binaryParser = (response, callback) => {
  const chunks = [];
  response.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
  response.on('end', () => callback(null, Buffer.concat(chunks)));
};

test('GET /api/pacientes/:id/resumen respeta el contrato', async () => {
  const response = await request(app).get(`/api/pacientes/${demoStore.patientId}/resumen`).set('Authorization', authorization);
  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.data.paciente._id, demoStore.patientId);
});

test('POST /api/auth/login vincula la cuenta del adulto con su paciente', async () => {
  const response = await request(app).post('/api/auth/login').send({ correo: 'carlos@salud.ec', password: 'Admin123' });
  assert.equal(response.status, 200);
  assert.equal(response.body.data.usuario.rol, 'ADULTO_MAYOR');
  assert.equal(response.body.data.usuario.pacienteId, demoStore.patientId);
});

test('GET /api/pacientes/:id/resumen-adulto entrega el inicio del paciente', async () => {
  const response = await request(app).get(`/api/pacientes/${demoStore.patientId}/resumen-adulto`).set('Authorization', authorization);
  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.data.paciente._id, demoStore.patientId);
  assert.equal(typeof response.body.data.tomasPendientes, 'number');
});

test('PATCH /api/tomas/:id/confirmar registra una toma desde la app', async () => {
  const response = await request(app).patch('/api/tomas/t3/confirmar').set('Authorization', authorization).send({ metodoConfirmacion: 'APP' });
  assert.equal(response.status, 200);
  assert.equal(response.body.data.estado, 'TOMADA');
  assert.equal(response.body.data.metodoConfirmacion, 'APP');
});

test('POST /api/medicamentos rechaza horarios repetidos', async () => {
  const response = await request(app).post('/api/medicamentos').set('Authorization', authorization).send({ pacienteId: demoStore.patientId, nombre: 'Prueba', concentracion: '10 mg', dosis: '1 tableta', horarios: ['08:00', '08:00'] });
  assert.equal(response.status, 422);
  assert.equal(response.body.ok, false);
});

test('PATCH /api/alertas/:id/leida marca una alerta', async () => {
  const response = await request(app).patch('/api/alertas/a1/leida').set('Authorization', authorization);
  assert.equal(response.status, 200);
  assert.equal(response.body.data.leida, true);
});

test('POST /api/pacientes registra al padre desde el administrador', async () => {
  const response = await request(app).post('/api/pacientes').set('Authorization', authorization).send({
    nombre: 'Roberto Andrade', edad: 74, fechaNacimiento: '1952-02-14',
    diagnosticos: ['Hipertensión'], telefonoContacto: '+593987654321',
    dispositivoId: 'ESP32-002', activo: true,
    correoAcceso: 'roberto@salud.ec', passwordAcceso: 'Roberto123'
  });
  assert.equal(response.status, 201);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.data.nombre, 'Roberto Andrade');
  assert.equal(response.body.data.correoAcceso, 'roberto@salud.ec');

  const loginAdulto = await request(app).post('/api/auth/login').send({ correo: 'roberto@salud.ec', password: 'Roberto123' });
  assert.equal(loginAdulto.status, 200);
  assert.equal(loginAdulto.body.data.usuario.pacienteId, response.body.data._id);
});

test('POST /api/pacientes limita cada administrador a 2 adultos', async () => {
  const response = await request(app).post('/api/pacientes').set('Authorization', authorization).send({
    nombre: 'Teresa Andrade', edad: 72, fechaNacimiento: '1954-03-12',
    diagnosticos: [], telefonoContacto: '+593987654322', dispositivoId: 'ESP32-003', activo: true,
    correoAcceso: 'teresa@salud.ec', passwordAcceso: 'Teresa123'
  });
  assert.equal(response.status, 409);
  assert.match(response.body.mensaje, /máximo de 2/i);
});

test('POST /api/medicamentos/receta registra varios medicamentos juntos', async () => {
  const response = await request(app).post('/api/medicamentos/receta').set('Authorization', authorization).send({
    medicamentos: [
      { pacienteId: demoStore.patientId, nombre: 'Enalapril', concentracion: '10 mg', dosis: '1 tableta', horarios: ['07:30'], frecuencia: 'DIARIA', indicaciones: 'Con agua', recetaMedico: 'Dra. Elena Mora', recetaFecha: '2026-07-20', recetaObservacion: 'Tratamiento por 30 días', activo: true },
      { pacienteId: demoStore.patientId, nombre: 'Calcio', concentracion: '600 mg', dosis: '1 tableta', horarios: ['18:00'], frecuencia: 'DIARIA', indicaciones: 'Después de comer', recetaMedico: 'Dra. Elena Mora', recetaFecha: '2026-07-20', recetaObservacion: 'Tratamiento por 30 días', activo: true }
    ]
  });
  assert.equal(response.status, 201);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.data.length, 2);
  assert.equal(response.body.data[0].recetaMedico, 'Dra. Elena Mora');
  assert.equal(response.body.data[0].recetaObservacion, 'Tratamiento por 30 días');
});

test('GET /api/pacientes/:id/exportar genera un Excel real con tres hojas', async () => {
  const response = await request(app)
    .get(`/api/pacientes/${demoStore.patientId}/exportar?formato=xlsx&seccion=todas`)
    .set('Authorization', authorization)
    .buffer(true)
    .parse(binaryParser);

  assert.equal(response.status, 200);
  assert.match(response.headers['content-type'], /spreadsheetml/);
  assert.match(response.headers['content-disposition'], /kairos-historial-carlos-perez.*\.xlsx/);
  assert.equal(Buffer.isBuffer(response.body), true);
  assert.equal(response.body.subarray(0, 2).toString(), 'PK');

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(response.body);
  assert.deepEqual(workbook.worksheets.map((sheet) => sheet.name), ['Resumen', 'Medicamentos', 'Salud']);
  assert.equal(workbook.getWorksheet('Resumen').getCell('B3').value, 'Carlos Pérez');
});

test('GET /api/pacientes/:id/exportar genera un PDF real y aplica filtros', async () => {
  const response = await request(app)
    .get(`/api/pacientes/${demoStore.patientId}/exportar?formato=pdf&seccion=salud&desde=2020-01-01&hasta=2030-12-31`)
    .set('Authorization', authorization)
    .buffer(true)
    .parse(binaryParser);

  assert.equal(response.status, 200);
  assert.match(response.headers['content-type'], /application\/pdf/);
  assert.equal(Buffer.isBuffer(response.body), true);
  assert.equal(response.body.subarray(0, 5).toString(), '%PDF-');
  assert.ok(response.body.length > 1500);
});

test('la exportación rechaza fechas inválidas y cuentas de adulto', async () => {
  const invalidDates = await request(app)
    .get(`/api/pacientes/${demoStore.patientId}/exportar?formato=pdf&desde=2030-01-01&hasta=2020-01-01`)
    .set('Authorization', authorization);
  assert.equal(invalidDates.status, 422);

  const adultRequest = await request(app)
    .get(`/api/pacientes/${demoStore.patientId}/exportar?formato=xlsx`)
    .set('Authorization', adultAuthorization);
  assert.equal(adultRequest.status, 403);
});
