import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Toma } from '../../../../core/models/domain.models';

@Component({selector:'app-historial-medicacion',standalone:true,imports:[DatePipe],template:`<table class="data-table"><thead><tr><th>Fecha</th><th>Hora</th><th>Medicamento</th><th>Dosis</th><th>Estado</th></tr></thead><tbody>@for(toma of tomas.slice(0,5);track toma._id){<tr><td>{{toma.fechaProgramada|date:'d MMM y'}}</td><td>{{toma.horaProgramada}}</td><td><strong>{{toma.medicamento}}</strong></td><td>{{toma.dosis}}</td><td><span class="badge" [class.success]="toma.estado==='TOMADA'" [class.warning]="toma.estado==='PENDIENTE'">{{toma.estado}}</span></td></tr>}</tbody></table>`})
export class HistorialMedicacionComponent {@Input() tomas:Toma[]=[];}

