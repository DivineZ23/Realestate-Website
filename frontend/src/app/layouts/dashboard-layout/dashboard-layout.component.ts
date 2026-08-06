import { TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ThemeToggleComponent, TitleCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="shell" [class.collapsed]="collapsed()">
    <aside>
      <div class="aside-head">
        <a routerLink="/dashboard" class="mark">IE</a><strong>Imperial<br />Estates</strong>
      </div>
      <nav>
        <p class="first-group">Workspace</p>
        <a
          routerLink="/dashboard"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
          ><span>⌂</span><b>Overview</b></a
        ><a routerLink="/dashboard/team" routerLinkActive="active"
          ><span>♦</span><b>About the Team</b></a
        ><a routerLink="/dashboard/properties" routerLinkActive="active"
          ><span>◇</span><b>Properties</b></a
        ><a routerLink="/dashboard/blocks" routerLinkActive="active"><span>▦</span><b>Blocks</b></a
        ><a routerLink="/dashboard/tenants" routerLinkActive="active"
          ><span>♙</span><b>Tenants</b></a
        >
        @if (auth.isManager()) {
          <p>Administration</p>
          <a routerLink="/dashboard/users" routerLinkActive="active"><span>♚</span><b>Users</b></a
          ><a routerLink="/dashboard/audit-logs" routerLinkActive="active"
            ><span>≡</span><b>Audit logs</b></a
          ><a routerLink="/dashboard/settings" routerLinkActive="active"
            ><span>⚙</span><b>Settings</b></a
          >
        }
      </nav>
      <button class="collapse" (click)="collapsed.update((x) => !x)">‹ <b>Collapse</b></button>
    </aside>
    <section class="workspace">
      <header>
        <button class="mobile-menu" (click)="collapsed.update((x) => !x)">☰</button>
        <div>
          <span class="overline">Management workspace</span
          ><strong>Good {{ greeting() }}, {{ auth.user()?.displayName }}</strong>
        </div>
        <div class="account">
          <app-theme-toggle />
          <a routerLink="/dashboard/profile"
            ><img [src]="auth.user()?.avatarUrl || fallback" alt="" /><span
              ><b>{{ auth.user()?.displayName }}</b
              ><small>{{ auth.user()?.role | titlecase }}</small></span
            ></a
          ><button (click)="auth.logout()">Sign out</button>
        </div>
      </header>
      <main><router-outlet /></main>
    </section>
  </div>`,
  styles: [
    `
      .shell {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 250px 1fr;
        background: var(--workspace-bg);
      }
      aside {
        position: sticky;
        top: 0;
        height: 100vh;
        background: var(--sidebar-bg);
        color: var(--sidebar-text);
        padding: 24px 16px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .aside-head {
        height: 54px;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 10px 22px;
        border-bottom: 1px solid var(--sidebar-border);
      }
      .mark {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border: 1px solid var(--sidebar-muted);
        border-radius: 50%;
        font-family: Georgia, serif;
      }
      .aside-head strong {
        font-family: Georgia, serif;
        font-weight: 500;
        line-height: 1.05;
      }
      nav {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding-top: 24px;
        flex: 1;
      }
      nav a {
        display: flex;
        align-items: center;
        gap: 13px;
        padding: 11px 13px;
        color: var(--sidebar-link);
        border-radius: 10px;
        font-size: 0.84rem;
      }
      nav a span {
        width: 20px;
        text-align: center;
        font-size: 1rem;
      }
      nav a b {
        font-weight: 600;
      }
      nav a.active,
      nav a:hover {
        background: var(--sidebar-active);
        color: var(--sidebar-active-text);
      }
      nav p {
        margin: 24px 13px 6px;
        color: var(--sidebar-subtle);
        font-size: 0.66rem;
        text-transform: uppercase;
        letter-spacing: 0.14em;
      }
      nav p.first-group {
        margin-top: 0;
      }
      .collapse {
        border: 0;
        background: transparent;
        color: var(--sidebar-muted);
        text-align: left;
        padding: 12px;
        display: flex;
        gap: 14px;
        cursor: pointer;
      }
      .workspace {
        min-width: 0;
      }
      .workspace > header {
        height: 82px;
        background: var(--surface);
        border-bottom: 1px solid var(--border);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 32px;
        position: sticky;
        top: 0;
        z-index: 20;
      }
      .workspace > header > div:first-of-type {
        display: grid;
      }
      .overline {
        font-size: 0.68rem;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }
      .workspace > header strong {
        font-size: 0.94rem;
      }
      .account,
      .account a {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .account img {
        width: 38px;
        height: 38px;
        object-fit: cover;
        border-radius: 50%;
      }
      .account span {
        display: grid;
      }
      .account small {
        color: var(--muted);
        text-transform: capitalize;
      }
      .account button {
        border: 0;
        border-left: 1px solid var(--border);
        background: transparent;
        margin-left: 10px;
        padding-left: 18px;
        cursor: pointer;
      }
      .workspace main {
        padding: 32px;
        max-width: 1500px;
        margin: 0 auto;
      }
      .mobile-menu {
        display: none;
      }
      .collapsed {
        grid-template-columns: 78px 1fr;
      }
      .collapsed .aside-head strong,
      .collapsed nav b,
      .collapsed nav p,
      .collapsed .collapse b {
        display: none;
      }
      .collapsed .aside-head {
        padding-inline: 4px;
      }
      .collapsed nav a {
        justify-content: center;
      }
      .collapsed .collapse {
        justify-content: center;
      }
      @media (max-width: 900px) {
        .shell,
        .collapsed {
          grid-template-columns: 1fr;
        }
        aside {
          position: fixed;
          z-index: 40;
          width: 250px;
          transform: translateX(-105%);
          transition: transform var(--ease);
        }
        .collapsed aside {
          transform: translateX(0);
        }
        .collapsed .aside-head strong,
        .collapsed nav b,
        .collapsed nav p,
        .collapsed .collapse b {
          display: block;
        }
        .collapsed nav a {
          justify-content: flex-start;
        }
        .mobile-menu {
          display: block;
          border: 0;
          background: none;
          font-size: 1.3rem;
        }
        .workspace > header {
          padding: 0 18px;
        }
        .workspace main {
          padding: 20px 14px;
        }
        .account span,
        .account button {
          display: none;
        }
      }
    `,
  ],
})
export class DashboardLayoutComponent {
  readonly auth = inject(AuthService);
  readonly collapsed = signal(false);
  readonly fallback = 'https://api.dicebear.com/9.x/initials/svg?seed=Imperial';
  readonly greeting = computed(() =>
    new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening',
  );
}
