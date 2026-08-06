import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';
import { TenantService } from '../../core/services/management.services';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
@Component({
  selector: 'app-tenants',
  imports: [CurrencyPipe, DatePipe, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="page-title">
      <p class="eyebrow">Resident records</p>
      <h1>Tenants</h1>
      <p>
        Current and historical tenancy records. Sensitive identifiers are intentionally omitted from
        this list.
      </p>
    </div>
    <div class="panel table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Tenant</th>
            <th>Contact</th>
            <th>Property</th>
            <th>Start</th>
            <th>End</th>
            <th>Monthly rent</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          @for (tenant of tenants(); track tenant.id) {
            <tr>
              <td>
                <b>{{ tenant.fullName }}</b>
              </td>
              <td>
                {{ tenant.phoneNumber }}<small>{{ tenant.email }}</small>
              </td>
              <td>{{ tenant.propertyId }}</td>
              <td>{{ tenant.startDate | date: 'mediumDate' }}</td>
              <td>{{ tenant.endDate ? (tenant.endDate | date: 'mediumDate') : '—' }}</td>
              <td>{{ tenant.monthlyRent | currency: 'USD' : 'symbol' : '1.0-0' }}</td>
              <td>
                <span class="status" [class.active]="tenant.status.toLowerCase() === 'active'">{{
                  tenant.status
                }}</span>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="7">
                <app-empty-state
                  title="No tenancy records"
                  message="Finalized tenancies will appear here."
                />
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>`,
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
      }
      td small {
        display: block;
        color: var(--muted);
      }
      .status {
        font-size: 0.72rem;
        padding: 5px 9px;
        border-radius: 99px;
        background: #eee;
      }
      .status.active {
        background: var(--forest-light);
        color: var(--forest);
      }
    `,
  ],
})
export class TenantsComponent {
  private service = inject(TenantService);
  readonly tenants = toSignal(
    this.service.all().pipe(
      map((result) => result.items),
      catchError(() => of([])),
    ),
    { initialValue: [] },
  );
}
