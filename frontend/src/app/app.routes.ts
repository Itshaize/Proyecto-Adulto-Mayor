import { Routes } from '@angular/router';
import { authGuard, loginGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', canActivate: [loginGuard], loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent) },
  { path: 'registro', canActivate: [loginGuard], loadComponent: () => import('./features/auth/register.component').then((m) => m.RegisterComponent) },
  { path: 'admin', canActivate: [authGuard, roleGuard(['HIJO_ADMIN'])], loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES) },
  { path: 'adulto', canActivate: [authGuard, roleGuard(['ADULTO_MAYOR'])], loadChildren: () => import('./features/adulto/adulto.routes').then((m) => m.ADULTO_ROUTES) },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' }
];
