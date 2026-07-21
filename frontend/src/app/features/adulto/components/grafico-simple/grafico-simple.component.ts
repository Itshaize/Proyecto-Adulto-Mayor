import { Component, Input, computed } from '@angular/core';

@Component({
  selector: 'app-grafico-simple',
  template: `
    <div class="chart" role="img" [attr.aria-label]="etiqueta + ': ' + valores.join(', ')" [style.--chart-color]="color">
      <div class="y-labels"><span>{{ maximo }}</span><span>{{ medio }}</span><span>{{ minimo }}</span></div>
      <svg viewBox="0 0 640 180" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient [id]="gradientId" x1="0" y1="0" x2="0" y2="1"><stop offset="0" [attr.stop-color]="color" stop-opacity=".22"/><stop offset="1" [attr.stop-color]="color" stop-opacity="0"/></linearGradient></defs>
        <line x1="0" y1="15" x2="640" y2="15"/><line x1="0" y1="88" x2="640" y2="88"/><line x1="0" y1="160" x2="640" y2="160"/>
        <polygon [attr.points]="area()" [attr.fill]="'url(#' + gradientId + ')'"/>
        <polyline [attr.points]="puntos()" fill="none" [attr.stroke]="color" stroke-width="4" vector-effect="non-scaling-stroke"/>
        @for (p of puntosCirculos(); track $index) { <circle [attr.cx]="p.x" [attr.cy]="p.y" r="5" fill="white" [attr.stroke]="color" stroke-width="4" vector-effect="non-scaling-stroke"/> }
      </svg>
      <div class="x-labels">@for (label of etiquetas; track label) { <span>{{ label }}</span> }</div>
    </div>`,
  styles: [`
    .chart{position:relative;padding-left:34px}.chart svg{display:block;width:100%;height:180px;overflow:visible}.chart line{stroke:#e6edf3;stroke-width:1}.y-labels{position:absolute;inset:0 auto 25px 0;display:flex;flex-direction:column;justify-content:space-between;color:var(--muted);font-size:12px}.x-labels{display:flex;justify-content:space-between;gap:4px;color:var(--muted);font-size:11px}.x-labels span{text-align:center}@media(max-width:520px){.chart svg{height:135px}.x-labels{font-size:9px}}
  `],
})
export class GraficoSimpleComponent {
  @Input() valores: number[] = [];
  @Input() etiquetas: string[] = [];
  @Input() color = '#0f9fa5';
  @Input() etiqueta = 'Gráfico';
  @Input() minimo = 40;
  @Input() maximo = 100;
  readonly gradientId = `chart-${Math.random().toString(36).slice(2)}`;
  get medio() { return Math.round((this.minimo + this.maximo) / 2); }
  puntos = computed(() => this.calcular().map(p => `${p.x},${p.y}`).join(' '));
  area = computed(() => `0,160 ${this.puntos()} 640,160`);
  puntosCirculos = computed(() => this.calcular());
  private calcular() {
    const rango = Math.max(1, this.maximo - this.minimo);
    return this.valores.map((valor, i) => ({ x: this.valores.length === 1 ? 320 : i * (640 / (this.valores.length - 1)), y: 160 - ((valor - this.minimo) / rango) * 145 }));
  }
}
