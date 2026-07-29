import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Medicion } from '../../../../core/models/domain.models';

@Component({
  selector: 'app-grafico-pulsaciones',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="chart-wrap">
      @if (mediciones.length) {
        <svg viewBox="0 0 600 210" role="img" [attr.aria-label]="'Historial de pulsaciones entre ' + scaleMin + ' y ' + scaleMax + ' lpm'">
          <defs>
            <linearGradient [id]="gradientId" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#0f8fa5" stop-opacity=".2"/>
              <stop offset="1" stop-color="#0f8fa5" stop-opacity="0"/>
            </linearGradient>
            <clipPath [id]="clipId"><rect x="42" y="16" width="542" height="150" rx="4"/></clipPath>
          </defs>
          <g class="grid">
            <line x1="42" y1="25" x2="580" y2="25"/>
            <line x1="42" y1="92" x2="580" y2="92"/>
            <line x1="42" y1="160" x2="580" y2="160"/>
          </g>
          <text x="5" y="29">{{ scaleMax }}</text>
          <text x="5" y="96">{{ scaleMiddle }}</text>
          <text x="5" y="164">{{ scaleMin }}</text>
          <g [attr.clip-path]="'url(#' + clipId + ')'">
            <path [attr.d]="areaPath" [attr.fill]="'url(#' + gradientId + ')'"/>
            <polyline [attr.points]="points" fill="none" stroke="#0f8fa5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            @for (point of plotted; track $index) {
              <circle [attr.cx]="point.x" [attr.cy]="point.y" r="5" fill="white" stroke="#0f8fa5" stroke-width="3"/>
            }
          </g>
          @if (lastPoint; as point) {
            <g class="last">
              <rect [attr.x]="point.labelX" [attr.y]="point.labelY" width="66" height="28" rx="7"/>
              <text [attr.x]="point.labelX + 9" [attr.y]="point.labelY + 18">{{ mediciones[mediciones.length - 1].pulsaciones }} lpm</text>
            </g>
          }
        </svg>
        <div class="dates">
          @for (item of visibleDates; track $index) { <span>{{ item.fechaHora | date:'d MMM' }}</span> }
        </div>
      } @else {
        <div class="empty-chart"><span></span><p>Las lecturas aparecerán aquí</p></div>
      }
    </div>`,
  styles: [`
    :host{display:block;min-width:0;max-width:100%}
    .chart-wrap{width:100%;min-width:0;max-width:100%;overflow:hidden;contain:paint}
    svg{display:block;width:100%;height:auto;overflow:hidden}
    .grid line{stroke:#e8eef3;stroke-width:1}
    svg>text{font-size:11px;fill:#8090a1;font-variant-numeric:tabular-nums}
    .last rect{fill:#0f8fa5}
    .last text{fill:white;font-size:10px;font-weight:700}
    .dates{display:flex;justify-content:space-between;gap:8px;padding:0 3% 0 8%;color:var(--text-muted);font-size:.62rem}
    .dates span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .empty-chart{height:210px;display:grid;place-items:center;align-content:center;gap:10px;color:var(--text-muted)}
    .empty-chart span{width:76px;height:32px;border-bottom:2px solid #cbd9df;transform:skewY(-12deg)}
    .empty-chart p{margin:0;font-size:.72rem}
  `],
})
export class GraficoPulsacionesComponent {
  mediciones: Medicion[] = [];
  plotted: { x: number; y: number }[] = [];
  points = '';
  areaPath = '';
  visibleDates: Medicion[] = [];
  scaleMin = 40;
  scaleMax = 100;
  scaleMiddle = 70;
  lastPoint?: { x: number; y: number; labelX: number; labelY: number };
  readonly gradientId = `pulse-fill-${Math.random().toString(36).slice(2)}`;
  readonly clipId = `pulse-clip-${Math.random().toString(36).slice(2)}`;

  @Input({ required: true }) set data(value: Medicion[]) {
    this.mediciones = value.filter((item) => Number.isFinite(item.pulsaciones)).slice(-9);
    const values = this.mediciones.map((item) => item.pulsaciones);
    this.scaleMin = this.niceMinimum(values, 40);
    this.scaleMax = this.niceMaximum(values, 100);
    this.scaleMiddle = Math.round((this.scaleMin + this.scaleMax) / 2);
    const range = Math.max(1, this.scaleMax - this.scaleMin);

    this.plotted = this.mediciones.map((item, index) => ({
      x: this.mediciones.length === 1 ? 310 : 50 + index * (520 / (this.mediciones.length - 1)),
      y: Math.min(160, Math.max(25, 160 - ((item.pulsaciones - this.scaleMin) / range) * 135)),
    }));
    this.points = this.plotted.map((point) => `${point.x},${point.y}`).join(' ');
    this.areaPath = this.plotted.length
      ? `M ${this.plotted[0].x} 160 L ${this.points.replaceAll(' ', ' L ')} L ${this.plotted.at(-1)?.x} 160 Z`
      : '';
    this.visibleDates = this.mediciones.filter((_, index) =>
      index === 0 || index === this.mediciones.length - 1 || index === Math.floor(this.mediciones.length / 2));

    const last = this.plotted.at(-1);
    this.lastPoint = last ? {
      ...last,
      labelX: Math.min(518, Math.max(42, last.x - 54)),
      labelY: Math.min(174, Math.max(2, last.y - 36)),
    } : undefined;
  }

  private niceMinimum(values: number[], preferred: number) {
    if (!values.length || Math.min(...values) >= preferred) return preferred;
    return Math.floor((Math.min(...values) - 5) / 10) * 10;
  }

  private niceMaximum(values: number[], preferred: number) {
    if (!values.length || Math.max(...values) <= preferred) return preferred;
    return Math.ceil((Math.max(...values) + 5) / 10) * 10;
  }
}
