import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'adulto/inicio' },
  {
    path: 'adulto',
    loadChildren: () => import('./features/adulto/adulto.routes').then((m) => m.ADULTO_ROUTES),
  },
  { path: '**', redirectTo: 'adulto/inicio' },
];
