import { Component, Input } from '@angular/core';
import { Medicion } from '../../../../core/models/domain.models';

@Component({
  selector: 'app-grafico-spo2',
  standalone: true,
  template: `
    <div class="spo">
      <div class="gauge" [style.--value]="safeValue">
        <div><strong>{{ value }}%</strong><small>SpO₂ actual</small></div>
      </div>
      <div class="legend">
        <span><i></i>Rango esperado</span>
        <strong>95% — 100%</strong>
        <p>La lectura actual requiere {{ value < 95 ? 'atención y seguimiento.' : 'seguimiento normal.' }}</p>
      </div>
    </div>`,
  styles: [`
    :host{display:block;min-width:0;max-width:100%;overflow:hidden}
    .spo{min-height:180px;display:flex;align-items:center;justify-content:center;gap:clamp(20px,4vw,46px);overflow:hidden}
    .gauge{--value:94;position:relative;flex:0 0 126px;width:126px;aspect-ratio:1;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--primary) calc(var(--value)*1%),#e8eef3 0)}
    .gauge::after{content:'';position:absolute;inset:12px;border-radius:50%;background:white}
    .gauge>div{position:relative;z-index:1;text-align:center}
    .gauge strong{display:block;font-size:1.65rem;letter-spacing:-.05em}
    .gauge small{color:var(--text-muted);font-size:.65rem}
    .legend{min-width:0;max-width:170px}
    .legend span{display:flex;align-items:center;gap:7px;color:var(--text-muted);font-size:.68rem}
    .legend i{width:7px;height:7px;border-radius:50%;background:var(--success)}
    .legend>strong{display:block;margin-top:8px;font-size:.9rem}
    .legend p{margin:7px 0 0;color:var(--text-muted);font-size:.72rem;line-height:1.45}
    @media(max-width:420px){.spo{align-items:flex-start;flex-direction:column}.gauge{align-self:center}}
  `],
})
export class GraficoSpo2Component {
  value = 0;
  safeValue = 0;

  @Input({ required: true }) set mediciones(items: Medicion[]) {
    this.value = items.at(-1)?.spo2 ?? 0;
    this.safeValue = Math.min(100, Math.max(0, this.value));
  }
}
