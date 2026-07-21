import { Component, inject, signal } from '@angular/core';
import { AdultoDataService } from '../../services/adulto-data.service';
import { GraficoPulsacionesSimpleComponent } from '../../components/grafico-pulsaciones-simple/grafico-pulsaciones-simple.component';
import { GraficoSpo2SimpleComponent } from '../../components/grafico-spo2-simple/grafico-spo2-simple.component';

@Component({ selector: 'app-salud-adulto', imports: [GraficoPulsacionesSimpleComponent, GraficoSpo2SimpleComponent], templateUrl: './salud-adulto.component.html', styleUrl: './salud-adulto.component.scss' })
export class SaludAdultoComponent {
  readonly data = inject(AdultoDataService);
  readonly periodo = signal<1 | 7>(7);
  get mediciones() { return this.periodo() === 1 ? this.data.mediciones().slice(-1) : this.data.mediciones(); }
  get pulsaciones() { return this.mediciones.map(m => m.pulsaciones); }
  get oxigeno() { return this.mediciones.map(m => m.spo2); }
  get fechas() { return this.mediciones.map(m => m.fechaHora); }
  get estadoTexto() { return { NORMAL: 'Normal', REVISAR: 'Revisar', ALERTA: 'Alerta' }[this.data.ultimaMedicion().estadoSalud]; }
  get mensajeEstado() { return { NORMAL: 'Todo se ve normal', REVISAR: 'Conviene revisar sus datos', ALERTA: 'Necesita ayuda' }[this.data.ultimaMedicion().estadoSalud]; }
}
