import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auht-services';
import { AlertService } from '../services/alert-service';

/**
 * Bloquea la ruta si el usuario no tiene el permiso declarado en `data.permiso`.
 * Los administradores siempre pasan (AuthService.tienePermiso ya lo contempla).
 * Se usa junto con authGuard: authGuard exige sesión, permisoGuard exige el permiso.
 */
export const permisoGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const alertService = inject(AlertService);
  const router = inject(Router);

  // Un superadministrador sin empresa activa no tiene permisos de negocio;
  // su único destino válido es la administración de empresas.
  if (authService.esSuperAdmin() && !authService.empresaActual()) {
    return router.parseUrl('/empresas');
  }

  const permiso = route.data?.['permiso'] as string | undefined;
  if (!permiso || authService.tienePermiso(permiso)) {
    return true;
  }

  // Si no puede ni ver el inicio, su rol no sirve para usar el sistema:
  // evita el bucle de redirigir a /dashboard una y otra vez.
  if (permiso === 'dashboard.ver') {
    alertService.advertencia('Tu rol no tiene permisos para usar el sistema. Contacta al administrador.');
    authService.logout();
    return false;
  }

  alertService.advertencia('No tienes permiso para acceder a esta sección.');
  return router.parseUrl('/dashboard');
};

/**
 * Bloquea la ruta a quien no sea superadministrador. Se usa para la
 * administración de empresas (crear, listar, activar/desactivar).
 */
export const superAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const alertService = inject(AlertService);
  const router = inject(Router);

  if (authService.esSuperAdmin()) {
    return true;
  }

  alertService.advertencia('Solo un superadministrador puede acceder a esta sección.');
  return router.parseUrl('/dashboard');
};
