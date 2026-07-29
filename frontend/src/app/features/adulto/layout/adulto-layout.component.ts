import { DatePipe } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { AlertaService } from '../../../core/services/alerta.service';
import { Alerta } from '../../../core/models/domain.models';
import { IconComponent } from '../../../shared/icon/icon.component';

@Component({
  selector: 'app-adulto-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DatePipe, IconComponent],
  templateUrl: './adulto-layout.component.html',
  styleUrl: './adulto-layout.component.scss',
})
export class AdultoLayoutComponent implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly alertasApi = inject(AlertaService);
  private readonly router = inject(Router);
  readonly notificacionesAbiertas = signal(false);
  readonly avisoCitaVisible = signal(false);
  readonly alertas = signal<Alerta[]>([]);
  readonly cargandoAlertas = signal(false);
  readonly marcandoTodas = signal(false);
  readonly errorAlertas = signal('');
  readonly alertasNoLeidas = computed(() => this.alertas().filter((alerta) => !alerta.leida));
  private readonly pacienteId = this.auth.usuario?.pacienteId ?? '';
  private readonly refreshTimer?: ReturnType<typeof setInterval>;
  readonly menu = [
    { ruta: '/adulto/inicio', texto: 'Inicio', icono: '⌂' },
    { ruta: '/adulto/medicinas', texto: 'Medicinas', icono: '◒' },
    { ruta: '/adulto/salud', texto: 'Salud', icono: '♡' },
    { ruta: '/adulto/ayuda', texto: 'Ayuda', icono: '?' },
  ];

  constructor() {
    if (this.pacienteId) {
      this.cargarAlertas(true);
      this.refreshTimer = setInterval(() => this.cargarAlertas(false), 10_000);
    }
  }

  ngOnDestroy() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  get alertaPrincipal() { return this.alertasNoLeidas()[0] ?? this.alertas()[0]; }

  alternarNotificaciones() {
    this.notificacionesAbiertas.update((abierto) => !abierto);
    if (this.notificacionesAbiertas()) this.cargarAlertas(false);
  }

  cargarAlertas(showLoading = false) {
    if (!this.pacienteId) return;
    if (showLoading) this.cargandoAlertas.set(true);
    this.errorAlertas.set('');
    this.alertasApi.getByPaciente(this.pacienteId).subscribe({
      next: ({ data }) => {
        this.alertas.set(data);
        this.avisoCitaVisible.set(data.some((alerta) => alerta.tipo === 'CITA' && !alerta.leida));
        this.cargandoAlertas.set(false);
      },
      error: () => {
        this.errorAlertas.set('No se pudieron cargar las notificaciones.');
        this.cargandoAlertas.set(false);
      },
    });
  }

  marcarLeida(alerta: Alerta) {
    if (alerta.leida) return;
    this.alertasApi.marcarLeida(alerta._id).subscribe({
      next: () => this.alertas.update((items) => items.map((item) => item._id === alerta._id ? { ...item, leida: true } : item)),
      error: () => this.errorAlertas.set('No se pudo marcar el aviso como leído.'),
    });
  }

  marcarTodasLeidas() {
    const pendientes = this.alertasNoLeidas();
    if (!pendientes.length || this.marcandoTodas()) return;
    this.marcandoTodas.set(true);
    forkJoin(pendientes.map((alerta) => this.alertasApi.marcarLeida(alerta._id))).subscribe({
      next: () => {
        this.alertas.update((items) => items.map((item) => ({ ...item, leida: true })));
        this.marcandoTodas.set(false);
      },
      error: () => {
        this.errorAlertas.set('No se pudieron marcar todos los avisos.');
        this.marcandoTodas.set(false);
        this.cargarAlertas(false);
      },
    });
  }

  abrirDetalle(alerta: Alerta) {
    this.marcarLeida(alerta);
    this.notificacionesAbiertas.set(false);
  }

  rutaAlerta(alerta: Alerta) {
    if (['SPO2_BAJA', 'RITMO_CARDIACO_ANORMAL'].includes(alerta.tipo)) return '/adulto/salud';
    if (['MEDICAMENTO_NO_CONFIRMADO', 'TOMA_MEDICAMENTO'].includes(alerta.tipo)) return '/adulto/medicinas';
    if (alerta.tipo === 'CITA') return '/adulto/receta';
    return '/adulto/inicio';
  }

  textoAccion(alerta: Alerta) {
    if (['SPO2_BAJA', 'RITMO_CARDIACO_ANORMAL'].includes(alerta.tipo)) return 'Ver mi salud';
    if (['MEDICAMENTO_NO_CONFIRMADO', 'TOMA_MEDICAMENTO'].includes(alerta.tipo)) return 'Ver medicinas';
    if (alerta.tipo === 'CITA') return 'Ver receta';
    return 'Ver detalle';
  }

  iconoAlerta(alerta: Alerta) {
    if (alerta.nivel === 'CRITICA') return 'alert';
    if (alerta.tipo.includes('MEDICAMENTO') || alerta.tipo === 'TOMA_MEDICAMENTO') return 'pill';
    return 'info';
  }

  salir() { this.auth.logout(); this.router.navigateByUrl('/login'); }
}
