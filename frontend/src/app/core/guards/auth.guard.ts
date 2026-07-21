import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RolUsuario } from '../models/api.model';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() ? true : inject(Router).createUrlTree(['/login']);
};

export const roleGuard = (roles: RolUsuario[]): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const usuario = auth.usuario;
  if (!usuario) return router.createUrlTree(['/login']);
  return roles.includes(usuario.rol) ? true : router.createUrlTree([auth.rutaInicial(usuario)]);
};

export const loginGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.usuario ? inject(Router).createUrlTree([auth.rutaInicial(auth.usuario)]) : true;
};
