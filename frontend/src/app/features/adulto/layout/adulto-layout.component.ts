import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AlertaPaciente, AlertaService } from '../../../core/services/alerta.service';
import { environment } from '../../../../environments/environment';

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
  readonly avisoCitaVisible = signal(environment.demoMode);
  readonly alertas = signal<AlertaPaciente[]>(environment.demoMode ? [{
    _id: 'alerta-cita-demo', tipo: 'CITA', titulo: 'Cita médica próxima',
    mensaje: 'Mañana 19 de mayo a las 09:00 AM. Centro Médico Vida · Dr. Andrés Ruiz',
    nivel: 'ADVERTENCIA', leida: false, fechaHora: new Date().toISOString(),
  }] : []);
  readonly menu = [
    { ruta: '/adulto/inicio', texto: 'Inicio', icono: '⌂' },
    { ruta: '/adulto/medicinas', texto: 'Medicinas', icono: '◒' },
    { ruta: '/adulto/salud', texto: 'Salud', icono: '♡' },
    { ruta: '/adulto/ayuda', texto: 'Ayuda', icono: '?' },
  ];

  constructor() {
    const pacienteId = this.auth.usuarioActual()?.pacienteId;
    if (!environment.demoMode && pacienteId) {
      this.alertasApi.obtenerAlertasPaciente(pacienteId).subscribe({
        next: ({ data }) => {
          this.alertas.set(data);
          this.avisoCitaVisible.set(data.some((alerta) => alerta.tipo === 'CITA'));
        },
        error: () => this.avisoCitaVisible.set(false),
      });
    }
  }

  get alertaPrincipal() { return this.alertas()[0]; }

  alternarNotificaciones() {
    this.notificacionesAbiertas.update((abierto) => !abierto);
  }

  salir() { this.auth.cerrarSesion(); this.router.navigateByUrl('/login'); }
}
