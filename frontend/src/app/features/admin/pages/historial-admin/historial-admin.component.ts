import { Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, finalize } from 'rxjs';
import { TomaService } from '../../../../core/services/toma.service';
import { MedicionService } from '../../../../core/services/medicion.service';
import { Medicion, Toma } from '../../../../core/models/domain.models';
import { getPacienteActivoId } from '../../../../core/constants/app.constants';
import { IconComponent } from '../../../../shared/icon/icon.component';
import { FormatoReporte, ReporteService, SeccionReporte } from '../../../../core/services/reporte.service';

@Component({selector:'app-historial-admin',standalone:true,imports:[DatePipe,FormsModule,IconComponent],templateUrl:'./historial-admin.component.html',styleUrl:'./historial-admin.component.scss'})
export class HistorialAdminComponent implements OnInit {
  private readonly tomaService=inject(TomaService);private readonly medicionService=inject(MedicionService);private readonly reporteService=inject(ReporteService);tab:'medicacion'|'salud'='medicacion';tomas:Toma[]=[];mediciones:Medicion[]=[];loading=true;error='';desde='';hasta='';estado='TODOS';medicamento='TODOS';tipo='TODOS';showFilters=false;seccionReporte:SeccionReporte='todas';exportando:FormatoReporte|null=null;exportError='';exportSuccess='';
  readonly pacienteId=getPacienteActivoId();
  ngOnInit(){forkJoin({tomas:this.tomaService.getByPaciente(this.pacienteId),mediciones:this.medicionService.getByPaciente(this.pacienteId)}).pipe(finalize(()=>this.loading=false)).subscribe({next:r=>{this.tomas=r.tomas.data;this.mediciones=r.mediciones.data;},error:e=>this.error=e.error?.mensaje||'No se pudo cargar el historial.'});}
  get nombres(){return [...new Set(this.tomas.map(t=>t.medicamento))];}
  get filteredTomas(){return this.tomas.filter(t=>this.inRange(t.fechaProgramada)&&(this.estado==='TODOS'||t.estado===this.estado)&&(this.medicamento==='TODOS'||t.medicamento===this.medicamento));}
  get filteredMediciones(){return this.mediciones.filter(m=>this.inRange(m.fechaHora)&&(this.tipo==='TODOS'||(this.tipo==='PULSACIONES'?m.pulsaciones!=null:m.spo2!=null)));}
  inRange(value:string){const date=value.slice(0,10);return(!this.desde||date>=this.desde)&&(!this.hasta||date<=this.hasta);}
  reset(){this.desde='';this.hasta='';this.estado='TODOS';this.medicamento='TODOS';this.tipo='TODOS';}
  descargar(formato:FormatoReporte){if(this.exportando)return;this.exportando=formato;this.exportError='';this.exportSuccess='';this.reporteService.descargarHistorial(this.pacienteId,formato,this.seccionReporte,this.desde,this.hasta).pipe(finalize(()=>this.exportando=null)).subscribe({next:response=>{this.reporteService.guardarArchivo(response,`kairos-historial.${formato}`);this.exportSuccess=`Reporte ${formato==='xlsx'?'Excel':'PDF'} descargado correctamente.`;},error:()=>this.exportError='No se pudo generar el reporte. Revisa las fechas e inténtalo nuevamente.'});}
}
