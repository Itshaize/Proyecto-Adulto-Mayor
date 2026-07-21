import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RolUsuario } from '../models/usuario.model';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.autenticado() ? true : inject(Router).createUrlTree(['/login']);
};

export const roleGuard = (roles: RolUsuario[]): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const usuario = auth.usuarioActual();
  if (!usuario) return router.createUrlTree(['/login']);
  return roles.includes(usuario.rol) ? true : router.createUrlTree([auth.rutaInicial(usuario)]);
};

export const loginGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const usuario = auth.usuarioActual();
  return usuario ? inject(Router).createUrlTree([auth.rutaInicial(usuario)]) : true;
};
