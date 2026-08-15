import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, of, shareReplay, tap } from 'rxjs';
import { AccessManagementSettings, UserRole } from '../models/user.models';
import { AccessManagementService } from './management.services';
import { AuthService } from './auth.service';

const DEFAULTS: AccessManagementSettings = {
  permissions: {
    overview: all(),
    team: all(),
    analytics: all(),
    'auction.createListing': all(),
    'auction.listings': all(),
    'portfolio.properties': all(),
    'portfolio.blocks': all(),
    'portfolio.tenants': all(),
    'notices.overdue': all(),
    'notices.eviction': all(),
    'notices.overdueList': all(),
    'notices.evictionList': all(),
    'notices.syncedDataRecords': all(),
    'notices.sync': managers(),
    'administration.users': managers(),
    'administration.auditLogs': managers(),
    'administration.settings': managers(),
    'administration.accessManagement': owners(),
  },
};

function all(): Record<UserRole, boolean> {
  return { agent: true, seniorAgent: true, manager: true, owner: true };
}
function managers(): Record<UserRole, boolean> {
  return { agent: false, seniorAgent: false, manager: true, owner: true };
}
function owners(): Record<UserRole, boolean> {
  return { agent: false, seniorAgent: false, manager: false, owner: true };
}

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
