import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({ selector: 'app-admin-espera', templateUrl: './admin-espera.component.html', styleUrl: './admin-espera.component.scss' })
export class AdminEsperaComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  salir() { this.auth.cerrarSesion(); this.router.navigateByUrl('/login'); }
}
