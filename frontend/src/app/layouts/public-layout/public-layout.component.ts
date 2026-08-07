import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideLogIn, LucideMenu, LucideX } from '@lucide/angular';
import { AuthService } from '../../core/services/auth.service';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-public-layout',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    ThemeToggleComponent,
    LucideLogIn,
    LucideMenu,
    LucideX,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="site-header">
      <div class="container nav">
        <a routerLink="/" class="brand"><span>IE</span><strong>Imperial Estates</strong></a>
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
    <footer>
      <div class="container footer-grid">
        <div>
          <a routerLink="/" class="brand light"><span>IE</span><strong>Imperial Estates</strong></a>
          <p>
            Considered homes. Responsive management.<br />Clear relationships from enquiry to
            move-in.
          </p>
        </div>
        <div>
          <h3>Explore</h3>
          <a routerLink="/properties">Available properties</a
          ><a routerLink="/about">About our team</a>
        </div>
        <div>
          <h3>Contact</h3>
          <a href="mailto:hello@imperialestates.example">hello@imperialestates.example</a
          ><a href="tel:+15550194000">+1 555 019 4000</a>
        </div>
      </div>
      <div class="container legal">
        <span>© {{ year }} Imperial Estates</span><span>Privacy · Accessibility</span>
      </div>
    </footer>
  `,
  styles: [
    `
      .site-header {
        position: sticky;
        top: 0;
        z-index: 30;
        background: var(--header-bg);
        backdrop-filter: blur(16px);
        border-bottom: 1px solid var(--header-border);
      }
      .nav {
        height: 78px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 11px;
      }
      .brand span {
        display: grid;
        place-items: center;
        width: 36px;
        height: 36px;
        border: 1px solid var(--ink);
        border-radius: 50%;
        font-family: Georgia, serif;
        font-size: 0.85rem;
      }
      .brand strong {
        font-family: Georgia, serif;
        font-size: 1.08rem;
        font-weight: 500;
      }
      nav {
        display: flex;
        align-items: center;
        gap: 30px;
      }
      nav > a {
        font-size: 0.87rem;
        color: var(--muted);
        font-weight: 650;
      }
      nav > a.active,
      nav > a:hover {
        color: var(--ink);
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
      footer {
        background: var(--contrast-surface);
        color: var(--contrast-text);
        padding: 72px 0 24px;
      }
      .footer-grid {
        display: grid;
        grid-template-columns: 2fr 1fr 1.4fr;
        gap: 50px;
      }
      .brand.light span {
        border-color: var(--contrast-text);
      }
      .footer-grid p {
        color: var(--contrast-muted);
        margin-top: 22px;
      }
      .footer-grid h3 {
        color: var(--contrast-subtle);
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.72rem;
      }
      .footer-grid > div:not(:first-child) {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .footer-grid a:not(.brand) {
        color: var(--contrast-link);
        font-size: 0.86rem;
      }
      .legal {
        display: flex;
        justify-content: space-between;
        border-top: 1px solid var(--contrast-border);
        margin-top: 64px;
        padding-top: 24px;
        color: var(--contrast-subtle);
        font-size: 0.75rem;
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
          top: 70px;
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
        .footer-grid {
          grid-template-columns: 1fr;
          gap: 32px;
        }
        .legal {
          gap: 20px;
          flex-direction: column;
        }
      }
    `,
  ],
})
export class PublicLayoutComponent {
  readonly menuOpen = signal(false);
  readonly year = new Date().getFullYear();
  private auth = inject(AuthService);
  signIn() {
    this.auth.signIn();
  }
}
