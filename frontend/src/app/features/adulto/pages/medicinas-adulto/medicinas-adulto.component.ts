import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdultoDemoService } from '../../services/adulto-demo.service';

@Component({ selector: 'app-medicinas-adulto', imports: [RouterLink], templateUrl: './medicinas-adulto.component.html', styleUrl: './medicinas-adulto.component.scss' })
export class MedicinasAdultoComponent {
  readonly data = inject(AdultoDemoService);
  readonly confirmarId = signal<string | null>(null);
  readonly mensaje = signal('');

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
