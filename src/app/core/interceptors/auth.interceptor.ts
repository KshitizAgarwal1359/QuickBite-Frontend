import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, EMPTY } from 'rxjs';
import { AuthApiService } from '../services/auth-api.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthApiService);

  if (!req.url.includes('/login') && !req.url.includes('/register')) {
    const expiresAt = sessionStorage.getItem('qb_expires_at');
    if (expiresAt && new Date(expiresAt).getTime() < new Date().getTime()) {
      auth.clearAuth();
      router.navigate(['/login']);
      return EMPTY;
    }
  }

  const handle401 = (error: HttpErrorResponse) => {
    if (error.status === 401) {
      auth.clearAuth();
      if (router.url !== '/login') {
        router.navigate(['/login']);
      }
    }
    return throwError(() => error);
  };

  const token = sessionStorage.getItem('qb_token');
  if (token) {
    const cloned = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    return next(cloned).pipe(catchError(handle401));
  }
  
  return next(req).pipe(catchError(handle401));
};
