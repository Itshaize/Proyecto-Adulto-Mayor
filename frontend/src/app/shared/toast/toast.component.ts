import { Component, inject } from '@angular/core';
import { NotificacionService } from '../../core/services/notificacion.service';

@Component({ selector: 'app-toast', standalone: true, template: `@if (notificacion.mensaje(); as mensaje) { <div class="toast" role="status" aria-live="polite">{{ mensaje }}</div> }` })
export class ToastComponent { readonly notificacion = inject(NotificacionService); }

