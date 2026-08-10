import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { LucideBadgeDollarSign, LucideHouse, LucideUserX } from '@lucide/angular';
import { catchError, of } from 'rxjs';
import { DashboardService } from '../../core/services/management.services';

@Component({
  selector: 'app-personal-analytics',
  imports: [CurrencyPipe, DatePipe, LucideBadgeDollarSign, LucideHouse, LucideUserX],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="page-title">
      <div>
        <p class="eyebrow">Personal performance</p>
        <h1>Analytics</h1>
        <p>Your sales, deposits, and eviction activity.</p>
      </div>
    </div>
    @if (stats(); as s) {
      <div class="metrics">
        <article class="panel">
          <div class="metric-copy">
            <span>Houses sold</span>
            <b>{{ s.housesSold }}</b>
          </div>
          <div class="metric-icon" aria-hidden="true"><svg lucideHouse></svg></div>
        </article>
        <article class="panel">
          <div class="metric-copy">
            <span>Houses evicted</span>
            <b>{{ s.housesEvicted }}</b>
          </div>
          <div class="metric-icon" aria-hidden="true"><svg lucideUserX></svg></div>
        </article>
        <article class="panel">
          <div class="metric-copy">
            <span>Total deposit taken</span>
            <b>{{ s.totalDepositTaken | currency: 'USD' : 'symbol' : '1.0-0' }}</b>
          </div>
          <div class="metric-icon" aria-hidden="true"><svg lucideBadgeDollarSign></svg></div>
        </article>
      </div>
      <div class="activity-grid">
        <section class="panel">
          <header>
            <h2>Recent sales</h2>
            <p>Your latest completed property sales.</p>
          </header>
          @for (item of s.recentSales; track item.id) {
            <div class="activity">
              <div>
                <b>{{ item.propertyName }}</b
                ><span>{{ item.tenantName }} · CID {{ item.cid ?? 'N/A' }}</span>
              </div>
              <div>
                <b>{{ item.amount | currency: 'USD' : 'symbol' : '1.0-0' }}</b
                ><time>{{ item.occurredAt | date: 'mediumDate' }}</time>
              </div>
            </div>
          } @empty {
            <p class="empty">No sales recorded yet.</p>
          }
        </section>
        <section class="panel">
          <header>
            <h2>Recent evictions</h2>
            <p>Properties you most recently evicted.</p>
          </header>
          @for (item of s.recentEvictions; track item.id) {
            <div class="activity">
              <div>
                <b>{{ item.propertyName }}</b
                ><span>{{ item.tenantName }} · CID {{ item.cid ?? 'N/A' }}</span>
              </div>
              <time>{{ item.occurredAt | date: 'mediumDate' }}</time>
            </div>
          } @empty {
            <p class="empty">No evictions recorded yet.</p>
          }
        </section>
      </div>
    } @else {
      <div class="panel loading">Loading personal analytics…</div>
    }`,
  styles: [
    `
      .page-title {
        margin-bottom: 24px;
      }
      .page-title h1 {
        font-size: 2.5rem;
        margin: 4px 0;
      }
      .page-title p:last-child {
        color: var(--muted);
        margin: 0;
      }
      .metrics {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
        margin-bottom: 20px;
      }
      .metrics article {
        position: relative;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
        min-height: 96px;
        padding: 18px 20px;
        overflow: hidden;
      }
      .metrics article::before {
        position: absolute;
        inset: 0 auto 0 0;
        width: 3px;
        background: var(--forest);
        content: '';
      }
      .metric-copy {
        display: grid;
        gap: 5px;
        min-width: 0;
      }
      .metric-copy span {
        color: var(--muted);
        font-size: 0.78rem;
        font-weight: 600;
      }
      .metric-copy b {
        color: var(--ink);
        font-size: 1.9rem;
        line-height: 1;
        letter-spacing: -0.035em;
      }
      .metric-icon {
        display: grid;
        flex: 0 0 42px;
        width: 42px;
        height: 42px;
        place-items: center;
        border: 1px solid color-mix(in srgb, var(--forest) 30%, var(--border));
        border-radius: 11px;
        background: var(--forest-light);
        color: var(--forest);
      }
      .metric-icon svg {
        width: 20px;
        height: 20px;
      }
      .activity-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }
      .activity-grid section {
        padding: 22px;
      }
      .activity-grid header {
        padding-bottom: 14px;
        border-bottom: 1px solid var(--border);
      }
      h2 {
        margin: 0;
        font-size: 1.15rem;
      }
      header p,
      .empty {
        margin: 4px 0 0;
        color: var(--muted);
        font-size: 0.78rem;
      }
      .activity {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        padding: 15px 0;
        border-bottom: 1px solid var(--border);
      }
      .activity > div {
        display: grid;
        gap: 3px;
      }
      .activity > div:last-child {
        text-align: right;
      }
      .activity span,
      .activity time {
        color: var(--muted);
        font-size: 0.73rem;
      }
      .loading,
      .empty {
        padding: 30px;
      }
      @media (max-width: 800px) {
        .metrics,
        .activity-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class PersonalAnalyticsComponent {
  private readonly dashboard = inject(DashboardService);
  readonly stats = toSignal(this.dashboard.personal().pipe(catchError(() => of(null))), {
    initialValue: null,
  });
}
