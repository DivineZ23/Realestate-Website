import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideCheck, LucideCopy, LucideSearch } from '@lucide/angular';
import { Tenant } from '../../core/models/management.models';
import { TenantService } from '../../core/services/management.services';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-tenants',
  imports: [CurrencyPipe, FormsModule, EmptyStateComponent, LucideCheck, LucideCopy, LucideSearch],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="page-title">
      <div>
        <p class="eyebrow">Resident records</p>
        <h1>Tenants</h1>
        <div class="title-row">
          <p>One consolidated record per CID, including active property and rent totals.</p>
          <label class="tenant-search panel"
            ><svg lucideSearch></svg
            ><input
              [ngModel]="search()"
              (ngModelChange)="search.set($event)"
              placeholder="Search CID, tenant, number, or Discord ID"
              aria-label="Search tenants"
          /></label>
        </div>
      </div>
    </div>
    <div class="panel table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>CID</th>
            <th>Tenant</th>
            <th>Number</th>
            <th>Properties</th>
            <th>Total rent</th>
            <th>Discord ID</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          @for (tenant of filteredTenants(); track tenant.cid ?? tenant.id) {
            <tr>
              <td>
                <b>{{ tenant.cid ?? 'N/A' }}</b>
              </td>
              <td>{{ tenant.fullName }}</td>
              <td>{{ tenant.phoneNumber }}</td>
              <td>{{ tenant.propertyCount }}</td>
              <td>{{ tenant.totalRent | currency: 'USD' : 'symbol' : '1.0-0' }}</td>
              <td>
                <span class="discord"
                  ><code>{{ tenant.discordId || 'N/A' }}</code>
                  @if (tenant.discordId) {
                    <button
                      type="button"
                      (click)="copyDiscord(tenant)"
                      [attr.aria-label]="'Copy Discord ID for ' + tenant.fullName"
                      title="Copy Discord ID"
                    >
                      @if (copiedId() === tenant.id) {
                        <svg lucideCheck></svg>
                      } @else {
                        <svg lucideCopy></svg>
                      }
                    </button>
                  }
                </span>
              </td>
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
                  title="No tenants found"
                  message="Try another search or assign the first tenant."
                />
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>`,
  styles: [
    `
      .page-title > div {
        width: 100%;
      }
      .title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
      }
      .title-row p {
        margin: 0;
      }
      .tenant-search {
        display: flex;
        align-items: center;
        gap: 10px;
        width: min(440px, 45vw);
        padding: 0 13px;
      }
      .tenant-search svg {
        width: 18px;
        color: var(--muted);
      }
      .tenant-search input {
        width: 100%;
        height: 44px;
        border: 0;
        outline: 0;
        background: transparent;
        color: var(--ink);
      }
      .discord {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .discord code {
        font-size: 0.75rem;
      }
      .discord button {
        display: grid;
        place-items: center;
        width: 25px;
        height: 25px;
        padding: 0;
        border: 1px solid var(--border);
        border-radius: 7px;
        background: transparent;
        color: var(--muted);
        cursor: pointer;
      }
      .discord button:hover {
        border-color: var(--forest);
        color: var(--forest);
      }
      .discord svg {
        width: 13px;
        height: 13px;
      }
      .status {
        font-size: 0.72rem;
        padding: 5px 9px;
        border-radius: 99px;
        background: var(--neutral-soft);
      }
      .status.active {
        background: var(--forest-light);
        color: var(--forest);
      }
      @media (max-width: 760px) {
        .title-row {
          align-items: stretch;
          flex-direction: column;
        }
        .tenant-search {
          width: 100%;
        }
      }
    `,
  ],
})
export class TenantsComponent {
  private readonly service = inject(TenantService);
  readonly tenants = signal<Tenant[]>([]);
  readonly search = signal('');
  readonly copiedId = signal<string | null>(null);
  readonly filteredTenants = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) return this.tenants();
    return this.tenants().filter((tenant) =>
      [tenant.cid, tenant.fullName, tenant.phoneNumber, tenant.discordId].some((value) =>
        String(value ?? '')
          .toLowerCase()
          .includes(term),
      ),
    );
  });
  constructor() {
    this.service.all().subscribe({
      next: (result) => this.tenants.set(result.items),
      error: () => this.tenants.set([]),
    });
  }
  async copyDiscord(tenant: Tenant) {
    await navigator.clipboard.writeText(tenant.discordId);
    this.copiedId.set(tenant.id);
    window.setTimeout(() => this.copiedId.set(null), 1400);
  }
}
