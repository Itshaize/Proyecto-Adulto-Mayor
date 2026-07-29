import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdultoDataService } from '../../services/adulto-data.service';
import { BotonLlamarHijoComponent } from '../../components/boton-llamar-hijo/boton-llamar-hijo.component';
import { GraficoPulsacionesSimpleComponent } from '../../components/grafico-pulsaciones-simple/grafico-pulsaciones-simple.component';
import { SaludoAdultoComponent } from '../../components/saludo-adulto/saludo-adulto.component';
import { ProximaPastillaComponent } from '../../components/proxima-pastilla/proxima-pastilla.component';
import { ListaMedicamentosHoyComponent } from '../../components/lista-medicamentos-hoy/lista-medicamentos-hoy.component';
import { SaludActualComponent } from '../../components/salud-actual/salud-actual.component';
import { RecordatoriosComponent } from '../../components/recordatorios/recordatorios.component';

@Component({ selector: 'app-inicio-adulto', imports: [RouterLink, BotonLlamarHijoComponent, GraficoPulsacionesSimpleComponent, SaludoAdultoComponent, ProximaPastillaComponent, ListaMedicamentosHoyComponent, SaludActualComponent, RecordatoriosComponent], templateUrl: './inicio-adulto.component.html', styleUrl: './inicio-adulto.component.scss' })
export class InicioAdultoComponent implements OnInit, OnDestroy {
  readonly data = inject(AdultoDataService);
  private refreshTimer?: ReturnType<typeof setInterval>;

  ngOnInit() { this.refreshTimer=setInterval(()=>this.data.actualizarSalud(),30_000); }
  ngOnDestroy() { if(this.refreshTimer)clearInterval(this.refreshTimer); }

  get pulsaciones() { return this.data.mediciones().map(m => m.pulsaciones); }
  get fechas() { return this.data.mediciones().map(m => new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'short' }).format(new Date(m.fechaHora))); }
  estadoGeneralTexto() { return { NORMAL: 'Todo en orden', REVISAR: 'Debe revisar', ALERTA: 'Necesita ayuda' }[this.data.estadoGeneral()]; }
  estadoTomaTexto(estado: string) { return { PENDIENTE: 'Pendiente', TOMADA: 'Tomada', OMITIDA: 'Omitida' }[estado] ?? estado; }
}
