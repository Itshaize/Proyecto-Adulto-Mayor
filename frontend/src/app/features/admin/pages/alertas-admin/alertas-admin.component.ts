import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Alerta } from '../../../../core/models/domain.models';
import { AlertaService } from '../../../../core/services/alerta.service';
import { NotificacionService } from '../../../../core/services/notificacion.service';
import { getPacienteActivoId, getPacienteActivoNombre } from '../../../../core/constants/app.constants';
import { ListaAlertasComponent } from '../../components/lista-alertas/lista-alertas.component';
import { IconComponent } from '../../../../shared/icon/icon.component';

@Component({selector:'app-alertas-admin',standalone:true,imports:[FormsModule,ListaAlertasComponent,IconComponent],templateUrl:'./alertas-admin.component.html',styleUrl:'./alertas-admin.component.scss'})
export class AlertasAdminComponent implements OnInit {
  private readonly service=inject(AlertaService);private readonly notify=inject(NotificacionService);alertas:Alerta[]=[];filter:'TODAS'|'NO_LEIDAS'|'LEIDAS'='TODAS';loading=true;error='';selected:Alerta|null=null;
  readonly PACIENTE_ID=getPacienteActivoId();readonly pacienteNombre=getPacienteActivoNombre();
  ngOnInit(){this.load();}load(){this.service.getByPaciente(this.PACIENTE_ID).pipe(finalize(()=>this.loading=false)).subscribe({next:r=>this.alertas=r.data,error:e=>this.error=e.error?.mensaje||'No se pudieron cargar las alertas.'});}
  get filtered(){return this.alertas.filter(a=>this.filter==='TODAS'||(this.filter==='LEIDAS'?a.leida:!a.leida));}get unread(){return this.alertas.filter(a=>!a.leida).length;}
  get criticalCount(){return this.alertas.filter(a=>a.nivel==='CRITICA').length;}get warningCount(){return this.alertas.filter(a=>a.nivel==='ADVERTENCIA').length;}get infoCount(){return this.alertas.filter(a=>a.nivel==='INFORMATIVA').length;}
  read(a:Alerta){this.service.marcarLeida(a._id).subscribe({next:r=>{a.leida=true;this.notify.mostrar(r.mensaje);},error:e=>this.notify.mostrar(e.error?.mensaje||'No se pudo actualizar la alerta.')});}
}
