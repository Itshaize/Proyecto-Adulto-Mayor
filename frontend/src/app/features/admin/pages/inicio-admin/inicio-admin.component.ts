import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PacienteService } from '../../../../core/services/paciente.service';
import { ResumenAdmin } from '../../../../core/models/domain.models';
import { getPacienteActivoId } from '../../../../core/constants/app.constants';
import { IconComponent } from '../../../../shared/icon/icon.component';
import { ResumenSaludComponent, MetricaResumen } from '../../components/resumen-salud/resumen-salud.component';
import { TarjetaPacienteComponent } from '../../components/tarjeta-paciente/tarjeta-paciente.component';
import { TablaMedicamentosComponent } from '../../components/tabla-medicamentos/tabla-medicamentos.component';
import { GraficoPulsacionesComponent } from '../../components/grafico-pulsaciones/grafico-pulsaciones.component';
import { GraficoSpo2Component } from '../../components/grafico-spo2/grafico-spo2.component';
import { HistorialMedicacionComponent } from '../../components/historial-medicacion/historial-medicacion.component';
import { ListaAlertasComponent } from '../../components/lista-alertas/lista-alertas.component';
import { MonitorSensorComponent } from '../../components/monitor-sensor/monitor-sensor.component';

@Component({
  selector:'app-inicio-admin',standalone:true,
  imports:[RouterLink,IconComponent,ResumenSaludComponent,TarjetaPacienteComponent,TablaMedicamentosComponent,GraficoPulsacionesComponent,GraficoSpo2Component,HistorialMedicacionComponent,ListaAlertasComponent,MonitorSensorComponent],
  templateUrl:'./inicio-admin.component.html',styleUrl:'./inicio-admin.component.scss'
})
export class InicioAdminComponent implements OnInit, OnDestroy {
  private readonly pacienteService=inject(PacienteService); 
  private readonly cdr=inject(ChangeDetectorRef);
  loading=true; error=''; resumen?:ResumenAdmin;
  readonly pacienteId=getPacienteActivoId();
  private refreshTimer?: ReturnType<typeof setInterval>;

  ngOnInit(){
    this.load();
    this.refreshTimer=setInterval(()=>this.load(false),30_000);
  }
  
  ngOnDestroy() {
    if(this.refreshTimer)clearInterval(this.refreshTimer);
  }
  
  load(showLoading=true){
    if(showLoading)this.loading=true;
    this.error='';
    this.pacienteService.getResumenPaciente(this.pacienteId).pipe(finalize(()=>this.loading=false)).subscribe({
      next:r=>{this.resumen=r.data; this.cdr.detectChanges();},
      error:e=>{this.error=e.error?.mensaje||'No se pudo cargar el panel. Comprueba que la API esté encendida.'; this.cdr.detectChanges();}
    });
  }
  
  get metrics():MetricaResumen[]{const r=this.resumen;if(!r)return[];const lectura=r.ultimaMedicion;const dispositivo=r.dispositivo;return[{label:'Oxígeno (SpO₂)',value:lectura?`${lectura.spo2}%`:'—',detail:lectura?(lectura.spo2>=95?'Normal':'Revisar'):'Sin lecturas',icon:'droplet',tone:'secondary'},{label:'Pulsaciones',value:lectura?`${lectura.pulsaciones}`:'—',detail:lectura?'lpm':'Sin lecturas',icon:'heart',tone:'primary'},{label:'Pastillas tomadas hoy',value:`${r.tomasResumen.tomadas} / ${r.tomasResumen.total}`,detail:'Confirmadas',icon:'pill',tone:'secondary'},{label:'Pendientes',value:`${r.tomasResumen.pendientes}`,detail:'Por confirmar',icon:'clock',tone:'warning'},{label:'Última conexión',value:dispositivo?.ultimaConexion?new Date(dispositivo.ultimaConexion).toLocaleTimeString('es-EC',{hour:'2-digit',minute:'2-digit'}):'—',detail:dispositivo?(dispositivo.ultimaConexion?`ESP32 ${dispositivo.estado.toLowerCase()}`:'Esperando primera conexión'):'Sin dispositivo',icon:'wifi',tone:'primary'}];}
}
