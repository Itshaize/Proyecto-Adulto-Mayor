import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdultoDataService } from '../../services/adulto-data.service';
import { BotonConfirmarTomaComponent } from '../../components/boton-confirmar-toma/boton-confirmar-toma.component';

@Component({ selector: 'app-medicinas-adulto', imports: [RouterLink, BotonConfirmarTomaComponent], templateUrl: './medicinas-adulto.component.html', styleUrl: './medicinas-adulto.component.scss' })
export class MedicinasAdultoComponent {
  readonly data = inject(AdultoDataService);
  readonly confirmarId = signal<string | null>(null);
  readonly mensaje = signal('');
  readonly fechaHoy = new Intl.DateTimeFormat('es-EC', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  estadoTomaTexto(estado: string) { return { PENDIENTE: '◷ Pendiente', TOMADA: '✓ Tomada', OMITIDA: '! Omitida' }[estado] ?? estado; }

  pedirConfirmacion(id: string) { this.confirmarId.set(id); }
  cancelar() { this.confirmarId.set(null); }
  confirmar() {
    const id = this.confirmarId();
    if (!id) return;
    this.data.confirmarToma(id);
    this.confirmarId.set(null);
    this.mensaje.set('Su pastilla fue registrada.');
    setTimeout(() => this.mensaje.set(''), 3500);
  }
}
