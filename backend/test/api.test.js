import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { demoStore } from '../src/data/demo-store.js';

const authorization = `Bearer ${jwt.sign({ sub: '66a000000000000000000010', rol: 'HIJO_ADMIN' }, 'demo-secret')}`;

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
    dispositivoId: 'ESP32-001', activo: true
  });
  assert.equal(response.status, 201);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.data.nombre, 'Roberto Andrade');
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
