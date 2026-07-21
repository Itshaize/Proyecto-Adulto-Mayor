import { Component, Input } from '@angular/core';
import { GraficoSimpleComponent } from '../grafico-simple/grafico-simple.component';
@Component({selector:'app-grafico-spo2-simple',imports:[GraficoSimpleComponent],template:`<app-grafico-simple [valores]="valores" [etiquetas]="etiquetas" color="#2684d8" etiqueta="Historial de oxígeno" [minimo]="90" [maximo]="100"/>`})
export class GraficoSpo2SimpleComponent{@Input() valores:number[]=[];@Input() etiquetas:string[]=[];}
