import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthApiService } from '../services/auth-api.service';

export function roleGuard(...allowedRoles: string[]): CanActivateFn {
  return () => {
    const authService = inject(AuthApiService);
    const router = inject(Router);
    const userRole = authService.getUserRole();
    if (allowedRoles.includes(userRole)) return true;
    router.navigate(['/login']);
    return false;
  };
}
