import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Medicamento } from '../../../../core/models/domain.models';
import { MedicamentoService } from '../../../../core/services/medicamento.service';
import { NotificacionService } from '../../../../core/services/notificacion.service';
import { getPacienteActivoId, getPacienteActivoNombre } from '../../../../core/constants/app.constants';
import { IconComponent } from '../../../../shared/icon/icon.component';
import { MedicamentoFormComponent } from '../medicamento-form/medicamento-form.component';
import { RecetaFormComponent } from '../receta-form/receta-form.component';

@Component({selector:'app-medicamentos-admin',standalone:true,imports:[FormsModule,IconComponent,MedicamentoFormComponent,RecetaFormComponent],templateUrl:'./medicamentos-admin.component.html',styleUrl:'./medicamentos-admin.component.scss',styles:['.header-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}.recipe-add{white-space:nowrap}@media(max-width:620px){.header-actions .btn{width:48px;padding:0;font-size:0}}']})
export class MedicamentosAdminComponent implements OnInit {
  private readonly service=inject(MedicamentoService);private readonly notify=inject(NotificacionService);medicamentos:Medicamento[]=[];loading=true;saving=false;error='';search='';filter:'TODOS'|'ACTIVOS'|'INACTIVOS'='TODOS';showForm=false;showRecipe=false;editing:Medicamento|null=null;readonly pacienteId=getPacienteActivoId();readonly pacienteNombre=getPacienteActivoNombre();
  ngOnInit(){this.load();}
  load(){this.loading=true;this.service.getByPaciente(this.pacienteId).pipe(finalize(()=>this.loading=false)).subscribe({next:r=>this.medicamentos=r.data,error:e=>this.error=e.error?.mensaje||'No se pudo cargar el listado.'});}
  get filtered(){const term=this.search.trim().toLocaleLowerCase();return this.medicamentos.filter(m=>(!term||`${m.nombre} ${m.concentracion}`.toLocaleLowerCase().includes(term))&&(this.filter==='TODOS'||(this.filter==='ACTIVOS'?m.activo:!m.activo)));}
  open(m:Medicamento|null=null){this.editing=m;this.error='';this.showForm=true;}
  save(body:Partial<Medicamento>){this.saving=true;this.error='';const request=this.editing?this.service.update(this.editing._id,body):this.service.create(body);request.pipe(finalize(()=>this.saving=false)).subscribe({next:r=>{this.notify.mostrar(r.mensaje);this.showForm=false;this.load();},error:e=>this.error=e.error?.mensaje||'No se pudo guardar el medicamento.'});}
  saveRecipe(medicamentos:Partial<Medicamento>[]){this.saving=true;this.service.createReceta(medicamentos).pipe(finalize(()=>this.saving=false)).subscribe({next:r=>{this.notify.mostrar(r.mensaje);this.showRecipe=false;this.load();},error:e=>this.notify.mostrar(e.error?.mensaje||'No se pudo guardar la receta completa.')});}
  toggle(m:Medicamento){this.service.setEstado(m._id,!m.activo).subscribe({next:r=>{m.activo=r.data.activo;this.notify.mostrar(r.mensaje);},error:e=>this.notify.mostrar(e.error?.mensaje||'No se pudo cambiar el estado.')});}
  remove(m:Medicamento){if(!window.confirm(`¿Eliminar ${m.nombre} ${m.concentracion}?`))return;this.service.delete(m._id).subscribe({next:r=>{this.notify.mostrar(r.mensaje);this.load();},error:e=>this.notify.mostrar(e.error?.mensaje||'No se pudo eliminar.')});}
}
