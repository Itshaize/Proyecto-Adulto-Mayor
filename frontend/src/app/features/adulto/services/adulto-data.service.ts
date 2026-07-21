import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { MedicamentoService } from '../../../core/services/medicamento.service';
import { MedicionService } from '../../../core/services/medicion.service';
import { PacienteService } from '../../../core/services/paciente.service';
import { TomaService } from '../../../core/services/toma.service';
import { environment } from '../../../../environments/environment';
import { EstadoSalud, HistorialToma, MedicamentoHoy, Medicion } from '../models/adulto.models';
import { AdultoDemoService } from './adulto-demo.service';

/** Punto único de datos: demo en pruebas y API en la compilación de integración. */
@Injectable({ providedIn: 'root' })
export class AdultoDataService {
  private readonly demo = inject(AdultoDemoService);
  private readonly auth = inject(AuthService);
  private readonly pacientesApi = inject(PacienteService);
  private readonly medicamentosApi = inject(MedicamentoService);
  private readonly tomasApi = inject(TomaService);
  private readonly medicionesApi = inject(MedicionService);
  private readonly telefono = signal(environment.demoMode ? this.demo.telefonoHijo : '');

  readonly pacienteId = environment.demoMode ? this.demo.pacienteId : (this.auth.usuarioActual()?.pacienteId ?? '');
  readonly medicamentos = signal<MedicamentoHoy[]>(environment.demoMode ? this.demo.medicamentos() : []);
  readonly mediciones = signal<Medicion[]>(environment.demoMode ? this.demo.mediciones() : []);
  private readonly historial = signal<HistorialToma[]>(environment.demoMode ? this.demo.historialTomas : []);
  private readonly catalogoMedicamentos = signal<MedicamentoHoy[]>([]);
  readonly cargando = signal(!environment.demoMode);
  readonly error = signal('');
  readonly estadoGeneral = signal<EstadoSalud>('NORMAL');
  readonly proximaPastilla = computed(() => this.medicamentos().find((medicamento) => medicamento.estado === 'PENDIENTE'));
  readonly ultimaMedicion = signal<Medicion>(environment.demoMode
    ? this.demo.ultimaMedicion()
    : { fechaHora: '', pulsaciones: 0, spo2: 0, estadoSalud: 'REVISAR' });

  get telefonoHijo() { return this.telefono(); }
  get historialTomas() { return this.historial(); }

  constructor() { if (!environment.demoMode) this.cargarDatosReales(); }

  confirmarToma(tomaId: string): void {
    if (environment.demoMode) {
      this.demo.confirmarToma(tomaId);
      this.medicamentos.set(this.demo.medicamentos());
      return;
    }
    this.tomasApi.confirmarToma(tomaId).subscribe({
      next: () => this.medicamentos.update((lista) => lista.map((item) => item._id === tomaId ? { ...item, estado: 'TOMADA' } : item)),
      error: () => this.error.set('No fue posible confirmar la toma. Inténtelo nuevamente.'),
    });
  }

  private cargarDatosReales(): void {
    if (!this.pacienteId) { this.error.set('No se encontró un paciente asociado a la sesión.'); this.cargando.set(false); return; }
    this.pacientesApi.obtenerInicioAdulto(this.pacienteId).subscribe({ next: ({ data }) => { if (data.telefonoHijo) this.telefono.set(data.telefonoHijo); if (data.estadoGeneral) this.estadoGeneral.set(data.estadoGeneral); } });
    this.tomasApi.obtenerTomasHoy(this.pacienteId).subscribe({ next: ({ data }) => this.medicamentos.set(this.enriquecerTomas(data)), error: () => this.error.set('No fue posible cargar las medicinas.') });
    // Endpoint del módulo de medicamentos: enriquece la vista, pero no bloquea nuestras tomas si aún no está integrado.
    this.medicamentosApi.obtenerMedicamentosHoy(this.pacienteId).subscribe({
      next: ({ data }) => { this.catalogoMedicamentos.set(data); this.medicamentos.update((tomas) => this.enriquecerTomas(tomas)); },
      error: () => undefined,
    });
    this.tomasApi.obtenerHistorial(this.pacienteId, 7).subscribe({
      next: ({ data }) => {
        const grouped = new Map<string, HistorialToma>();
        for (const toma of data) {
          const current = grouped.get(toma.fechaProgramada) ?? { fecha: toma.fechaProgramada, tomadas: 0, total: 0 };
          current.total += 1;
          if (toma.estado === 'TOMADA') current.tomadas += 1;
          grouped.set(toma.fechaProgramada, current);
        }
        this.historial.set([...grouped.values()].sort((a, b) => b.fecha.localeCompare(a.fecha)));
      },
      error: () => this.error.set('No fue posible cargar el historial de tomas.'),
    });
    this.medicionesApi.obtenerSaludActual(this.pacienteId).subscribe({
      next: ({ data }) => this.ultimaMedicion.set(data),
      error: () => this.error.set('No fue posible cargar la última medición.'),
    });
    this.medicionesApi.obtenerHistorialSalud(this.pacienteId, 7).subscribe({
      next: ({ data }) => {
        const ordered = [...data].sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
        this.mediciones.set(ordered);
        if (!this.ultimaMedicion().fechaHora && ordered.length) this.ultimaMedicion.set(ordered[ordered.length - 1]);
        this.cargando.set(false);
      },
      error: () => { this.error.set('No fue posible cargar la información de salud.'); this.cargando.set(false); },
    });
  }

  private enriquecerTomas(tomas: MedicamentoHoy[]): MedicamentoHoy[] {
    const catalogo = this.catalogoMedicamentos();
    return tomas.map((toma) => {
      const medicamento = catalogo.find((item) => item._id === toma.medicamentoId);
      return medicamento ? { ...toma, nombre: medicamento.nombre, concentracion: medicamento.concentracion, dosis: medicamento.dosis, indicaciones: medicamento.indicaciones } : toma;
    });
  }
}
