import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Toma } from '../../../../core/models/domain.models';

@Component({
  selector: 'app-tabla-medicamentos', standalone: true,
  template: `
    <div class="desktop-table"><table class="data-table"><thead><tr><th>Medicamento</th><th>Dosis</th><th>Hora</th><th>Estado</th></tr></thead><tbody>@for(toma of tomas;track toma._id){<tr><td><strong>{{toma.medicamento}}</strong></td><td>{{toma.dosis}}</td><td>{{toma.horaProgramada}}</td><td><span class="badge" [class.success]="toma.estado==='TOMADA'" [class.warning]="toma.estado==='PENDIENTE'" [class.danger]="toma.estado==='OMITIDA'">{{label(toma.estado)}}</span></td></tr>}</tbody></table></div>
    <div class="mobile-cards">@for(toma of tomas;track toma._id){<article><div><strong>{{toma.medicamento}}</strong><small>{{toma.dosis}} · {{toma.horaProgramada}}</small></div><span class="badge" [class.success]="toma.estado==='TOMADA'" [class.warning]="toma.estado==='PENDIENTE'" [class.danger]="toma.estado==='OMITIDA'">{{label(toma.estado)}}</span></article>}</div>
    @if(!tomas.length){<div class="empty-state"><div><h3>Sin tomas programadas</h3><p>Agrega un medicamento para comenzar.</p></div></div>}
  `,
  styles: [`.desktop-table{display:none}.mobile-cards{display:grid}.mobile-cards article{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid var(--border)}.mobile-cards article:last-child{border-bottom:0}.mobile-cards strong{display:block;font-size:.8rem}.mobile-cards small{display:block;margin-top:4px;color:var(--text-muted);font-size:.7rem}@media(min-width:768px){.desktop-table{display:block}.mobile-cards{display:none}}`]
})
export class TablaMedicamentosComponent { @Input() tomas: Toma[] = []; @Output() verTodos = new EventEmitter<void>(); label(value: string){return value.charAt(0)+value.slice(1).toLowerCase();} }

