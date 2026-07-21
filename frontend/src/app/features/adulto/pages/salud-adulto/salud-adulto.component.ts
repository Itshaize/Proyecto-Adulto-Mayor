import { Component, inject, signal } from '@angular/core';
import { AdultoDemoService } from '../../services/adulto-demo.service';
import { GraficoSimpleComponent } from '../../components/grafico-simple/grafico-simple.component';

@Component({ selector: 'app-salud-adulto', imports: [GraficoSimpleComponent], templateUrl: './salud-adulto.component.html', styleUrl: './salud-adulto.component.scss' })
export class SaludAdultoComponent {
  readonly data = inject(AdultoDemoService);
  readonly periodo = signal<1 | 7>(7);
  get mediciones() { return this.periodo() === 1 ? this.data.mediciones().slice(-1) : this.data.mediciones(); }
  get pulsaciones() { return this.mediciones.map(m => m.pulsaciones); }
  get oxigeno() { return this.mediciones.map(m => m.spo2); }
  get fechas() { return this.mediciones.map(m => m.fechaHora); }
}
