import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../services/auht-services';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authServices = inject(AuthService);
  const token = authServices.obtenerToken();

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si una petición autenticada devuelve 401, la sesión ya no vale
      // (token expirado, usuario desactivado o cierre de sesión forzado).
      const esLogin = req.url.includes('/auth/login');
      if (error.status === 401 && token && !esLogin) {
        authServices.logout();
      }
      return throwError(() => error);
    })
  );
};
