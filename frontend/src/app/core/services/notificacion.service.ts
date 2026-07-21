import { Injectable, signal } from '@angular/core';
@Injectable({ providedIn: 'root' }) export class NotificacionService { readonly mensaje = signal<string | null>(null); mostrar(texto: string) { this.mensaje.set(texto); window.setTimeout(() => this.mensaje.set(null), 3200); } }

