import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-adulto-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './adulto-layout.component.html',
  styleUrl: './adulto-layout.component.scss',
})
export class AdultoLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly notificacionesAbiertas = signal(false);
  readonly avisoCitaVisible = signal(true);
  readonly menu = [
    { ruta: '/adulto/inicio', texto: 'Inicio', icono: '⌂' },
    { ruta: '/adulto/medicinas', texto: 'Medicinas', icono: '◒' },
    { ruta: '/adulto/salud', texto: 'Salud', icono: '♡' },
    { ruta: '/adulto/ayuda', texto: 'Ayuda', icono: '?' },
  ];

  alternarNotificaciones() {
    this.notificacionesAbiertas.update((abierto) => !abierto);
  }

  salir() { this.auth.cerrarSesion(); this.router.navigateByUrl('/login'); }
}
