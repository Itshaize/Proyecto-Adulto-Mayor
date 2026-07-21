import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { PacienteService } from '../../../../core/services/paciente.service';
import { getPacienteActivoId, setPacienteActivo } from '../../../../core/constants/app.constants';
import { NotificacionService } from '../../../../core/services/notificacion.service';
import { IconComponent } from '../../../../shared/icon/icon.component';
import { Paciente } from '../../../../core/models/domain.models';

@Component({ selector:'app-paciente-admin',standalone:true,imports:[ReactiveFormsModule,IconComponent],templateUrl:'./paciente-admin.component.html',styleUrl:'./paciente-admin.component.scss',styles:['.register-button{white-space:nowrap}.access-section{grid-column:1/-1}@media(max-width:560px){.register-button{width:48px;padding:0;font-size:0}}'] })
export class PacienteAdminComponent implements OnInit {
  private readonly fb=inject(FormBuilder);private readonly service=inject(PacienteService);private readonly notify=inject(NotificacionService);
  readonly maxPacientes=2;
  pacientes:Paciente[]=[];loading=true;saving=false;error='';diagnosticosTexto='';isNew=false;private original:Partial<Paciente>|null=null;
  pacienteId=getPacienteActivoId();
  pacienteForm=this.fb.nonNullable.group({ nombre:['',Validators.required],edad:[1,[Validators.required,Validators.min(1)]],fechaNacimiento:['',Validators.required],diagnosticos:[[] as string[]],telefonoContacto:['',Validators.required],dispositivoId:['ESP32-001',Validators.required],activo:[true],correoAcceso:['',[Validators.required,Validators.email]],passwordAcceso:['',[Validators.minLength(6)]] });
  ngOnInit(){this.load();}
  load(){this.loading=true;this.error='';this.service.getMisPacientes().pipe(finalize(()=>this.loading=false)).subscribe({next:r=>{this.pacientes=r.data;if(!this.pacientes.length){this.startRegistration();return;}this.applyPatient(this.pacientes.find(item=>item._id===this.pacienteId)??this.pacientes[0]);},error:e=>this.error=e.error?.mensaje||'No se pudieron cargar los adultos registrados.'});}
  selectPatient(paciente:Paciente){if(!this.saving)this.applyPatient(paciente);}
  applyPatient(paciente:Paciente){this.original={...paciente,diagnosticos:[...paciente.diagnosticos]};this.configurePassword(false);this.pacienteForm.reset({nombre:paciente.nombre,edad:paciente.edad,fechaNacimiento:paciente.fechaNacimiento,diagnosticos:[...paciente.diagnosticos],telefonoContacto:paciente.telefonoContacto,dispositivoId:paciente.dispositivoId,activo:paciente.activo,correoAcceso:paciente.correoAcceso??'',passwordAcceso:''});this.diagnosticosTexto=paciente.diagnosticos.join(', ');this.pacienteId=paciente._id;setPacienteActivo(paciente._id,paciente.nombre);this.isNew=false;this.error='';}
  startRegistration(){if(this.pacientes.length>=this.maxPacientes){this.error='Ya alcanzaste el máximo de 2 adultos mayores registrados.';return;}this.isNew=true;this.loading=false;this.error='';this.original=null;this.diagnosticosTexto='';this.configurePassword(true);this.pacienteForm.reset({nombre:'',edad:1,fechaNacimiento:'',diagnosticos:[],telefonoContacto:'',dispositivoId:`ESP32-00${this.pacientes.length+1}`,activo:true,correoAcceso:'',passwordAcceso:''});}
  onDiagnosticos(value:string){this.diagnosticosTexto=value;this.pacienteForm.controls.diagnosticos.setValue(value.split(',').map(x=>x.trim()).filter(Boolean));}
  save(){if(this.pacienteForm.invalid){this.pacienteForm.markAllAsTouched();return;}const wasNew=this.isNew;this.saving=true;this.error='';const body=this.pacienteForm.getRawValue();const request=wasNew?this.service.createPaciente(body):this.service.updatePaciente(this.pacienteId,body);request.pipe(finalize(()=>this.saving=false)).subscribe({next:r=>{this.pacientes=wasNew?[...this.pacientes,r.data]:this.pacientes.map(item=>item._id===r.data._id?r.data:item);this.applyPatient(r.data);this.notify.mostrar(wasNew?'Adulto registrado y acceso creado correctamente':r.mensaje);},error:e=>this.error=e.error?.mensaje||'No se pudo guardar.'});}
  cancel(){if(this.original)this.applyPatient(this.original as Paciente);else if(this.pacientes.length)this.applyPatient(this.pacientes[0]);}
  invalid(name:keyof typeof this.pacienteForm.controls){const c=this.pacienteForm.controls[name];return c.invalid&&c.touched;}
  get initials(){return this.pacienteForm.controls.nombre.value.split(/\s+/).filter(Boolean).slice(0,2).map(value=>value[0]).join('').toUpperCase()||'PA';}
  private configurePassword(required:boolean){const control=this.pacienteForm.controls.passwordAcceso;control.setValidators(required?[Validators.required,Validators.minLength(6)]:[Validators.minLength(6)]);control.updateValueAndValidity({emitEvent:false});}
}
