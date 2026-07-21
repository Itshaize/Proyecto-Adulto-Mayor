import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Medicamento } from '../../../../core/models/domain.models';
import { IconComponent } from '../../../../shared/icon/icon.component';

interface RecetaItem {
  nombre: string;
  concentracion: string;
  dosis: string;
  horariosTexto: string;
  frecuencia: string;
  indicaciones: string;
}

@Component({
  selector: 'app-receta-form', standalone: true, imports: [FormsModule, IconComponent],
  template: `
    <div class="recipe-backdrop" (mousedown)="backdrop($event)">
      <section class="recipe-modal surface" role="dialog" aria-modal="true" aria-labelledby="recipe-title">
        <header class="recipe-header"><div><span class="eyebrow">Carga múltiple</span><h2 id="recipe-title">Registrar receta completa</h2><p>Ingresa todos los medicamentos y guárdalos juntos.</p></div><button class="icon-btn" type="button" (click)="cancel.emit()" aria-label="Cerrar">×</button></header>
        <div class="recipe-meta">
          <div class="form-field"><label for="medico">Médico que prescribe</label><input id="medico" class="input" [(ngModel)]="medico" placeholder="Ej. Dra. Elena Mora"></div>
          <div class="form-field"><label for="fecha-receta">Fecha de la receta</label><input id="fecha-receta" class="input" type="date" [(ngModel)]="fecha"></div>
          <div class="form-field full"><label for="observacion-receta">Observación general</label><input id="observacion-receta" class="input" [(ngModel)]="observacion" placeholder="Ej. Tratamiento indicado durante 30 días"></div>
        </div>
        <div class="items-heading"><div><h3>Medicamentos de la receta</h3><p>{{items.length}} {{items.length===1?'medicamento':'medicamentos'}}</p></div><button class="btn btn-secondary" type="button" (click)="addItem()"><app-icon name="plus" [size]="17"/> Añadir fila</button></div>
        <div class="recipe-items">
          @for(item of items;track $index;let index=$index){
            <article class="recipe-item">
              <div class="item-number">{{index+1}}</div>
              <div class="item-grid">
                <div class="form-field"><label [for]="'receta-nombre-'+index">Medicamento *</label><input [id]="'receta-nombre-'+index" class="input" [(ngModel)]="item.nombre" [name]="'nombre-'+index" placeholder="Losartán"></div>
                <div class="form-field"><label [for]="'receta-concentracion-'+index">Concentración *</label><input [id]="'receta-concentracion-'+index" class="input" [(ngModel)]="item.concentracion" [name]="'concentracion-'+index" placeholder="50 mg"></div>
                <div class="form-field"><label [for]="'receta-dosis-'+index">Dosis *</label><input [id]="'receta-dosis-'+index" class="input" [(ngModel)]="item.dosis" [name]="'dosis-'+index" placeholder="1 tableta"></div>
                <div class="form-field"><label [for]="'receta-horarios-'+index">Horarios *</label><input [id]="'receta-horarios-'+index" class="input" [(ngModel)]="item.horariosTexto" [name]="'horarios-'+index" placeholder="08:00, 20:00"><small>Separa varios horarios con comas.</small></div>
                <div class="form-field"><label [for]="'receta-frecuencia-'+index">Frecuencia</label><select [id]="'receta-frecuencia-'+index" class="select" [(ngModel)]="item.frecuencia" [name]="'frecuencia-'+index"><option value="DIARIA">Diaria</option><option value="SEMANAL">Semanal</option><option value="SEGUN_INDICACION">Según indicación</option></select></div>
                <div class="form-field"><label [for]="'receta-indicaciones-'+index">Indicaciones</label><input [id]="'receta-indicaciones-'+index" class="input" [(ngModel)]="item.indicaciones" [name]="'indicaciones-'+index" placeholder="Después del desayuno"></div>
              </div>
              <button class="remove-row" type="button" (click)="removeItem(index)" [disabled]="items.length===1" aria-label="Quitar medicamento"><app-icon name="trash" [size]="17"/></button>
            </article>
          }
        </div>
        @if(error){<div class="inline-error" role="alert">{{error}}</div>}
        <footer><button class="btn btn-secondary" type="button" (click)="cancel.emit()">Cancelar</button><button class="btn btn-primary" type="button" [disabled]="saving" (click)="submit()"><app-icon name="check" [size]="18"/> {{saving?'Guardando receta…':'Guardar receta completa'}}</button></footer>
      </section>
    </div>`,
  styles: [`
    .recipe-backdrop{position:fixed;inset:0;z-index:40;display:grid;place-items:end center;background:rgba(23,52,91,.34);backdrop-filter:blur(4px)}.recipe-modal{width:100%;max-height:94dvh;overflow:auto;padding:20px;border-radius:22px 22px 0 0;animation:enter .35s cubic-bezier(.16,1,.3,1)}.recipe-header,.items-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.recipe-header h2{margin:0 0 5px;font-size:1.4rem;letter-spacing:-.035em}.recipe-header p,.items-heading p{margin:0;color:var(--text-muted);font-size:.75rem}.recipe-meta{display:grid;gap:13px;margin:22px 0;padding:16px;border-radius:14px;background:#f7fafc;border:1px solid var(--border)}.items-heading{align-items:center;margin-bottom:12px}.items-heading h3{margin:0 0 3px;font-size:.9rem}.items-heading .btn{min-height:42px;padding:0 12px;font-size:.75rem}.recipe-items{display:grid;gap:11px}.recipe-item{position:relative;display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:11px;padding:15px;border:1px solid var(--border);border-radius:14px;background:white}.item-number{width:29px;height:29px;display:grid;place-items:center;border-radius:9px;background:var(--primary-soft);color:var(--primary-dark);font-size:.72rem;font-weight:850}.item-grid{display:grid;gap:12px}.remove-row{width:35px;height:35px;display:grid;place-items:center;border:0;border-radius:10px;background:var(--danger-soft);color:var(--danger);cursor:pointer}.remove-row:disabled{opacity:.35;cursor:not-allowed}.inline-error{margin-top:14px}.recipe-modal>footer{display:flex;flex-direction:column-reverse;gap:9px;margin-top:20px;padding-top:18px;border-top:1px solid var(--border)}@keyframes enter{from{opacity:0;transform:translateY(24px)}}
    @media(min-width:700px){.recipe-backdrop{place-items:center;padding:24px}.recipe-modal{max-width:980px;border-radius:20px;padding:27px}.recipe-meta{grid-template-columns:1fr 1fr}.recipe-meta .full{grid-column:1/-1}.item-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.recipe-modal>footer{flex-direction:row;justify-content:flex-end}}
  `]
})
export class RecetaFormComponent {
  @Input({ required: true }) pacienteId = '';
  @Input() saving = false;
  @Output() save = new EventEmitter<Partial<Medicamento>[]>();
  @Output() cancel = new EventEmitter<void>();
  medico = '';
  fecha = new Date().toISOString().slice(0, 10);
  observacion = '';
  error = '';
  items: RecetaItem[] = [this.emptyItem(), this.emptyItem()];

