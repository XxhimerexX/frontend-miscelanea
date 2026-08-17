import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auht-services';
import { inject } from '@angular/core';

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
  return next(req);
};
