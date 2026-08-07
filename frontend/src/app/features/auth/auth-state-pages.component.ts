import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideClock3,
  LucideHouse,
  LucideLoaderCircle,
  LucideRotateCcw,
  LucideShieldX,
} from '@lucide/angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-pending-approval',
  imports: [RouterLink, LucideClock3, LucideHouse, LucideRotateCcw],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="state">
    <div>
      <span><svg lucideClock3></svg></span>
      <p class="eyebrow">Registration received</p>
      <h1>Awaiting approval.</h1>
      <p>
        Your Discord profile is connected. A manager needs to approve your team access before the
        workspace becomes available.
      </p>
      <div class="actions">
        <a routerLink="/" class="btn btn-secondary"><svg lucideHouse></svg>Return home</a
        ><button class="btn btn-primary" (click)="refresh()">
          <svg lucideRotateCcw></svg>Check status
        </button>
      </div>
    </div>
  </section>`,
  styles: [
    `
      .state {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 30px;
        background: var(--paper);
        text-align: center;
      }
      .state > div {
        max-width: 620px;
      }
      .state > div > span {
        display: grid;
        place-items: center;
        width: 70px;
        height: 70px;
        margin: 0 auto 26px;
        border-radius: 50%;
        background: var(--forest-light);
      }
      .state > div > span svg {
        width: 30px;
        height: 30px;
      }
      .state h1 {
        font-size: clamp(2.8rem, 7vw, 5rem);
        margin: 16px;
      }
      .state p:not(.eyebrow) {
        color: var(--muted);
        font-size: 1.05rem;
      }
      .actions {
        display: flex;
        justify-content: center;
        gap: 12px;
        margin-top: 30px;
      }
    `,
  ],
})
export class PendingApprovalComponent {
  private auth = inject(AuthService);
  refresh() {
    this.auth.refresh();
    setTimeout(() => {
      const user = this.auth.user();
      if (user?.approvalStatus === 'approved' && user.accessStatus === 'active')
        window.location.assign('/dashboard');
    }, 700);
  }
}

@Component({
  selector: 'app-access-revoked',
  imports: [RouterLink, LucideHouse, LucideShieldX],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="state">
    <div>
      <span><svg lucideShieldX></svg></span>
      <p class="eyebrow">Access unavailable</p>
      <h1>Your workspace access is inactive.</h1>
      <p>
        If you believe this is unexpected, contact an Imperial Estates manager. Public property
        pages remain available.
      </p>
      <a routerLink="/" class="btn btn-primary"><svg lucideHouse></svg>Return to public site</a>
    </div>
  </section>`,
  styles: [
    `
      .state {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 30px;
        text-align: center;
      }
      .state > div {
        max-width: 670px;
      }
      .state span {
        display: grid;
        place-items: center;
        width: 70px;
        height: 70px;
        margin: 0 auto 26px;
        border-radius: 50%;
        background: var(--danger-soft);
        color: var(--danger);
      }
      .state span svg {
        width: 30px;
        height: 30px;
      }
      .state h1 {
        font-size: clamp(2.6rem, 7vw, 4.7rem);
        margin: 16px;
      }
      .state p:not(.eyebrow) {
        color: var(--muted);
        margin-bottom: 30px;
      }
    `,
  ],
})
export class AccessRevokedComponent {}

@Component({
  selector: 'app-auth-callback',
  imports: [LucideLoaderCircle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="loading"><svg lucideLoaderCircle></svg>Completing secure sign-in…</div>`,
  styles: [
    `
      .loading {
        height: 100vh;
        display: grid;
        place-items: center;
        color: var(--muted);
      }
      .loading svg {
        width: 26px;
        height: 26px;
        animation: spin 0.9s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class AuthCallbackComponent {}
