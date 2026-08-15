import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideLogIn, LucideMenu, LucideX } from '@lucide/angular';
import { AuthService } from '../../core/services/auth.service';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { SiteCreditComponent } from '../../shared/components/site-credit/site-credit.component';

@Component({
  selector: 'app-public-layout',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    ThemeToggleComponent,
    SiteCreditComponent,
    LucideLogIn,
    LucideMenu,
    LucideX,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="site-header">
      <div class="container nav">
        <a routerLink="/" class="brand"
          ><span class="brand-logo" aria-hidden="true"></span><strong
            >Imperial Estates</strong
          ></a
        >
        <nav [class.open]="menuOpen()">
          <a
            routerLink="/"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            (click)="menuOpen.set(false)"
            >Home</a
          ><a routerLink="/properties" routerLinkActive="active" (click)="menuOpen.set(false)"
            >Properties</a
          ><a routerLink="/about" routerLinkActive="active" (click)="menuOpen.set(false)">About</a
          ><app-theme-toggle /><button class="btn btn-primary" (click)="signIn()">
            <svg lucideLogIn></svg>Team sign in
          </button>
        </nav>
        <button
          class="menu"
          type="button"
          (click)="menuOpen.update((x) => !x)"
          [attr.aria-expanded]="menuOpen()"
          aria-label="Toggle navigation"
        >
          @if (menuOpen()) {
            <svg lucideX></svg>
          } @else {
            <svg lucideMenu></svg>
          }
        </button>
      </div>
    </header>
    <main><router-outlet /></main>
    <app-site-credit />
  `,
  styles: [
    `
      :host {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }
      main {
        flex: 1;
      }
      .site-header {
        position: sticky;
        top: 0;
        z-index: 30;
        background: var(--header-bg);
        backdrop-filter: blur(18px);
        border-bottom: 1px solid var(--header-border);
      }
      .nav {
        height: 76px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 11px;
      }
      .brand .brand-logo {
        width: 58px;
        height: 58px;
        flex: 0 0 58px;
        color: var(--bronze);
      }
      .brand strong {
        font-size: 1rem;
        font-weight: 750;
        letter-spacing: -0.02em;
      }
      nav {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      nav > a {
        font-size: 0.87rem;
        color: var(--muted);
        font-weight: 650;
        position: relative;
        padding: 7px 10px;
        border-radius: 7px;
      }
      nav > a.active,
      nav > a:hover {
        color: var(--forest);
        background: var(--forest-light);
      }
      .menu {
        display: none;
        border: 0;
        background: transparent;
        padding: 10px;
        color: var(--ink);
      }
      .menu svg {
        width: 23px;
        height: 23px;
      }
      .menu:focus-visible {
        border-radius: 10px;
        outline: 3px solid var(--focus-ring);
        outline-offset: 2px;
      }
      .btn svg {
        width: 17px;
        height: 17px;
      }
      @media (max-width: 720px) {
        .menu {
          display: block;
        }
        nav {
          display: none;
          position: absolute;
          left: 14px;
          right: 14px;
          top: 66px;
          padding: 24px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          box-shadow: var(--shadow-lg);
          align-items: stretch;
          flex-direction: column;
          gap: 18px;
        }
        nav.open {
          display: flex;
        }
      }
    `,
  ],
})
export class PublicLayoutComponent {
  readonly menuOpen = signal(false);
  private auth = inject(AuthService);
  signIn() {
    this.auth.signIn();
  }
}
