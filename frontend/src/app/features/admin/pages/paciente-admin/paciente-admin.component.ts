import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { PacienteService } from '../../../../core/services/paciente.service';
import { getPacienteActivoId, setPacienteActivo } from '../../../../core/constants/app.constants';
import { NotificacionService } from '../../../../core/services/notificacion.service';
import { IconComponent } from '../../../../shared/icon/icon.component';
import { Paciente } from '../../../../core/models/domain.models';

@Component({
  selector:'app-paciente-admin',standalone:true,imports:[ReactiveFormsModule,IconComponent],
  templateUrl:'./paciente-admin.component.html',styleUrl:'./paciente-admin.component.scss',styles:['.register-button{white-space:nowrap}@media(max-width:560px){.register-button{width:48px;padding:0;font-size:0}}']
})
export class PacienteAdminComponent implements OnInit {
  private readonly fb=inject(FormBuilder);private readonly service=inject(PacienteService);private readonly notify=inject(NotificacionService);
  loading=true;saving=false;error='';diagnosticosTexto='';isNew=false;private original:Partial<Paciente>|null=null;
  pacienteId=getPacienteActivoId();
  pacienteForm=this.fb.nonNullable.group({nombre:['',Validators.required],edad:[1,[Validators.required,Validators.min(1)]],fechaNacimiento:['',Validators.required],diagnosticos:[[] as string[]],telefonoContacto:['',Validators.required],dispositivoId:['ESP32-001',Validators.required],activo:[true]});
  ngOnInit(){this.load();}
  load(){this.loading=true;this.error='';this.service.getPaciente(this.pacienteId).pipe(finalize(()=>this.loading=false)).subscribe({next:r=>this.applyPatient(r.data),error:()=>this.startRegistration()});}
  applyPatient(paciente:Paciente){this.original={...paciente,diagnosticos:[...paciente.diagnosticos]};this.pacienteForm.reset({nombre:paciente.nombre,edad:paciente.edad,fechaNacimiento:paciente.fechaNacimiento,diagnosticos:[...paciente.diagnosticos],telefonoContacto:paciente.telefonoContacto,dispositivoId:paciente.dispositivoId,activo:paciente.activo});this.diagnosticosTexto=paciente.diagnosticos.join(', ');setPacienteActivo(paciente._id,paciente.nombre);this.isNew=false;}
  startRegistration(){this.isNew=true;this.loading=false;this.error='';this.original=null;this.diagnosticosTexto='';this.pacienteForm.reset({nombre:'',edad:1,fechaNacimiento:'',diagnosticos:[],telefonoContacto:'',dispositivoId:'ESP32-001',activo:true});}
  onDiagnosticos(value:string){this.diagnosticosTexto=value;this.pacienteForm.controls.diagnosticos.setValue(value.split(',').map(x=>x.trim()).filter(Boolean));}
  save(){if(this.pacienteForm.invalid){this.pacienteForm.markAllAsTouched();return;}const wasNew=this.isNew;this.saving=true;this.error='';const request=wasNew?this.service.createPaciente(this.pacienteForm.getRawValue()):this.service.updatePaciente(this.pacienteId,this.pacienteForm.getRawValue());request.pipe(finalize(()=>this.saving=false)).subscribe({next:r=>{this.pacienteId=r.data._id;this.applyPatient(r.data);this.notify.mostrar(wasNew?'Papá fue registrado correctamente':r.mensaje);},error:e=>this.error=e.error?.mensaje||'No se pudo guardar.'});}
  cancel(){if(this.original)this.applyPatient(this.original as Paciente);else this.load();}
  invalid(name:keyof typeof this.pacienteForm.controls){const c=this.pacienteForm.controls[name];return c.invalid&&c.touched;}
  get initials(){return this.pacienteForm.controls.nombre.value.split(/\s+/).filter(Boolean).slice(0,2).map(value=>value[0]).join('').toUpperCase()||'PA';}
}
