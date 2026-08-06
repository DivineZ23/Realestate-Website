import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.loadCurrentUser().pipe(
    map((user) => {
      if (!user) return router.createUrlTree(['/']);
      if (user.approvalStatus === 'pending' || user.accessStatus === 'pending')
        return router.createUrlTree(['/pending-approval']);
      if (user.approvalStatus === 'rejected' || user.accessStatus === 'revoked')
        return router.createUrlTree(['/access-revoked']);
      return true;
    }),
  );
};

export const managerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth
    .loadCurrentUser()
    .pipe(
      map((user) =>
        user?.role === 'manager' &&
        user.approvalStatus === 'approved' &&
        user.accessStatus === 'active'
          ? true
          : router.createUrlTree(['/dashboard']),
      ),
    );
};
