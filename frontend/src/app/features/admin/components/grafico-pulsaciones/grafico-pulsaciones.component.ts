import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Medicion } from '../../../../core/models/domain.models';

@Component({
  selector: 'app-grafico-pulsaciones', standalone: true, imports: [DatePipe],
  template: `<div class="chart-wrap"><svg viewBox="0 0 600 210" role="img" aria-label="Historial gráfico de pulsaciones"><defs><linearGradient id="pulse-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f8fa5" stop-opacity=".2"/><stop offset="1" stop-color="#0f8fa5" stop-opacity="0"/></linearGradient></defs><g class="grid"><line x1="42" y1="25" x2="580" y2="25"/><line x1="42" y1="85" x2="580" y2="85"/><line x1="42" y1="145" x2="580" y2="145"/></g><text x="8" y="29">100</text><text x="17" y="89">75</text><text x="17" y="149">50</text><path [attr.d]="areaPath" fill="url(#pulse-fill)"/><polyline [attr.points]="points" fill="none" stroke="#0f8fa5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>@for(point of plotted;track point.x){<circle [attr.cx]="point.x" [attr.cy]="point.y" r="5" fill="white" stroke="#0f8fa5" stroke-width="3"/>}@if(plotted.length){<g class="last"><rect [attr.x]="plotted[plotted.length-1].x-46" [attr.y]="plotted[plotted.length-1].y-42" width="62" height="30" rx="7"/><text [attr.x]="plotted[plotted.length-1].x-36" [attr.y]="plotted[plotted.length-1].y-23">{{mediciones[mediciones.length-1].pulsaciones}} lpm</text></g>}</svg><div class="dates">@for(item of visibleDates;track item.fechaHora){<span>{{item.fechaHora|date:'d MMM'}}</span>}</div></div>`,
  styles: [`.chart-wrap{width:100%;overflow:hidden}svg{display:block;width:100%;height:auto}.grid line{stroke:#e8eef3;stroke-width:1}svg>text{font-size:12px;fill:#8090a1}.last rect{fill:#0f8fa5}.last text{fill:white;font-size:11px;font-weight:700}.dates{display:flex;justify-content:space-between;padding-left:7%;color:var(--text-muted);font-size:.62rem}`]
})
export class GraficoPulsacionesComponent {
  mediciones: Medicion[]=[]; plotted:{x:number;y:number}[]=[]; points=''; areaPath=''; visibleDates:Medicion[]=[];
  @Input({required:true}) set data(value:Medicion[]){this.mediciones=value.slice(-9);const range=9;this.plotted=this.mediciones.map((m,i)=>({x:50+(i*Math.max(1,520/(this.mediciones.length-1))),y:25+((105-m.pulsaciones)/55)*120}));this.points=this.plotted.map(p=>`${p.x},${p.y}`).join(' ');this.areaPath=this.plotted.length?`M ${this.plotted[0].x} 160 L ${this.points.replaceAll(' ', ' L ')} L ${this.plotted.at(-1)?.x} 160 Z`:'';this.visibleDates=this.mediciones.filter((_,i)=>i===0||i===this.mediciones.length-1||i===Math.floor(this.mediciones.length/2));}
}

