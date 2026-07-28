import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../src/app.js';
import { Usuario } from '../src/models/Usuario.js';
import { Paciente } from '../src/models/Paciente.js';
import { Dispositivo } from '../src/models/Dispositivo.js';
import { Medicion } from '../src/models/Medicion.js';
import { persistFirebaseReading } from '../src/services/firebase-sync.service.js';
import { buildExcelReport, buildPdfReport, getReportData } from '../src/services/reporte.service.js';

const uri = process.env.MONGODB_TEST_URI || process.env.MONGODB_URI;
const databaseName = 'kairos_integration_test';

test('MongoDB persiste relaciones y deduplica eventos de Firebase', { skip: !uri }, async () => {
  assert.match(databaseName, /^kairos_[a-z_]*test$/, 'La prueba sólo puede usar una base aislada de test');
  await mongoose.connect(uri, { dbName: databaseName, serverSelectionTimeoutMS: 15_000 });

  try {
    await mongoose.connection.dropDatabase();
    await Promise.all([Usuario.init(), Paciente.init(), Dispositivo.init(), Medicion.init()]);

    const registration = await request(app).post('/api/auth/register').send({
      nombre: 'Administrador Test', correo: 'admin.mongodb.test@kairos.local',
      telefono: '+593990001122', password: 'MongoSeguro123',
    });
    assert.equal(registration.status, 201);
    assert.equal(registration.body.data.usuario.rol, 'HIJO_ADMIN');
    const admin = await Usuario.findById(registration.body.data.usuario._id);
    assert.ok(admin);
    assert.notEqual(admin.passwordHash, 'MongoSeguro123');
    const patientRegistration = await request(app).post('/api/pacientes')
      .set('Authorization', `Bearer ${registration.body.data.token}`)
      .send({
        nombre: 'Paciente Test', edad: 76, fechaNacimiento: '1950-01-01',
        diagnosticos: [], telefonoContacto: '+593000000000', dispositivoId: 'esp32-mongo-test',
        activo: true, correoAcceso: 'adulto.mongodb.test@kairos.local', passwordAcceso: 'AdultoSeguro123',
      });
    assert.equal(patientRegistration.status, 201);
    const paciente = await Paciente.findById(patientRegistration.body.data._id);
    const linkedDevice = await Dispositivo.findOne({ dispositivoId: 'ESP32-MONGO-TEST' });
    assert.ok(linkedDevice);
    assert.equal(String(linkedDevice.pacienteId), String(paciente._id));
    assert.equal(linkedDevice.estado, 'DESCONECTADO');

    const payload = { dispositivoId: 'ESP32-MONGO-TEST', pulsaciones: 74, spo2: 97, timestamp: '2026-07-21T10:05:00.000Z' };
    const first = await persistFirebaseReading(payload, 'lecturas/mongo-test-1');
    const duplicate = await persistFirebaseReading(payload, 'lecturas/mongo-test-1');

    assert.equal(first.inserted, true);
    assert.equal(duplicate.inserted, false);
    assert.equal(await Medicion.countDocuments({ firebaseEventId: 'lecturas/mongo-test-1' }), 1);
    const stored = await Medicion.findOne({ firebaseEventId: 'lecturas/mongo-test-1' }).lean();
    assert.equal(String(stored.pacienteId), String(paciente._id));
    assert.equal(stored.estadoSalud, 'NORMAL');
    const device = await Dispositivo.findOne({ dispositivoId: 'ESP32-MONGO-TEST' }).lean();
    assert.equal(device.estado, 'CONECTADO');
    assert.equal(device.ultimaConexion.toISOString(), '2026-07-21T10:05:00.000Z');

    const reportData = await getReportData({
      pacienteId: String(paciente._id), adminId: String(admin._id),
      seccion: 'todas', desde: '2026-07-21', hasta: '2026-07-21',
    });
    assert.equal(reportData.paciente.nombre, 'Paciente Test');
    assert.equal(reportData.mediciones.length, 1);
    const [excel, pdf] = await Promise.all([buildExcelReport(reportData), buildPdfReport(reportData)]);
    assert.equal(excel.subarray(0, 2).toString(), 'PK');
    assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
    assert.equal(pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)?.length || 0, 1);
  } finally {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
