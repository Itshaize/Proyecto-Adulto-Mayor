import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Alerta } from '../../../../core/models/domain.models';
import { IconComponent } from '../../../../shared/icon/icon.component';

@Component({
  selector:'app-lista-alertas',standalone:true,imports:[DatePipe,IconComponent],
  template:`<div class="alerts">@for(alerta of alertas;track alerta._id){<article [class.read]="alerta.leida"><span class="alert-icon" [class.danger]="alerta.nivel==='CRITICA'" [class.warning]="alerta.nivel==='ADVERTENCIA'" [class.info]="alerta.nivel==='INFORMATIVA'"><app-icon [name]="alerta.nivel==='CRITICA'?'droplet':alerta.nivel==='ADVERTENCIA'?'alert':'info'" [size]="20" /></span><div><strong>{{alerta.titulo}}</strong><p>{{alerta.mensaje}}</p></div><time>{{alerta.fechaHora|date:'HH:mm'}}</time>@if(showAction&&!alerta.leida){<button class="btn-link" type="button" (click)="leer.emit(alerta)">Marcar leída</button>}</article>}@empty{<div class="empty-state"><div><span class="badge success">Todo en orden</span><h3>No hay alertas</h3><p>Las nuevas alertas aparecerán aquí.</p></div></div>}</div>`,
  styles:[`.alerts{display:grid;gap:8px}.alerts article{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:11px;align-items:center;padding:12px;border:1px solid #edf1f5;border-radius:12px;background:#fff;transition:.2s ease}.alerts article.read{opacity:.64}.alert-icon{width:36px;height:36px;border-radius:10px;display:grid;place-items:center}.alert-icon.danger{background:var(--danger-soft);color:var(--danger)}.alert-icon.warning{background:var(--warning-soft);color:var(--warning)}.alert-icon.info{background:var(--info-soft);color:var(--secondary)}.alerts strong{font-size:.77rem}.alerts p{margin:3px 0 0;color:var(--text-muted);font-size:.68rem;line-height:1.35}.alerts time{align-self:start;margin-top:3px;color:var(--text-muted);font-size:.62rem}.alerts .btn-link{grid-column:2/-1;justify-self:start;min-height:30px;font-size:.7rem;padding:0}@media(min-width:900px){.alerts article{padding:13px 14px}}`]
})
export class ListaAlertasComponent {@Input() alertas:Alerta[]=[];@Input() showAction=false;@Output() leer=new EventEmitter<Alerta>();}

