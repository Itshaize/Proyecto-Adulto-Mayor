import { Component, Input } from '@angular/core';
import { Medicion } from '../../../../core/models/domain.models';

@Component({
  selector: 'app-grafico-spo2', standalone: true,
  template:`<div class="spo"><div class="gauge" [style.--value]="value"><div><strong>{{value}}%</strong><small>SpO₂ actual</small></div></div><div class="legend"><span><i></i>Rango esperado</span><strong>95% — 100%</strong><p>La lectura actual requiere {{value < 95 ? 'atención y seguimiento.' : 'seguimiento normal.'}}</p></div></div>`,
  styles:[`.spo{min-height:180px;display:flex;align-items:center;justify-content:center;gap:clamp(20px,4vw,46px)}.gauge{--value:94;width:126px;aspect-ratio:1;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--primary) calc(var(--value)*1%),#e8eef3 0);position:relative}.gauge::after{content:'';position:absolute;inset:12px;border-radius:50%;background:white}.gauge>div{position:relative;z-index:1;text-align:center}.gauge strong{display:block;font-size:1.65rem;letter-spacing:-.05em}.gauge small{color:var(--text-muted);font-size:.65rem}.legend{max-width:170px}.legend span{display:flex;align-items:center;gap:7px;color:var(--text-muted);font-size:.68rem}.legend i{width:7px;height:7px;border-radius:50%;background:var(--success)}.legend>strong{display:block;margin-top:8px;font-size:.9rem}.legend p{margin:7px 0 0;color:var(--text-muted);font-size:.72rem;line-height:1.45}`]
})
export class GraficoSpo2Component { value=0; @Input({required:true}) set mediciones(items:Medicion[]){this.value=items.at(-1)?.spo2??0;} }

