import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-public-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
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
          ><button class="btn btn-primary" (click)="signIn()">Team sign in</button>
        </nav>
        <button
          class="menu"
          type="button"
          (click)="menuOpen.update((x) => !x)"
          [attr.aria-expanded]="menuOpen()"
          aria-label="Toggle navigation"
        >
          <span></span><span></span>
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
        background: rgba(247, 245, 240, 0.9);
        backdrop-filter: blur(16px);
        border-bottom: 1px solid rgba(222, 223, 217, 0.8);
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
      }
      .menu span {
        display: block;
        width: 23px;
        height: 1px;
        background: var(--ink);
        margin: 6px;
      }
      footer {
        background: #152722;
        color: #e8ece9;
        padding: 72px 0 24px;
      }
      .footer-grid {
        display: grid;
        grid-template-columns: 2fr 1fr 1.4fr;
        gap: 50px;
      }
      .brand.light span {
        border-color: #e8ece9;
      }
      .footer-grid p {
        color: #aebbb6;
        margin-top: 22px;
      }
      .footer-grid h3 {
        color: #8fa39a;
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
        color: #d7dfdc;
        font-size: 0.86rem;
      }
      .legal {
        display: flex;
        justify-content: space-between;
        border-top: 1px solid #31423d;
        margin-top: 64px;
        padding-top: 24px;
        color: #82928c;
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
