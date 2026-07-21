import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AlertaService } from '../../../core/services/alerta.service';
import { Alerta } from '../../../core/models/domain.models';

@Component({
  selector: 'app-adulto-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DatePipe],
  templateUrl: './adulto-layout.component.html',
  styleUrl: './adulto-layout.component.scss',
})
export class AdultoLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly alertasApi = inject(AlertaService);
  private readonly router = inject(Router);
  readonly notificacionesAbiertas = signal(false);
  readonly avisoCitaVisible = signal(false);
  readonly alertas = signal<Alerta[]>([]);
  readonly menu = [
    { ruta: '/adulto/inicio', texto: 'Inicio', icono: '⌂' },
    { ruta: '/adulto/medicinas', texto: 'Medicinas', icono: '◒' },
    { ruta: '/adulto/salud', texto: 'Salud', icono: '♡' },
    { ruta: '/adulto/ayuda', texto: 'Ayuda', icono: '?' },
  ];

  constructor() {
    const pacienteId = this.auth.usuario?.pacienteId;
    if (pacienteId) {
      this.alertasApi.getByPaciente(pacienteId, true).subscribe({
        next: ({ data }) => { this.alertas.set(data); this.avisoCitaVisible.set(data.some((alerta) => alerta.tipo === 'CITA')); },
        error: () => this.alertas.set([]),
      });
    }
  }

  get alertaPrincipal() { return this.alertas()[0]; }
  alternarNotificaciones() { this.notificacionesAbiertas.update((abierto) => !abierto); }
  salir() { this.auth.logout(); this.router.navigateByUrl('/login'); }
}
