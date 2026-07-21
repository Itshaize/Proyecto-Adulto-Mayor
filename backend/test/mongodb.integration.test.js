import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { Usuario } from '../src/models/Usuario.js';
import { Paciente } from '../src/models/Paciente.js';
import { Dispositivo } from '../src/models/Dispositivo.js';
import { Medicion } from '../src/models/Medicion.js';
import { persistFirebaseReading } from '../src/services/firebase-sync.service.js';

const uri = process.env.MONGODB_TEST_URI || process.env.MONGODB_URI;
const databaseName = 'kairos_integration_test';

test('MongoDB persiste relaciones y deduplica eventos de Firebase', { skip: !uri }, async () => {
  assert.match(databaseName, /^kairos_[a-z_]*test$/, 'La prueba sólo puede usar una base aislada de test');
  await mongoose.connect(uri, { dbName: databaseName, serverSelectionTimeoutMS: 15_000 });

  try {
    await mongoose.connection.dropDatabase();
    await Promise.all([Usuario.init(), Paciente.init(), Dispositivo.init(), Medicion.init()]);

    const admin = await Usuario.create({
      nombre: 'Administrador Test', correo: 'admin.mongodb.test@kairos.local',
      passwordHash: 'hash-solo-prueba', rol: 'HIJO_ADMIN', activo: true,
    });
    const paciente = await Paciente.create({
      nombre: 'Paciente Test', edad: 76, fechaNacimiento: '1950-01-01',
      diagnosticos: [], telefonoContacto: '+593000000000', hijoAdminId: admin._id,
      dispositivoId: 'ESP32-MONGO-TEST', activo: true,
    });
    await Dispositivo.create({
      dispositivoId: 'ESP32-MONGO-TEST', pacienteId: paciente._id,
      estado: 'DESCONECTADO', ultimaConexion: new Date('2026-07-21T10:00:00.000Z'),
    });

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
  } finally {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
