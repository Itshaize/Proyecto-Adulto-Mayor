import { Routes } from '@angular/router';
import { authGuard, loginGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', canActivate: [loginGuard], loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent) },
  {
    path: 'adulto',
    canActivate: [authGuard, roleGuard(['ADULTO_MAYOR'])],
    loadChildren: () => import('./features/adulto/adulto.routes').then((m) => m.ADULTO_ROUTES),
  },
  { path: 'admin/inicio', canActivate: [authGuard, roleGuard(['HIJO_ADMIN'])], loadComponent: () => import('./features/auth/admin-espera/admin-espera.component').then((m) => m.AdminEsperaComponent) },
  { path: '**', redirectTo: 'login' },
];
