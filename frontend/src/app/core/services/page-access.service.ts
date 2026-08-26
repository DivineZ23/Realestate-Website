import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, of, shareReplay, tap } from 'rxjs';
import { AccessManagementSettings, UserRole } from '../models/user.models';
import { defaultAccessSettings } from '../constants/access-resource.constants';
import { AccessManagementService } from './management.services';
import { AuthService } from './auth.service';

const DEFAULTS: AccessManagementSettings = defaultAccessSettings();

@Injectable({ providedIn: 'root' })
export class PageAccessService {
  private readonly api = inject(AccessManagementService);
  private readonly auth = inject(AuthService);
  private readonly state = signal<AccessManagementSettings>(DEFAULTS);
  private request$?: Observable<AccessManagementSettings>;
  readonly settings = this.state.asReadonly();
  readonly loaded = signal(false);
  readonly role = computed(() => this.auth.user()?.role);

  load(): Observable<AccessManagementSettings> {
    if (this.loaded()) return of(this.state());
    return (this.request$ ??= this.api.get().pipe(
      tap((settings) => {
        this.state.set(settings);
        this.loaded.set(true);
      }),
      catchError(() => {
        this.loaded.set(true);
        return of(this.state());
      }),
      shareReplay(1),
    ));
  }
  canAccess(resource: string): boolean {
    const role = this.role();
    if (!role) return false;
    if (role === 'owner') return true;
    return this.state().permissions[resource]?.[role] === true;
  }
  save(settings: AccessManagementSettings): Observable<AccessManagementSettings> {
    return this.api.update(settings).pipe(tap((saved) => this.state.set(saved)));
  }
}
