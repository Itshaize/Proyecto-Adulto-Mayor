import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

export interface MensajeNotificacion {
  titulo: string;
  mensaje: string;
  tipo?: 'MEDICAMENTO' | 'MEDICION' | 'CITA' | 'GENERAL';
  tomaId?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private readonly router = inject(Router);
  readonly permiso = signal<NotificationPermission>('default');
  readonly token = signal<string | null>(null);
  readonly mensajes = {
    horaMedicamento: (nombre: string) => `Es hora de tomar ${nombre}.`,
    tomaRegistrada: 'Su pastilla fue registrada.',
    tomaNoConfirmada: (hora: string) => `No se ha confirmado la pastilla de las ${hora}.`,
    medicionGuardada: 'Su medición fue guardada.',
  };
  async solicitarPermiso() {
    if (!('Notification' in window)) return 'denied' as const;
    const resultado = await Notification.requestPermission();
    this.permiso.set(resultado);
    return resultado;
  }
  mostrarMensaje(titulo: string, mensaje: string) {
    if (this.permiso() === 'granted') new Notification(titulo, { body: mensaje });
  }

  /** Juan puede entregar aquí el token obtenido por Firebase Messaging. */
  registrarToken(token: string) { this.token.set(token); }

  async procesarMensaje(notificacion: MensajeNotificacion) {
    this.mostrarMensaje(notificacion.titulo, notificacion.mensaje);
    if (notificacion.tipo === 'MEDICAMENTO') await this.router.navigate(['/adulto/medicinas']);
  }
}
