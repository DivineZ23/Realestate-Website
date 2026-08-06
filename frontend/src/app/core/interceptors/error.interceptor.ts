import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '../models/api.models';

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const snackBar = inject(MatSnackBar);
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const apiError = error.error as ApiError | undefined;
      const message =
        apiError?.message ??
        (error.status === 0
          ? 'The service is unreachable. Please try again.'
          : 'Something went wrong.');
      if (error.status !== 401 || !request.url.endsWith('/auth/me'))
        snackBar.open(message, 'Dismiss', { duration: 5000, panelClass: ['error-toast'] });
      return throwError(() => error);
    }),
  );
};
