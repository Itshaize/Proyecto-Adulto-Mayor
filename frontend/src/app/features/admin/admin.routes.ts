import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';

export const ADMIN_ROUTES: Routes = [{
  path: '', component: AdminLayoutComponent, children: [
    { path: 'inicio', loadComponent: () => import('./pages/inicio-admin/inicio-admin.component').then((m) => m.InicioAdminComponent), data: { title: 'Inicio' } },
    { path: 'paciente', loadComponent: () => import('./pages/paciente-admin/paciente-admin.component').then((m) => m.PacienteAdminComponent), data: { title: 'Paciente' } },
    { path: 'medicamentos', loadComponent: () => import('./pages/medicamentos-admin/medicamentos-admin.component').then((m) => m.MedicamentosAdminComponent), data: { title: 'Medicamentos' } },
    { path: 'historial', loadComponent: () => import('./pages/historial-admin/historial-admin.component').then((m) => m.HistorialAdminComponent), data: { title: 'Historial' } },
    { path: 'alertas', loadComponent: () => import('./pages/alertas-admin/alertas-admin.component').then((m) => m.AlertasAdminComponent), data: { title: 'Alertas' } },
    { path: 'configuracion', loadComponent: () => import('./pages/configuracion-admin/configuracion-admin.component').then((m) => m.ConfiguracionAdminComponent), data: { title: 'Configuración' } },
    { path: '', pathMatch: 'full', redirectTo: 'inicio' }
  ]
}];

