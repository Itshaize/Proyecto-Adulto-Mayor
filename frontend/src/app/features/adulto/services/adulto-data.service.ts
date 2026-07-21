import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { MedicamentoService } from '../../../core/services/medicamento.service';
import { MedicionService } from '../../../core/services/medicion.service';
import { PacienteService } from '../../../core/services/paciente.service';
import { TomaService } from '../../../core/services/toma.service';
import { Medicamento, Toma } from '../../../core/models/domain.models';
import { EstadoSalud, HistorialToma, MedicamentoHoy, Medicion } from '../models/adulto.models';

/** Fachada del panel adulto conectada al mismo API y sesión que usa el administrador. */
@Injectable({ providedIn: 'root' })
export class AdultoDataService {
  private readonly auth = inject(AuthService);
  private readonly pacientesApi = inject(PacienteService);
  private readonly medicamentosApi = inject(MedicamentoService);
  private readonly tomasApi = inject(TomaService);
  private readonly medicionesApi = inject(MedicionService);
  private readonly telefono = signal('');
  readonly nombreHijo = signal('Su familiar');
  readonly nombrePaciente = signal('');
  private readonly historial = signal<HistorialToma[]>([]);

  readonly pacienteId = this.auth.usuario?.pacienteId ?? '';
  readonly medicamentos = signal<MedicamentoHoy[]>([]);
  readonly receta = signal<MedicamentoHoy[]>([]);
  readonly recetaMedico = signal('');
  readonly recetaFecha = signal('');
  readonly recetaObservacion = signal('');
  readonly mediciones = signal<Medicion[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly estadoGeneral = signal<EstadoSalud>('REVISAR');
  readonly ultimaMedicion = signal<Medicion>({ fechaHora: '', pulsaciones: 0, spo2: 0, estadoSalud: 'REVISAR' });
  readonly proximaPastilla = computed(() => this.medicamentos().find((medicamento) => medicamento.estado === 'PENDIENTE'));

  get telefonoHijo() { return this.telefono(); }
  get historialTomas() { return this.historial(); }

  constructor() { this.cargarDatos(); }

  confirmarToma(tomaId: string): void {
    this.error.set('');
    this.tomasApi.confirmarToma(tomaId).subscribe({
      next: () => {
        this.medicamentos.update((lista) => lista.map((item) => item._id === tomaId ? { ...item, estado: 'TOMADA' } : item));
        this.recalcularHistorialDeHoy();
      },
      error: () => this.error.set('No fue posible confirmar la toma. Inténtelo nuevamente.'),
    });
  }

  private cargarDatos(): void {
    if (!this.pacienteId) {
      this.error.set('No se encontró un paciente asociado a la sesión.');
      this.cargando.set(false);
      return;
    }

    forkJoin({
      resumen: this.pacientesApi.getResumenAdulto(this.pacienteId),
      tomasHoy: this.tomasApi.getHoy(this.pacienteId),
      historial: this.tomasApi.getByPaciente(this.pacienteId, 7),
      medicamentos: this.medicamentosApi.getByPaciente(this.pacienteId),
      ultima: this.medicionesApi.getUltima(this.pacienteId),
      mediciones: this.medicionesApi.getByPaciente(this.pacienteId, 7),
    }).subscribe({
      next: ({ resumen, tomasHoy, historial, medicamentos, ultima, mediciones }) => {
        this.telefono.set(resumen.data.telefonoHijo ?? '');
        this.nombreHijo.set(resumen.data.nombreHijo ?? 'Su familiar');
        this.nombrePaciente.set(resumen.data.paciente?.nombre ?? this.auth.usuario?.nombre ?? '');
        this.estadoGeneral.set(resumen.data.estadoGeneral ?? ultima.data.estadoSalud);
        this.ultimaMedicion.set(ultima.data);
        this.mediciones.set([...mediciones.data].sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime()));
        this.medicamentos.set(this.enriquecerTomas(tomasHoy.data, medicamentos.data));
        this.receta.set(medicamentos.data.filter((item) => item.activo).flatMap((item) => item.horarios.map((hora, index) => ({
          _id: `${item._id}-${index}`,
          medicamentoId: item._id,
          nombre: item.nombre,
          concentracion: item.concentracion,
          dosis: item.dosis,
          indicaciones: item.indicaciones,
          horaProgramada: hora,
          estado: 'PENDIENTE' as const,
        }))));
        const recetaConDatos = [...medicamentos.data].filter((item) => item.recetaMedico || item.recetaFecha || item.recetaObservacion).sort((a, b) => (b.recetaFecha ?? '').localeCompare(a.recetaFecha ?? ''))[0];
        this.recetaMedico.set(recetaConDatos?.recetaMedico ?? 'Profesional tratante');
        this.recetaFecha.set(recetaConDatos?.recetaFecha ?? '');
        this.recetaObservacion.set(recetaConDatos?.recetaObservacion ?? 'Siga el tratamiento según las indicaciones registradas.');
        this.historial.set(this.agruparHistorial(historial.data));
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No fue posible cargar la información. Verifique la conexión e inténtelo nuevamente.');
        this.cargando.set(false);
      },
    });
  }

  private enriquecerTomas(tomas: Toma[], catalogo: Medicamento[]): MedicamentoHoy[] {
    return tomas.map((toma) => {
      const medicamento = catalogo.find((item) => item._id === String(toma.medicamentoId));
      return {
        _id: toma._id,
        medicamentoId: String(toma.medicamentoId),
        nombre: toma.nombre ?? medicamento?.nombre ?? toma.medicamento ?? 'Medicamento',
        concentracion: toma.concentracion ?? medicamento?.concentracion ?? '',
        dosis: toma.dosis ?? medicamento?.dosis ?? '',
        indicaciones: toma.indicaciones ?? medicamento?.indicaciones ?? '',
        horaProgramada: toma.horaProgramada,
        fechaProgramada: toma.fechaProgramada,
        estado: toma.estado,
      };
    });
  }

  private agruparHistorial(tomas: Toma[]): HistorialToma[] {
    const agrupado = new Map<string, HistorialToma>();
    for (const toma of tomas) {
      const item = agrupado.get(toma.fechaProgramada) ?? { fecha: toma.fechaProgramada, tomadas: 0, total: 0 };
      item.total += 1;
      if (toma.estado === 'TOMADA') item.tomadas += 1;
      agrupado.set(toma.fechaProgramada, item);
    }
    return [...agrupado.values()].sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  private recalcularHistorialDeHoy(): void {
    const hoy = new Date().toISOString().slice(0, 10);
    const actual = { fecha: hoy, tomadas: this.medicamentos().filter((item) => item.estado === 'TOMADA').length, total: this.medicamentos().length };
    this.historial.update((items) => [actual, ...items.filter((item) => item.fecha !== hoy)].sort((a, b) => b.fecha.localeCompare(a.fecha)));
  }
}
