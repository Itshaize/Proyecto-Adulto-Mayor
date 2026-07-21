import { Component, Input } from '@angular/core';
import { GraficoSimpleComponent } from '../grafico-simple/grafico-simple.component';
@Component({selector:'app-grafico-pulsaciones-simple',imports:[GraficoSimpleComponent],template:`<app-grafico-simple [valores]="valores" [etiquetas]="etiquetas" etiqueta="Historial de pulsaciones"/>`})
export class GraficoPulsacionesSimpleComponent{@Input() valores:number[]=[];@Input() etiquetas:string[]=[];}
