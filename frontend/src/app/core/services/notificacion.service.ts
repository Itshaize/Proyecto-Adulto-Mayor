import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  readonly permiso = signal<NotificationPermission>('default');
  async solicitarPermiso() {
    if (!('Notification' in window)) return 'denied' as const;
    const resultado = await Notification.requestPermission();
    this.permiso.set(resultado);
    return resultado;
  }
  mostrarMensaje(titulo: string, mensaje: string) {
    if (this.permiso() === 'granted') new Notification(titulo, { body: mensaje });
  }
}
