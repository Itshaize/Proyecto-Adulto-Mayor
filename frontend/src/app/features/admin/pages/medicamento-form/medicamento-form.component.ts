import { Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Medicamento } from '../../../../core/models/domain.models';
import { IconComponent } from '../../../../shared/icon/icon.component';

@Component({
  selector:'app-medicamento-form',standalone:true,imports:[FormsModule,ReactiveFormsModule,IconComponent],
  template:`
  <div class="modal-backdrop" (mousedown)="backdrop($event)"><section class="modal surface" role="dialog" aria-modal="true" aria-labelledby="med-form-title">
    <header><div><span class="eyebrow">{{medicamento?'Editar pauta':'Nueva pauta'}}</span><h2 id="med-form-title">{{medicamento?'Editar medicamento':'Agregar medicamento'}}</h2><p>Completa la dosis y al menos un horario.</p></div><button class="icon-btn" type="button" (click)="cancel.emit()" aria-label="Cerrar">×</button></header>
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="form-grid cols-2">
        <div class="form-field"><label for="med-nombre">Medicamento *</label><input id="med-nombre" class="input" formControlName="nombre" placeholder="Ej. Losartán"></div>
        <div class="form-field"><label for="concentracion">Concentración *</label><input id="concentracion" class="input" formControlName="concentracion" placeholder="Ej. 50 mg"></div>
        <div class="form-field"><label for="dosis">Dosis *</label><input id="dosis" class="input" formControlName="dosis" placeholder="Ej. 1 tableta"></div>
        <div class="form-field"><label for="frecuencia">Frecuencia *</label><select id="frecuencia" class="select" formControlName="frecuencia"><option value="DIARIA">Diaria</option><option value="SEMANAL">Semanal</option><option value="SEGUN_INDICACION">Según indicación</option></select></div>
        <div class="form-field full"><label for="horario">Horarios *</label><div class="time-row"><input id="horario" class="input" type="time" [(ngModel)]="nuevoHorario" [ngModelOptions]="{standalone:true}"><button class="btn btn-secondary" type="button" (click)="addTime()"><app-icon name="plus" [size]="18"/> Añadir</button></div><div class="time-chips">@for(hora of form.value.horarios;track hora){<button type="button" (click)="removeTime(hora)" [attr.aria-label]="'Quitar horario '+hora">{{hora}} <span>×</span></button>}</div>@if(timeError){<small class="error">{{timeError}}</small>}</div>
        <div class="form-field full"><label for="indicaciones">Indicaciones</label><textarea id="indicaciones" class="textarea" formControlName="indicaciones" placeholder="Ej. Tomar después del desayuno"></textarea></div>
        <div class="form-field full status-field"><div><label>Medicamento activo</label><small>Generará recordatorios en los horarios definidos.</small></div><label class="switch"><input type="checkbox" formControlName="activo"><span class="switch-track"></span></label></div>
      </div>
      @if(error){<div class="inline-error">{{error}}</div>}
      <footer><button class="btn btn-secondary" type="button" (click)="cancel.emit()">Cancelar</button><button class="btn btn-primary" type="submit" [disabled]="saving">{{saving?'Guardando…':medicamento?'Guardar cambios':'Agregar medicamento'}}</button></footer>
    </form>
  </section></div>`,
  styles:[`.modal-backdrop{position:fixed;inset:0;z-index:40;display:grid;place-items:end center;padding:0;background:rgba(23,52,91,.32);backdrop-filter:blur(4px);animation:fade .2s ease}.modal{width:100%;max-height:92dvh;overflow:auto;border-radius:22px 22px 0 0;padding:20px;animation:slide .35s cubic-bezier(.16,1,.3,1)}header{display:flex;justify-content:space-between;gap:20px;margin-bottom:23px}header h2{margin:0 0 5px;font-size:1.4rem;letter-spacing:-.035em}header p{margin:0;color:var(--text-muted);font-size:.8rem}.icon-btn{font-size:1.5rem;flex:0 0 auto}.time-row{display:grid;grid-template-columns:1fr auto;gap:8px}.time-chips{display:flex;flex-wrap:wrap;gap:7px}.time-chips button{border:1px solid #cde2e6;border-radius:999px;background:var(--primary-soft);color:var(--primary-dark);padding:6px 10px;font-size:.75rem;font-weight:750;cursor:pointer}.time-chips span{margin-left:5px}.status-field{display:flex;justify-content:space-between;align-items:center;padding:13px;background:#f7fafc;border-radius:12px}.status-field label:first-child{display:block;margin-bottom:4px}footer{display:flex;gap:9px;justify-content:flex-end;margin-top:24px;padding-top:18px;border-top:1px solid var(--border)}@keyframes fade{from{opacity:0}}@keyframes slide{from{transform:translateY(30px)}}@media(min-width:650px){.modal-backdrop{place-items:center;padding:24px}.modal{max-width:660px;border-radius:20px;padding:28px}}`]
})
export class MedicamentoFormComponent implements OnChanges {
  private readonly fb=inject(FormBuilder);@Input() medicamento:Medicamento|null=null;@Input({required:true}) pacienteId='';@Input() saving=false;@Input() error='';@Output() save=new EventEmitter<Partial<Medicamento>>();@Output() cancel=new EventEmitter<void>();nuevoHorario='08:00';timeError='';
  form=this.fb.nonNullable.group({pacienteId:['',Validators.required],nombre:['',Validators.required],concentracion:['',Validators.required],dosis:['',Validators.required],horarios:[[] as string[],Validators.required],frecuencia:['DIARIA',Validators.required],indicaciones:[''],activo:[true]});
  ngOnChanges(changes:SimpleChanges){if(changes['medicamento']||changes['pacienteId']){const m=this.medicamento;if(m)this.form.reset({...m,horarios:[...m.horarios]});else this.form.reset({pacienteId:this.pacienteId,nombre:'',concentracion:'',dosis:'',horarios:[],frecuencia:'DIARIA',indicaciones:'',activo:true});}}
  addTime(){const times=this.form.controls.horarios.value;if(!this.nuevoHorario){this.timeError='Selecciona una hora.';return;}if(times.includes(this.nuevoHorario)){this.timeError='Ese horario ya fue agregado.';return;}this.form.controls.horarios.setValue([...times,this.nuevoHorario].sort());this.timeError='';}
  removeTime(time:string){this.form.controls.horarios.setValue(this.form.controls.horarios.value.filter(x=>x!==time));}
  submit(){if(!this.form.controls.horarios.value.length)this.timeError='Agrega al menos un horario.';if(this.form.invalid||this.timeError){this.form.markAllAsTouched();return;}this.save.emit(this.form.getRawValue());}
  backdrop(event:MouseEvent){if(event.target===event.currentTarget)this.cancel.emit();}
}
