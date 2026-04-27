import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthApiService } from '../services/auth-api.service';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthApiService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    const role = auth.getUserRole();
    if (role === 'OWNER') { return router.parseUrl('/owner'); }
    if (role === 'ADMIN') { return router.parseUrl('/admin'); }
    if (role === 'AGENT') { return router.parseUrl('/agent'); }
    return router.parseUrl('/'); 
  }
  return true;
};
