import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdultoDemoService } from '../../services/adulto-demo.service';
import { BotonLlamarHijoComponent } from '../../components/boton-llamar-hijo/boton-llamar-hijo.component';
import { GraficoSimpleComponent } from '../../components/grafico-simple/grafico-simple.component';

@Component({ selector: 'app-inicio-adulto', imports: [RouterLink, BotonLlamarHijoComponent, GraficoSimpleComponent], templateUrl: './inicio-adulto.component.html', styleUrl: './inicio-adulto.component.scss' })
export class InicioAdultoComponent {
  readonly data = inject(AdultoDemoService);
  readonly pulsaciones = this.data.mediciones().map(m => m.pulsaciones);
  readonly fechas = this.data.mediciones().map(m => m.fechaHora);
}
