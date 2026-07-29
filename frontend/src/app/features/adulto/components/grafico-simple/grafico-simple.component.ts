import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-grafico-simple',
  template: `
    <div class="chart" role="img" [attr.aria-label]="etiqueta + ': ' + visibleValues.join(', ')" [style.--chart-color]="color">
      @if (visibleValues.length) {
        <div class="y-labels">
          <span>{{ scaleMax }}</span>
          <span>{{ scaleMiddle }}</span>
          <span>{{ scaleMin }}</span>
        </div>
        <div class="plot">
          <svg viewBox="0 0 640 180" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient [id]="gradientId" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" [attr.stop-color]="color" stop-opacity=".22"/>
                <stop offset="1" [attr.stop-color]="color" stop-opacity="0"/>
              </linearGradient>
              <clipPath [id]="clipId"><rect x="0" y="8" width="640" height="158" rx="4"/></clipPath>
            </defs>
            <g class="grid">
              <line x1="0" y1="15" x2="640" y2="15"/>
              <line x1="0" y1="88" x2="640" y2="88"/>
              <line x1="0" y1="160" x2="640" y2="160"/>
            </g>
            <g [attr.clip-path]="'url(#' + clipId + ')'">
              <polygon [attr.points]="area()" [attr.fill]="'url(#' + gradientId + ')'"/>
              <polyline [attr.points]="points()" fill="none" [attr.stroke]="color" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
              @for (point of circlePoints(); track $index) {
                <circle [attr.cx]="point.x" [attr.cy]="point.y" r="5" fill="white" [attr.stroke]="color" stroke-width="4" vector-effect="non-scaling-stroke"/>
              }
            </g>
          </svg>
        </div>
        <div class="x-labels">
          @for (label of visibleLabels; track $index) { <span>{{ label }}</span> }
        </div>
      } @else {
        <div class="empty-chart"><span></span><p>Las lecturas aparecerán aquí</p></div>
      }
    </div>`,
  styles: [`
    :host{display:block;min-width:0;max-width:100%}
    .chart{position:relative;min-width:0;max-width:100%;padding-left:38px;overflow:hidden;contain:paint}
    .plot{width:100%;overflow:hidden;border-radius:6px}
    .plot svg{display:block;width:100%;height:180px;overflow:hidden}
    .grid line{stroke:#e6edf3;stroke-width:1}
    .y-labels{position:absolute;inset:1px auto 23px 0;display:flex;flex-direction:column;justify-content:space-between;width:30px;color:var(--muted);font-size:11px;font-variant-numeric:tabular-nums}
    .x-labels{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:4px;min-width:0;color:var(--muted);font-size:10px}
    .x-labels span{min-width:0;overflow:hidden;text-align:center;text-overflow:ellipsis;white-space:nowrap}
    .empty-chart{height:205px;display:grid;place-items:center;align-content:center;gap:10px;color:var(--muted)}
    .empty-chart span{width:72px;height:30px;border-bottom:2px solid #cbd9df;transform:skewY(-12deg)}
    .empty-chart p{margin:0;font-size:12px}
    @media(max-width:520px){.chart{padding-left:32px}.plot svg{height:145px}.y-labels{bottom:22px;font-size:10px}.x-labels{font-size:9px}.empty-chart{height:170px}}
  `],
})
export class GraficoSimpleComponent {
  @Input() valores: number[] = [];
  @Input() etiquetas: string[] = [];
  @Input() color = '#0f9fa5';
  @Input() etiqueta = 'Gráfico';
  @Input() minimo = 40;
  @Input() maximo = 100;

  readonly gradientId = `chart-gradient-${Math.random().toString(36).slice(2)}`;
  readonly clipId = `chart-clip-${Math.random().toString(36).slice(2)}`;

  get visibleValues() {
    return this.valores.filter(Number.isFinite).slice(-8);
  }

  get visibleLabels() {
    const count = this.visibleValues.length;
    return this.etiquetas.slice(-count);
  }

  get scaleMin() {
    const lowest = this.visibleValues.length ? Math.min(...this.visibleValues) : this.minimo;
    if (lowest >= this.minimo) return this.minimo;
    const step = this.scaleStep(lowest, Math.max(...this.visibleValues, this.maximo));
    return Math.floor((lowest - step * .15) / step) * step;
  }

  get scaleMax() {
    const highest = this.visibleValues.length ? Math.max(...this.visibleValues) : this.maximo;
    if (highest <= this.maximo) return this.maximo;
    const step = this.scaleStep(Math.min(...this.visibleValues, this.minimo), highest);
    return Math.ceil((highest + step * .15) / step) * step;
  }

  get scaleMiddle() {
    return Math.round((this.scaleMin + this.scaleMax) / 2);
  }

  points() {
    return this.calculatePoints().map((point) => `${point.x},${point.y}`).join(' ');
  }

  area() {
    const plotted = this.points();
    return plotted ? `0,160 ${plotted} 640,160` : '';
  }

  circlePoints() {
    return this.calculatePoints();
  }

  private calculatePoints() {
    const values = this.visibleValues;
    const range = Math.max(1, this.scaleMax - this.scaleMin);
    return values.map((value, index) => ({
      x: values.length === 1 ? 320 : index * (640 / (values.length - 1)),
      y: Math.min(160, Math.max(15, 160 - ((value - this.scaleMin) / range) * 145)),
    }));
  }

  private scaleStep(lowest: number, highest: number) {
    const spread = Math.max(1, highest - lowest);
    if (spread > 100) return 20;
    if (spread > 40) return 10;
    if (spread > 15) return 5;
    return 2;
  }
}
