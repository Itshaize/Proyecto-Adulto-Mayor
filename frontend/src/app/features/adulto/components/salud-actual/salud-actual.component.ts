import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Medicion } from '../../models/adulto.models';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-salud-actual',
  template: `
    <section class="card">
      <div class="hw-status" [class]="hwState.estado || 'DESCONECTADO'">
        {{ hwStatusText }}
      </div>
      <h2>Salud actual</h2>
      <div class="metrics">
        <article>
          <i>O₂</i>
          <p>Oxígeno<strong>{{medicion.spo2}}<small>%</small></strong><span>{{texto}}</span></p>
        </article>
        <article>
          <i>♥</i>
          <p>Pulsaciones<strong>{{medicion.pulsaciones}}<small> lpm</small></strong><span>{{texto}}</span></p>
        </article>
      </div>
    </section>
  `,
  styles: [`
    :host{display:contents}
    section{padding:22px}
    h2{margin:0 0 18px;font-size:18px}
    .metrics{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    article{display:flex;align-items:center;justify-content:center;gap:14px;min-height:132px;padding:15px;border:1px solid var(--border);border-radius:13px}
    i{color:var(--primary);font-size:34px;font-style:normal}
    p{margin:0;font-size:14px;font-weight:600}
    strong{display:block;margin:6px 0;font-size:32px}
    small{font-size:17px}
    p span{color:var(--muted)}
    
    /* Hardware Status Banner */
    .hw-status { padding: 12px; border-radius: 8px; margin-bottom: 18px; font-weight: bold; text-align: center; font-size: 15px; transition: all 0.3s; }
    .DESCONECTADO { background: #ffebee; color: #c62828; border: 1px solid #ef9a9a; }
    .CONECTADO, .ESPERANDO_DEDO { background: #e3f2fd; color: #1565c0; border: 1px solid #90caf9; }
    .LEYENDO { background: #fff8e1; color: #f57f17; border: 1px solid #ffe082; }
    .RESULTADO { background: #e8f5e9; color: #2e7d32; border: 1px solid #a5d6a7; }
    .ERROR { background: #ffebee; color: #c62828; border: 1px solid #ef9a9a; }
    
    @media(max-width:767px){
      section{padding:19px}
      h2{font-size:20px}
      .metrics{gap:8px}
      article{flex-direction:column;min-height:165px;text-align:center}
      p{font-size:16px}
      p span{font-size:15px}
    }
  `]
})
export class SaludActualComponent implements OnInit, OnDestroy {
  @Input({required:true}) medicion!: Medicion;
  
  hwState: any = { estado: 'DESCONECTADO' };
  private eventSource!: EventSource;

  constructor(private cdr: ChangeDetectorRef) {}

  get texto() { 
    return { NORMAL: 'Normal', REVISAR: 'Revisar', ALERTA: 'Alerta' }[this.medicion.estadoSalud] || 'Calculando...'; 
  }

  get hwStatusText() {
    switch (this.hwState.estado) {
      case 'DESCONECTADO': return '🔴 Sensor de pulsaciones no detectado (conecte el USB)';
      case 'CONECTADO':
      case 'ESPERANDO_DEDO': return '🔵 Sensor conectado. Coloque su dedo para medir';
      case 'LEYENDO': return '🟡 Leyendo... Mantenga su dedo ' + (this.hwState.segundos ?? 3) + ' segundos ⏱️';
      case 'RESULTADO': return '🟢 ¡Lectura exitosa!';
      case 'ERROR': return '🔴 ' + (this.hwState.mensaje || 'Error al leer. Intente de nuevo');
      default: return '🔴 Buscando sensor...';
    }
  }

  ngOnInit() {
    // Escuchar eventos en tiempo real (SSE) desde el backend
    const streamUrl = environment.apiUrl.replace('/api', '') + '/api/hardware/stream';
    this.eventSource = new EventSource(streamUrl);
    
    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.hwState = data;
        
        if (data.estado === 'RESULTADO') {
          // Actualizar UI con la nueva medición sin necesidad de recargar la página
          this.medicion.pulsaciones = data.pulsaciones;
          this.medicion.spo2 = data.spo2;
          
          // Clasificación básica de salud (simulada aquí para dar feedback inmediato)
          if (data.spo2 < 90 || data.pulsaciones < 40 || data.pulsaciones > 130) {
            this.medicion.estadoSalud = 'ALERTA';
          } else if (data.spo2 < 95 || data.pulsaciones < 50 || data.pulsaciones > 100) {
            this.medicion.estadoSalud = 'REVISAR';
          } else {
            this.medicion.estadoSalud = 'NORMAL';
          }
        }
        
        // Forzar actualización de la vista (Angular no detecta eventos SSE automáticamente)
        this.cdr.detectChanges();
      } catch (e) { }
    };

    this.eventSource.onerror = () => {
      this.hwState = { estado: 'DESCONECTADO' };
      this.cdr.detectChanges();
    };
  }

  ngOnDestroy() {
    if (this.eventSource) {
      this.eventSource.close();
    }
  }
}
