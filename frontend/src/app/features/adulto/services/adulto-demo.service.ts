import { Injectable, computed, signal } from '@angular/core';
import { HistorialToma, MedicamentoHoy, Medicion } from '../models/adulto.models';

@Injectable({ providedIn: 'root' })
export class AdultoDemoService {
  readonly pacienteId = 'CARLOS-PEREZ-DEMO';
  readonly telefonoHijo = '+593999999999';

  readonly medicamentos = signal<MedicamentoHoy[]>([
    { _id: 'toma-1', nombre: 'Losartán', concentracion: '50 mg', dosis: '1 tableta', horaProgramada: '08:00', indicaciones: 'Tomar después del desayuno', estado: 'PENDIENTE' },
    { _id: 'toma-2', nombre: 'Metformina', concentracion: '850 mg', dosis: '1 tableta', horaProgramada: '13:00', indicaciones: 'Tomar con el almuerzo', estado: 'TOMADA' },
    { _id: 'toma-3', nombre: 'Atorvastatina', concentracion: '20 mg', dosis: '1 tableta', horaProgramada: '22:00', indicaciones: 'Tomar antes de dormir', estado: 'TOMADA' },
  ]);

  readonly mediciones = signal<Medicion[]>([
    { fechaHora: '12 may', pulsaciones: 68, spo2: 95, estadoSalud: 'NORMAL' },
    { fechaHora: '13 may', pulsaciones: 78, spo2: 96, estadoSalud: 'NORMAL' },
    { fechaHora: '14 may', pulsaciones: 74, spo2: 96, estadoSalud: 'NORMAL' },
    { fechaHora: '15 may', pulsaciones: 82, spo2: 97, estadoSalud: 'NORMAL' },
    { fechaHora: '16 may', pulsaciones: 73, spo2: 96, estadoSalud: 'NORMAL' },
    { fechaHora: '17 may', pulsaciones: 66, spo2: 95, estadoSalud: 'NORMAL' },
    { fechaHora: '18 may', pulsaciones: 72, spo2: 96, estadoSalud: 'NORMAL' },
  ]);

  readonly historialTomas: HistorialToma[] = [
    { fecha: 'Hoy', tomadas: 2, total: 3 }, { fecha: 'Ayer', tomadas: 3, total: 3 },
    { fecha: 'Sábado', tomadas: 3, total: 3 }, { fecha: 'Viernes', tomadas: 2, total: 3 },
    { fecha: 'Jueves', tomadas: 3, total: 3 }, { fecha: 'Miércoles', tomadas: 3, total: 3 },
    { fecha: 'Martes', tomadas: 3, total: 3 },
  ];

  readonly proximaPastilla = computed(() => this.medicamentos().find((m) => m.estado === 'PENDIENTE'));
  readonly ultimaMedicion = computed(() => this.mediciones()[this.mediciones().length - 1]);

  confirmarToma(tomaId: string): void {
    this.medicamentos.update((lista) => lista.map((m) => m._id === tomaId ? { ...m, estado: 'TOMADA' } : m));
  }
}
