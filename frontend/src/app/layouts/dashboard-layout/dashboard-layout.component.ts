import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideBell,
  LucideBlocks,
  LucideBuilding2,
  LucideChevronDown,
  LucideClipboardList,
  LucideClockAlert,
  LucideContactRound,
  LucideDatabaseZap,
  LucideFileWarning,
  LucideGavel,
  LucideLayoutDashboard,
  LucideList,
  LucideListChecks,
  LucideListX,
  LucideLogOut,
  LucideMenu,
  LucidePanelLeftClose,
  LucidePanelLeftOpen,
  LucideScrollText,
  LucideSettings,
  LucideShieldCheck,
  LucideUsersRound,
} from '@lucide/angular';
import { AuthService } from '../../core/services/auth.service';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-dashboard-layout',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    ThemeToggleComponent,
    LucideBell,
    LucideLayoutDashboard,
    LucideUsersRound,
    LucideBuilding2,
    LucideChevronDown,
    LucideClipboardList,
    LucideClockAlert,
    LucideBlocks,
    LucideContactRound,
    LucideDatabaseZap,
    LucideFileWarning,
    LucideGavel,
    LucideList,
    LucideListChecks,
    LucideListX,
    LucideShieldCheck,
    LucideScrollText,
    LucideSettings,
    LucidePanelLeftClose,
    LucidePanelLeftOpen,
    LucideMenu,
    LucideLogOut,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="shell" [class.collapsed]="collapsed()">
    <aside>
      <div class="aside-head">
        <a routerLink="/dashboard" class="mark" aria-label="Imperial Estates dashboard"
          ><img src="/assets/imperial-estates-logo.png" alt="" /></a
        ><strong>Imperial<br />Estates</strong>
      </div>
      <nav aria-label="Dashboard sections">
        <section class="nav-section">
          <button
            class="section-toggle"
            type="button"
            [attr.aria-expanded]="auctionOpen()"
            aria-controls="auction-navigation"
            (click)="auctionOpen.update((open) => !open)"
          >
            <span><svg lucideGavel></svg><b>Auction</b></span>
            <svg class="chevron" lucideChevronDown [class.rotated]="!auctionOpen()"></svg>
          </button>
          @if (auctionOpen()) {
            <div class="section-links" id="auction-navigation">
              <a routerLink="/dashboard/auction/listings" routerLinkActive="active"
                ><svg lucideClipboardList></svg><b>Listings</b></a
              >
            </div>
          }
        </section>
        <section class="nav-section">
          <button
            class="section-toggle"
            type="button"
            [attr.aria-expanded]="portfolioOpen()"
            aria-controls="portfolio-navigation"
            (click)="portfolioOpen.update((open) => !open)"
          >
            <span><svg lucideBuilding2></svg><b>Portfolio</b></span>
            <svg class="chevron" lucideChevronDown [class.rotated]="!portfolioOpen()"></svg>
          </button>
          @if (portfolioOpen()) {
            <div class="section-links" id="portfolio-navigation">
              <a routerLink="/dashboard/properties" routerLinkActive="active"
                ><svg lucideBuilding2></svg><b>Properties</b></a
              ><a routerLink="/dashboard/blocks" routerLinkActive="active"
                ><svg lucideBlocks></svg><b>Blocks</b></a
              ><a routerLink="/dashboard/tenants" routerLinkActive="active"
                ><svg lucideContactRound></svg><b>Tenants</b></a
              >
            </div>
          }
        </section>
        <section class="nav-section">
          <button
            class="section-toggle"
            type="button"
            [attr.aria-expanded]="noticesOpen()"
            aria-controls="notices-navigation"
            (click)="noticesOpen.update((open) => !open)"
          >
            <span><svg lucideBell></svg><b>Notices</b></span>
            <svg class="chevron" lucideChevronDown [class.rotated]="!noticesOpen()"></svg>
          </button>
          @if (noticesOpen()) {
            <div class="section-links" id="notices-navigation">
              @if (auth.isManager()) {
                <a routerLink="/dashboard/notices/sync" routerLinkActive="active"
                  ><svg lucideDatabaseZap></svg><b>Data Sync</b></a
                >
              }
              <a routerLink="/dashboard/notices/active" routerLinkActive="active"
                ><svg lucideListChecks></svg><b>Active List</b></a
              ><a routerLink="/dashboard/notices/overdue-list" routerLinkActive="active"
                ><svg lucideList></svg><b>Overdue List</b></a
              ><a routerLink="/dashboard/notices/eviction-list" routerLinkActive="active"
                ><svg lucideListX></svg><b>Eviction List</b></a
              ><a routerLink="/dashboard/notices/overdue" routerLinkActive="active"
                ><svg lucideClockAlert></svg><b>Overdue Notice</b></a
              ><a routerLink="/dashboard/notices/eviction" routerLinkActive="active"
                ><svg lucideFileWarning></svg><b>Eviction Notice</b></a
              >
            </div>
          }
        </section>
        @if (auth.isManager()) {
          <section class="nav-section">
            <button
              class="section-toggle"
              type="button"
              [attr.aria-expanded]="administrationOpen()"
              aria-controls="administration-navigation"
              (click)="administrationOpen.update((open) => !open)"
            >
              <span><svg lucideShieldCheck></svg><b>Administration</b></span>
              <svg class="chevron" lucideChevronDown [class.rotated]="!administrationOpen()"></svg>
            </button>
            @if (administrationOpen()) {
              <div class="section-links" id="administration-navigation">
                <a routerLink="/dashboard/users" routerLinkActive="active"
                  ><svg lucideUsersRound></svg><b>User Management</b></a
                ><a routerLink="/dashboard/audit-logs" routerLinkActive="active"
                  ><svg lucideScrollText></svg><b>Audit Logs</b></a
                ><a routerLink="/dashboard/settings" routerLinkActive="active"
                  ><svg lucideSettings></svg><b>Settings</b></a
                >
              </div>
            }
          </section>
        }
      </nav>
      <button class="collapse" (click)="collapsed.update((x) => !x)" aria-label="Toggle sidebar">
        @if (collapsed()) {
          <svg lucidePanelLeftOpen></svg>
        } @else {
          <svg lucidePanelLeftClose></svg>
        }
        <b>Collapse</b>
      </button>
    </aside>
    <section class="workspace">
      <header>
        <button
          class="mobile-menu"
          (click)="collapsed.update((x) => !x)"
          aria-label="Toggle dashboard navigation"
        >
          <svg lucideMenu></svg>
        </button>
        <div class="header-greeting">
          <strong>Good {{ greeting() }}, {{ auth.user()?.displayName }}</strong>
        </div>
        <nav class="breadcrumb" aria-label="Dashboard breadcrumb">
          <a
            routerLink="/dashboard"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            ><svg lucideLayoutDashboard></svg>Overview</a
          ><a routerLink="/dashboard/team" routerLinkActive="active"
            ><svg lucideUsersRound></svg>Team</a
          >
        </nav>
        <div class="account">
          <app-theme-toggle />
          <a routerLink="/dashboard/profile"
            ><img [src]="auth.user()?.avatarUrl || fallback" alt="" /><span
              ><b>{{ auth.user()?.displayName }}</b
              ><small>{{ auth.user()?.role }}</small></span
            ></a
          ><button (click)="auth.logout()"><svg lucideLogOut></svg><span>Sign out</span></button>
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
        overflow-y: auto;
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
        width: 44px;
        height: 44px;
        border-radius: 50%;
        overflow: hidden;
        flex: 0 0 auto;
        box-shadow: 0 0 0 1px var(--sidebar-border);
      }
      .mark img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .aside-head strong {
        font-family: Georgia, serif;
        font-weight: 500;
        line-height: 1.05;
      }
      nav {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding-top: 24px;
        flex: 1;
      }
      .section-toggle,
      nav a {
        display: flex;
        align-items: center;
        gap: 13px;
        padding: 11px 13px;
        color: var(--sidebar-link);
        border-radius: 10px;
        font-size: 0.84rem;
      }
      .section-toggle {
        width: 100%;
        justify-content: space-between;
        border: 0;
        background: transparent;
        cursor: pointer;
      }
      .section-toggle > span {
        display: flex;
        align-items: center;
        gap: 13px;
      }
      .section-toggle:hover {
        background: var(--sidebar-active);
        color: var(--sidebar-active-text);
      }
      .section-links {
        padding-left: 13px;
        border-left: 1px solid var(--sidebar-border);
        margin-left: 22px;
      }
      nav a svg,
      .section-toggle svg {
        width: 20px;
        height: 20px;
        flex: 0 0 auto;
        stroke-width: 1.8;
      }
      .section-toggle .chevron.rotated {
        transform: rotate(-90deg);
      }
      nav a b {
        font-weight: 600;
      }
      nav a.active,
      nav a:hover {
        background: var(--sidebar-active);
        color: var(--sidebar-active-text);
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
      .collapse svg {
        width: 18px;
        height: 18px;
      }
      .workspace {
        min-width: 0;
      }
      .workspace > header {
        height: 82px;
        background: var(--surface);
        border-bottom: 1px solid var(--border);
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
        align-items: center;
        padding: 0 32px;
        position: sticky;
        top: 0;
        z-index: 20;
      }
      .breadcrumb {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 24px;
        padding: 0;
      }
      .breadcrumb a {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 0;
        color: var(--muted);
        font-size: 0.92rem;
      }
      .breadcrumb a:hover,
      .breadcrumb a.active {
        color: var(--ink);
        background: transparent;
      }
      .account,
      .account a {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .account {
        justify-self: end;
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
        display: inline-flex;
        align-items: center;
        gap: 7px;
        color: var(--ink);
      }
      .account button svg {
        width: 16px;
        height: 16px;
      }
      .workspace main {
        padding: 32px;
        max-width: 1500px;
        margin: 0 auto;
      }
      .mobile-menu {
        display: none;
      }
      .mobile-menu svg {
        width: 21px;
        height: 21px;
      }
      .collapsed {
        grid-template-columns: 78px 1fr;
      }
      .collapsed .aside-head strong,
      .collapsed nav b,
      .collapsed .section-toggle .chevron,
      .collapsed .collapse b {
        display: none;
      }
      .collapsed .aside-head {
        padding-inline: 4px;
      }
      .collapsed nav a,
      .collapsed .section-toggle {
        justify-content: center;
      }
      .collapsed .section-links {
        padding-left: 0;
        margin-left: 0;
        border-left: 0;
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
        .collapsed .section-toggle .chevron,
        .collapsed .collapse b {
          display: block;
        }
        .collapsed nav a,
        .collapsed .section-toggle {
          justify-content: flex-start;
        }
        .collapsed .section-toggle {
          justify-content: space-between;
        }
        .collapsed .section-links {
          padding-left: 13px;
          margin-left: 22px;
          border-left: 1px solid var(--sidebar-border);
        }
        .mobile-menu {
          display: block;
          border: 0;
          background: none;
          font-size: 1.3rem;
        }
        .workspace > header {
          grid-template-columns: auto 1fr auto;
          padding: 0 18px;
        }
        .header-greeting {
          display: none;
        }
        .workspace main {
          padding: 20px 14px;
        }
        .account a span,
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
  readonly portfolioOpen = signal(true);
  readonly auctionOpen = signal(true);
  readonly noticesOpen = signal(true);
  readonly administrationOpen = signal(true);
  readonly fallback = 'https://api.dicebear.com/9.x/initials/svg?seed=Imperial';
  readonly greeting = computed(() =>
    new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening',
  );
}
