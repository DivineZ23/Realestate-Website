import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { DashboardSummary } from '../../core/models/management.models';
import { DashboardService } from '../../core/services/management.services';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-dashboard-overview',
  imports: [DatePipe, RouterLink, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="page-title">
      <div>
        <p class="eyebrow">Portfolio pulse</p>
        <h1>Overview</h1>
        <p>Live operational status across Imperial Estates.</p>
      </div>
      <a class="btn btn-primary" routerLink="/dashboard/properties/new">Add property</a>
    </div>
    @if (summary(); as s) {
      <div class="stats">
        <article>
          <span>Total properties</span><b>{{ s.totalProperties }}</b
          ><small>Across {{ s.totalBlocks }} blocks</small>
        </article>
        <article class="available">
          <span>Available</span><b>{{ s.availableProperties }}</b
          ><small>Open for enquiries</small>
        </article>
        <article>
          <span>Booked</span><b>{{ s.bookedProperties }}</b
          ><small>Awaiting tenancy</small>
        </article>
        <article>
          <span>Occupied</span><b>{{ s.occupiedProperties }}</b
          ><small>Active tenancies</small>
        </article>
        <article>
          <span>Unavailable</span><b>{{ s.unavailableProperties }}</b
          ><small>Internal or maintenance</small>
        </article>
      </div>
      <div class="dashboard-grid">
        <section class="panel activity">
          <div class="panel-head">
            <div>
              <h2>Recent status changes</h2>
              <p>Latest movement across the portfolio</p>
            </div>
            <a routerLink="/dashboard/properties">View properties</a>
          </div>
          @for (item of s.recentStatusChanges; track item.id) {
            <div class="event">
              <span class="dot"></span>
              <div>
                <b>Property status updated</b>
                <p>
                  <app-status-badge [status]="item.previousStatus" /> <span>→</span>
                  <app-status-badge [status]="item.newStatus" />
                </p>
              </div>
              <time>{{ item.createdAt | date: 'mediumDate' }}</time>
            </div>
          } @empty {
            <p class="empty">No status changes yet.</p>
          }
        </section>
        <aside>
          <section class="panel actions">
            <h2>Needs attention</h2>
            <a routerLink="/dashboard/enquiries"
              ><span>New enquiries</span><b>{{ s.pendingEnquiries }}</b></a
            >
            @if (s.pendingUsers > 0) {
              <a routerLink="/dashboard/users"
                ><span>Pending approvals</span><b>{{ s.pendingUsers }}</b></a
              >
            }
            <a routerLink="/dashboard/properties"
              ><span>Unavailable properties</span><b>{{ s.unavailableProperties }}</b></a
            >
          </section>
          <section class="panel occupancy">
            <div class="ring" [style.--pct]="occupancyPercent(s)">
              <span>{{ occupancyPercent(s) }}%</span>
            </div>
            <div>
              <h2>Occupancy</h2>
              <p>Occupied properties as a share of the active portfolio.</p>
            </div>
          </section>
        </aside>
      </div>
    } @else {
      <div class="loading">Loading portfolio…</div>
    }`,
  styles: [
    `
      .page-title {
        display: flex;
        justify-content: space-between;
        align-items: end;
        margin-bottom: 28px;
      }
      .page-title h1 {
        font-size: 2.6rem;
        margin: 5px 0;
      }
      .page-title p:last-child {
        color: var(--muted);
        margin: 0;
      }
      .stats {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 14px;
        margin-bottom: 20px;
      }
      .stats article {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 20px;
        display: grid;
      }
      .stats span,
      .stats small {
        color: var(--muted);
        font-size: 0.75rem;
      }
      .stats b {
        font-size: 2rem;
        margin: 10px 0;
      }
      .stats .available {
        background: var(--forest);
        color: #fff;
      }
      .stats .available span,
      .stats .available small {
        color: #aec3ba;
      }
      .dashboard-grid {
        display: grid;
        grid-template-columns: 1.4fr 0.6fr;
        gap: 20px;
      }
      .activity {
        padding: 24px;
      }
      .panel-head {
        display: flex;
        justify-content: space-between;
        border-bottom: 1px solid var(--border);
        padding-bottom: 16px;
      }
      .panel-head h2,
      .actions h2 {
        font-size: 1.2rem;
        margin-bottom: 4px;
      }
      .panel-head p {
        color: var(--muted);
        font-size: 0.78rem;
        margin: 0;
      }
      .panel-head a {
        font-size: 0.78rem;
        font-weight: 700;
      }
      .event {
        display: grid;
        grid-template-columns: 12px 1fr auto;
        gap: 12px;
        align-items: start;
        padding: 18px 0;
        border-bottom: 1px solid var(--border);
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--bronze);
        margin-top: 7px;
      }
      .event p {
        display: flex;
        align-items: center;
        gap: 7px;
        margin: 7px 0 0;
      }
      .event time {
        color: var(--muted);
        font-size: 0.75rem;
      }
      .empty {
        color: var(--muted);
        padding: 30px 0;
      }
      aside {
        display: grid;
        gap: 20px;
      }
      .actions {
        padding: 24px;
      }
      .actions a {
        display: flex;
        justify-content: space-between;
        padding: 15px 0;
        border-bottom: 1px solid var(--border);
        font-size: 0.85rem;
      }
      .actions a b {
        display: grid;
        place-items: center;
        min-width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--forest-light);
        color: var(--forest);
      }
      .occupancy {
        padding: 24px;
        display: flex;
        align-items: center;
        gap: 20px;
      }
      .ring {
        --pct: 0;
        width: 88px;
        height: 88px;
        flex: 0 0 auto;
        border-radius: 50%;
        background: conic-gradient(var(--forest) calc(var(--pct) * 1%), var(--forest-light) 0);
        display: grid;
        place-items: center;
        position: relative;
      }
      .ring:after {
        content: '';
        position: absolute;
        width: 66px;
        height: 66px;
        border-radius: 50%;
        background: var(--surface);
      }
      .ring span {
        z-index: 1;
        font-weight: 800;
      }
      .occupancy h2 {
        font-size: 1.1rem;
        margin-bottom: 5px;
      }
      .occupancy p {
        color: var(--muted);
        font-size: 0.75rem;
        margin: 0;
      }
      .loading {
        padding: 80px;
        text-align: center;
        color: var(--muted);
      }
      @media (max-width: 1100px) {
        .stats {
          grid-template-columns: repeat(3, 1fr);
        }
        .dashboard-grid {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 650px) {
        .page-title {
          align-items: start;
          gap: 20px;
        }
        .page-title .btn {
          display: none;
        }
        .stats {
          grid-template-columns: 1fr 1fr;
        }
        .stats article:first-child {
          grid-column: 1/-1;
        }
        .event {
          grid-template-columns: 12px 1fr;
        }
        .event time {
          display: none;
        }
      }
    `,
  ],
})
export class DashboardOverviewComponent {
  private service = inject(DashboardService);
  readonly summary = toSignal(this.service.get().pipe(catchError(() => of(null))), {
    initialValue: null,
  });
  occupancyPercent(s: DashboardSummary) {
    return s.totalProperties ? Math.round((100 * s.occupiedProperties) / s.totalProperties) : 0;
  }
}
