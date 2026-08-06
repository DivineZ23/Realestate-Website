import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { authGuard, managerGuard } from './auth.guard';

describe('route guards', () => {
  const run = (guard: typeof authGuard) =>
    TestBed.runInInjectionContext(() => guard({} as never, {} as never));

  it('routes pending users to approval status', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            loadCurrentUser: () =>
              of({ role: 'agent', approvalStatus: 'pending', accessStatus: 'pending' }),
          },
        },
      ],
    });
    const result = (await firstValueFrom(run(authGuard) as never)) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/pending-approval');
  });

  it('blocks agents from manager routes', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            loadCurrentUser: () =>
              of({ role: 'agent', approvalStatus: 'approved', accessStatus: 'active' }),
          },
        },
      ],
    });
    const result = (await firstValueFrom(run(managerGuard) as never)) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/dashboard');
  });
});
