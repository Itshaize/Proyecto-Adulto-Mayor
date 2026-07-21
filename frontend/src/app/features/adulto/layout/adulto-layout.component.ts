import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-adulto-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './adulto-layout.component.html',
  styleUrl: './adulto-layout.component.scss',
})
export class AdultoLayoutComponent {
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
}
