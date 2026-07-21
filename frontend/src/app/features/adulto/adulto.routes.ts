import { Routes } from '@angular/router';
import { AdultoLayoutComponent } from './layout/adulto-layout.component';

export const ADULTO_ROUTES: Routes = [{
  path: '',
  component: AdultoLayoutComponent,
  children: [
    { path: '', pathMatch: 'full', redirectTo: 'inicio' },
    { path: 'inicio', loadComponent: () => import('./pages/inicio-adulto/inicio-adulto.component').then(m => m.InicioAdultoComponent) },
    { path: 'medicinas', loadComponent: () => import('./pages/medicinas-adulto/medicinas-adulto.component').then(m => m.MedicinasAdultoComponent) },
    { path: 'salud', loadComponent: () => import('./pages/salud-adulto/salud-adulto.component').then(m => m.SaludAdultoComponent) },
    { path: 'ayuda', loadComponent: () => import('./pages/ayuda-adulto/ayuda-adulto.component').then(m => m.AyudaAdultoComponent) },
    { path: 'receta', loadComponent: () => import('./pages/receta-adulto/receta-adulto.component').then(m => m.RecetaAdultoComponent) },
  ],
}];
