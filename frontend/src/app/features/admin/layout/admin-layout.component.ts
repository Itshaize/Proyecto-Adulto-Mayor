import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/icon/icon.component';
import { ToastComponent } from '../../../shared/toast/toast.component';

@Component({
  selector: 'app-admin-layout', standalone: true, imports: [DatePipe, RouterOutlet, RouterLink, RouterLinkActive, IconComponent, ToastComponent],
  templateUrl: './admin-layout.component.html', styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {
  private readonly auth = inject(AuthService); private readonly router = inject(Router);
  readonly today = new Date();
  readonly nav = [
    { path: '/admin/inicio', label: 'Inicio', icon: 'home' }, { path: '/admin/paciente', label: 'Paciente', icon: 'user' },
    { path: '/admin/medicamentos', label: 'Medicamentos', icon: 'pill' }, { path: '/admin/historial', label: 'Historial', icon: 'history' },
    { path: '/admin/alertas', label: 'Alertas', icon: 'bell', badge: 3 }, { path: '/admin/configuracion', label: 'Configuración', icon: 'settings' }
  ];
  get usuario() { return this.auth.usuario; }
  logout() { this.auth.logout(); this.router.navigate(['/login']); }
}