  emptyItem(): RecetaItem { return { nombre: '', concentracion: '', dosis: '', horariosTexto: '', frecuencia: 'DIARIA', indicaciones: '' }; }
  addItem(){this.items.push(this.emptyItem());this.error='';}
  removeItem(index:number){if(this.items.length>1)this.items.splice(index,1);}
  submit(){
    const horarios=this.items.map(item=>item.horariosTexto.split(',').map(value=>value.trim()).filter(Boolean));
    if(this.items.some((item,index)=>!item.nombre.trim()||!item.concentracion.trim()||!item.dosis.trim()||!horarios[index].length)){this.error='Completa nombre, concentración, dosis y horario de cada medicamento.';return;}
    if(horarios.some(values=>values.some(value=>!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)))){this.error='Revisa los horarios. Deben usar el formato HH:mm, por ejemplo 08:00.';return;}
    if(horarios.some(values=>new Set(values).size!==values.length)){this.error='Una fila contiene horarios repetidos.';return;}
    this.error='';this.save.emit(this.items.map((item,index)=>({pacienteId:this.pacienteId,nombre:item.nombre.trim(),concentracion:item.concentracion.trim(),dosis:item.dosis.trim(),horarios:horarios[index],frecuencia:item.frecuencia,indicaciones:item.indicaciones.trim(),recetaMedico:this.medico.trim(),recetaFecha:this.fecha,recetaObservacion:this.observacion.trim(),activo:true})));
  }
  backdrop(event:MouseEvent){if(event.target===event.currentTarget)this.cancel.emit();}
}
