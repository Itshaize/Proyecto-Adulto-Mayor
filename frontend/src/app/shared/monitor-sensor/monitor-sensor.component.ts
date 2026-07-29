import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { catchError, of, switchMap, timer } from 'rxjs';
import { DispositivoService } from '../../core/services/dispositivo.service';
import { MonitorSensor } from '../../core/models/domain.models';

@Component({
  selector: 'app-monitor-sensor',
  standalone: true,
  templateUrl: './monitor-sensor.component.html',
  styleUrl: './monitor-sensor.component.scss',
})
export class MonitorSensorComponent implements OnInit, OnDestroy {
  @Input({ required: true }) deviceId = '';

  private readonly dispositivoService = inject(DispositivoService);
  private readonly cdr = inject(ChangeDetectorRef);
  private clockTimer?: ReturnType<typeof setInterval>;
  private pollSubscription?: { unsubscribe(): void };
  private countdownStartedAt = 0;
  private countdownBase = 0;
  private lastReadingKey = '';

  monitor: MonitorSensor = {
    dispositivoId: '',
    estado: 'ESPERANDO_CONEXION',
    conectado: false,
    dedoDetectado: false,
    segundos: null,
    actualizadoEn: null,
  };
  secondsLeft = 8;
  apiAvailable = true;

  ngOnInit() {
    this.pollSubscription = timer(0, 1000).pipe(
      switchMap(() => this.dispositivoService.getMonitor(this.deviceId).pipe(
        catchError(() => {
          this.apiAvailable = false;
          return of(null);
        }),
      )),
    ).subscribe((response) => {
      if (!response) return;
      this.apiAvailable = true;
      this.applyMonitor(response.data);
    });

    this.clockTimer = setInterval(() => {
      if (this.monitor.estado === 'LEYENDO') {
        const elapsed = Math.floor((Date.now() - this.countdownStartedAt) / 1000);
        this.secondsLeft = Math.max(0, this.countdownBase - elapsed);
        this.cdr.detectChanges();
      }
    }, 250);
  }

  ngOnDestroy() {
    this.pollSubscription?.unsubscribe();
    if (this.clockTimer) clearInterval(this.clockTimer);
  }

  private applyMonitor(next: MonitorSensor) {
    const key = `${next.estado}-${next.segundos ?? ''}`;
    if (next.estado === 'LEYENDO' && key !== this.lastReadingKey) {
      this.countdownBase = next.segundos ?? 8;
      this.secondsLeft = this.countdownBase;
      this.countdownStartedAt = Date.now();
    } else if (next.estado !== 'LEYENDO') {
      this.secondsLeft = next.estado === 'RESULTADO' ? 0 : 8;
    }
    this.lastReadingKey = key;
    this.monitor = next;
    this.cdr.detectChanges();
  }

  get progress() {
    if (this.monitor.estado === 'RESULTADO') return 100;
    if (this.monitor.estado !== 'LEYENDO') return 0;
    return Math.min(100, Math.max(0, ((8 - this.secondsLeft) / 8) * 100));
  }

  get statusTitle() {
    if (!this.apiAvailable) return 'Backend sin conexión';
    if (this.monitor.estado === 'RESULTADO' && this.monitor.origen === 'PULSADOR') return 'Pulsador de pastilla recibido';
    return {
      INICIANDO: 'Preparando el sensor',
      LISTO: 'Sensor listo',
      ESPERANDO_DEDO: 'Esperando el dedo',
      LEYENDO: 'Midiendo signos vitales',
      RESULTADO: 'Lectura recibida',
      ERROR: 'Revisa el sensor',
      INFO: 'Preparando el dispositivo',
      DESCONECTADO: 'Dispositivo desconectado',
      ESPERANDO_CONEXION: 'Esperando conexión',
    }[this.monitor.estado] ?? 'Esperando el sensor';
  }

  get statusDetail() {
    if (!this.apiAvailable) return 'No se pudo consultar el estado en vivo.';
    if (this.monitor.mensaje) return this.monitor.mensaje;
    if (this.monitor.estado === 'RESULTADO' && this.monitor.origen === 'PULSADOR') {
      return 'El servidor está registrando la próxima pastilla pendiente de hoy.';
    }
    return {
      INICIANDO: 'El puente está conectándose con el ESP32.',
      LISTO: 'Coloque el dedo sobre el MAX30102.',
      ESPERANDO_DEDO: 'Coloque el dedo y manténgalo quieto durante 8 segundos.',
      LEYENDO: 'Dedo detectado. No lo retire hasta terminar.',
      RESULTADO: 'Firebase recibió la medición y la envió al servidor.',
      ERROR: 'La lectura fue inestable. Intente nuevamente.',
      INFO: 'El ESP32 está iniciando.',
      DESCONECTADO: 'Compruebe el cable USB y el programa puente.',
      ESPERANDO_CONEXION: 'Juan debe abrir el puente local junto al ESP32.',
    }[this.monitor.estado] ?? '';
  }

  get updatedTime() {
    if (!this.monitor.actualizadoEn) return 'Sin señales todavía';
    return `Actualizado ${new Date(this.monitor.actualizadoEn).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  }
}
