import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LucideCheck, LucidePencil, LucideRotateCcw, LucideSave, LucideX } from '@lucide/angular';
import {
  CommissionOverview,
  CommissionRecord,
  CommissionSettings,
} from '../../core/models/commission.models';
import { USER_ROLES } from '../../core/constants/user-role.constants';
import { AuthService } from '../../core/services/auth.service';
import { CommissionService } from '../../core/services/management.services';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

type LedgerFilter = 'outstanding' | 'received' | 'all';

@Component({
  selector: 'app-commissions',
  imports: [
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    EmptyStateComponent,
    LucideCheck,
    LucidePencil,
    LucideRotateCcw,
    LucideSave,
    LucideX,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-title">
      <div>
        <p class="eyebrow">Finance</p>
        <h1>Commissions</h1>
        <p>
          {{
            auth.isManager()
              ? 'Track commission liabilities by agent and reconcile every payment.'
              : 'Review the commission recorded against your completed property sales.'
          }}
        </p>
      </div>
      @if (!auth.isManager()) {
        <div class="level-chip panel">
          <span>Current grade</span><strong>Level {{ currentLevel() }}</strong>
        </div>
      }
    </div>

    @if (overview(); as data) {
      <section class="metrics" aria-label="Commission summary">
        <article class="panel metric attention">
          <span>Outstanding</span>
          <strong>{{ data.totalOutstanding | currency: 'USD' : 'symbol' : '1.0-2' }}</strong>
          <small>{{ outstandingCount() }} unpaid commission records</small>
        </article>
        <article class="panel metric">
          <span>Received</span>
          <strong>{{ data.totalReceived | currency: 'USD' : 'symbol' : '1.0-2' }}</strong>
          <small>Confirmed and reconciled</small>
        </article>
        <article class="panel metric">
          <span>Commissioned sales</span>
          <strong>{{ data.records.length }}</strong>
          <small>Rate and level frozen at sale time</small>
        </article>
      </section>

      @if (auth.isManager()) {
        @if (data.settings; as settings) {
          <section class="panel rate-panel">
            <div class="section-heading">
              <div>
                <p class="eyebrow">Commission grades</p>
                <h2>Deposit percentage by role and level</h2>
                <p>New sales use these rates. Existing commission records never change.</p>
              </div>
              @if (auth.isOwner()) {
                <div class="rate-actions">
                  @if (editingSettings()) {
                    <button
                      class="btn btn-secondary"
                      [disabled]="savingSettings()"
                      (click)="cancelSettingsEdit()"
                    >
                      <svg lucideX></svg>Cancel
                    </button>
                    <button
                      class="btn btn-primary"
                      [disabled]="settingsForm.invalid || savingSettings()"
                      (click)="saveSettings()"
                    >
                      <svg lucideSave></svg>{{ savingSettings() ? 'Saving…' : 'Save rates' }}
                    </button>
                  } @else {
                    <button class="btn btn-secondary" (click)="startSettingsEdit()">
                      <svg lucidePencil></svg>Edit rates
                    </button>
                  }
                </div>
              }
            </div>

            @if (auth.isOwner() && editingSettings()) {
              <form class="rate-grid" [formGroup]="settingsForm">
                <label class="rate-card">
                  <span>Agent · Level 1</span>
                  <div>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      formControlName="agentLevel1Percent"
                    /><b>%</b>
                  </div>
                </label>
                <label class="rate-card elevated">
                  <span>Agent · Level 2</span>
                  <div>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      formControlName="agentLevel2Percent"
                    /><b>%</b>
                  </div>
                </label>
                <label class="rate-card">
                  <span>Senior Agent · Level 1</span>
                  <div>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      formControlName="seniorAgentLevel1Percent"
                    /><b>%</b>
                  </div>
                </label>
                <label class="rate-card elevated">
                  <span>Senior Agent · Level 2</span>
                  <div>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      formControlName="seniorAgentLevel2Percent"
                    /><b>%</b>
                  </div>
                </label>
              </form>
            } @else {
              <div class="rate-grid readonly">
                @for (rate of rates(settings); track rate.label) {
                  <div class="rate-card" [class.elevated]="rate.level === 2">
                    <span>{{ rate.label }}</span>
                    <strong>{{ rate.value }}%</strong>
                  </div>
                }
              </div>
            }
          </section>
        }
      }

      @if (auth.isManager()) {
        <section class="agents-section">
          <div class="section-heading compact">
            <div>
              <p class="eyebrow">Agent balances</p>
              <h2>Who owes commission</h2>
            </div>
          </div>
          <div class="agent-grid">
            @for (agent of data.agents; track agent.userId) {
              <article class="panel agent-card" [class.clear]="agent.outstandingCommission === 0">
                <header>
                  <div>
                    <h3>{{ agent.displayName }}</h3>
                    <p>{{ roleLabel(agent.role) }} · Level {{ agent.commissionLevel }}</p>
                  </div>
                  <span>{{ agent.outstandingCount }} pending</span>
                </header>
                <strong>{{
                  agent.outstandingCommission | currency: 'USD' : 'symbol' : '1.0-2'
                }}</strong>
                <footer>
                  <span>{{ agent.saleCount }} sales</span>
                  <span
                    >{{
                      agent.receivedCommission | currency: 'USD' : 'symbol' : '1.0-2'
                    }}
                    received</span
                  >
                </footer>
              </article>
            } @empty {
              <app-empty-state
                title="No commission agents"
                message="Approved agents and senior agents will appear here."
              />
            }
          </div>
        </section>
      }

      <section class="ledger-section">
        <div class="section-heading ledger-heading">
          <div>
            <p class="eyebrow">Transaction ledger</p>
            <h2>Sale commissions</h2>
          </div>
          <nav class="filters" aria-label="Commission status filter">
            <button [class.active]="filter() === 'outstanding'" (click)="filter.set('outstanding')">
              Outstanding
            </button>
            <button [class.active]="filter() === 'received'" (click)="filter.set('received')">
              Received
            </button>
            <button [class.active]="filter() === 'all'" (click)="filter.set('all')">All</button>
          </nav>
        </div>
        @if (filteredRecords().length) {
          <div class="panel table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Sale</th>
                  @if (auth.isManager()) {
                    <th>Agent</th>
                  }
                  <th>Property / tenant</th>
                  <th>Deposit</th>
                  <th>Grade</th>
                  <th>Commission</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (record of filteredRecords(); track record.id) {
                  <tr [class.received-row]="record.isReceived">
                    <td>
                      <strong>{{ record.createdAt | date: 'mediumDate' }}</strong
                      ><small>{{ record.createdAt | date: 'shortTime' }}</small>
                    </td>
                    @if (auth.isManager()) {
                      <td>
                        <strong>{{ record.sellingAgentDisplayName }}</strong
                        ><small>{{ roleLabel(record.sellingAgentRole) }}</small>
                      </td>
                    }
                    <td>
                      <strong>{{ record.propertyName }}</strong
                      ><small>{{ record.tenantName }} · #{{ record.propertyBusinessId }}</small>
                    </td>
                    <td>{{ record.depositAmount | currency: 'USD' : 'symbol' : '1.0-2' }}</td>
                    <td>
                      <span class="grade"
                        >L{{ record.commissionLevel }} · {{ record.commissionRatePercent }}%</span
                      >
                    </td>
                    <td>
                      <strong class="amount">{{
                        record.commissionAmount | currency: 'USD' : 'symbol' : '1.0-2'
                      }}</strong>
                    </td>
                    <td>
                      @if (auth.isManager()) {
                        <button
                          class="status-action"
                          [class.received]="record.isReceived"
                          (click)="toggleReceived(record)"
                        >
                          @if (record.isReceived) {
                            <svg lucideRotateCcw></svg>Reopen
                          } @else {
                            <svg lucideCheck></svg>Mark received
                          }
                        </button>
                      } @else {
                        <span class="status-label" [class.received]="record.isReceived">{{
                          record.isReceived ? 'Received' : 'Outstanding'
                        }}</span>
                      }
                      @if (record.receivedAt) {
                        <small class="receipt-note"
                          >{{ record.receivedAt | date: 'mediumDate' }} ·
                          {{ record.receivedByDisplayName }}</small
                        >
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <app-empty-state
            title="No commission records in this view"
            message="Completed agent sales will be recorded here automatically."
          />
        }
      </section>
    } @else {
      <section class="panel loading">Loading commission ledger…</section>
    }
  `,
  styles: [
    `
      .page-title,
      .section-heading {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 24px;
      }
      .page-title {
        margin-bottom: 24px;
      }
      .page-title h1 {
        margin: 4px 0;
        font-size: 2.5rem;
      }
      .page-title p:last-child,
      .section-heading p:last-child {
        margin: 0;
        color: var(--muted);
      }
      .level-chip {
        padding: 10px 14px;
        display: grid;
        color: var(--muted);
        font-size: 0.68rem;
      }
      .level-chip strong {
        color: var(--forest);
        font-size: 0.9rem;
      }
      .metrics {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
        margin-bottom: 18px;
      }
      .metric {
        padding: 20px;
        display: grid;
        gap: 5px;
        border-top: 3px solid var(--border);
      }
      .metric.attention {
        border-top-color: var(--forest);
      }
      .metric > span {
        color: var(--muted);
        font-size: 0.72rem;
      }
      .metric > strong {
        font-size: 1.65rem;
      }
      .rate-panel {
        padding: 24px;
      }
      .rate-actions {
        display: flex;
        gap: 8px;
      }
      .section-heading h2 {
        margin: 4px 0 5px;
        font-size: 1.25rem;
      }
      .section-heading.compact {
        margin: 30px 0 12px;
      }
      .rate-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        margin-top: 20px;
      }
      .rate-card {
        display: grid;
        gap: 10px;
        padding: 14px;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--surface-subtle);
      }
      .rate-card.elevated {
        border-color: color-mix(in srgb, var(--forest) 35%, var(--border));
        background: color-mix(in srgb, var(--forest-light) 55%, var(--surface));
      }
      .rate-card > span {
        color: var(--muted);
        font-size: 0.7rem;
        font-weight: 650;
      }
      .rate-card > div {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .rate-card input {
        width: 100%;
        min-width: 0;
        border: 0;
        background: transparent;
        color: var(--ink);
        font-size: 1.4rem;
        font-weight: 750;
        outline: 0;
      }
      .rate-card b {
        color: var(--forest);
      }
      .agent-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(245px, 1fr));
        gap: 12px;
      }
      .agent-card {
        padding: 17px;
      }
      .agent-card header,
      .agent-card footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .agent-card h3 {
        margin: 0;
        font-size: 0.92rem;
      }
      .agent-card header p {
        margin: 3px 0 0;
        color: var(--muted);
        font-size: 0.68rem;
      }
      .agent-card header > span {
        color: var(--warning-ink);
        font-size: 0.65rem;
        font-weight: 700;
      }
      .agent-card.clear header > span {
        color: var(--forest);
      }
      .agent-card > strong {
        display: block;
        margin: 18px 0;
        font-size: 1.45rem;
      }
      .agent-card footer {
        color: var(--muted);
        font-size: 0.67rem;
      }
      .ledger-section {
        margin-top: 30px;
      }
      .ledger-heading {
        margin-bottom: 12px;
      }
      .filters {
        display: flex;
        gap: 4px;
        padding: 4px;
        border: 1px solid var(--border);
        border-radius: 9px;
        background: var(--surface);
      }
      .filters button {
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: var(--muted);
        padding: 7px 10px;
        cursor: pointer;
        font-size: 0.7rem;
        font-weight: 650;
      }
      .filters button.active {
        background: var(--forest-light);
        color: var(--forest);
      }
      .table-wrap {
        overflow-x: auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        min-width: 920px;
      }
      th {
        padding: 11px 14px;
        border-bottom: 1px solid var(--border);
        color: var(--muted);
        text-align: left;
        font-size: 0.63rem;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
      td {
        padding: 13px 14px;
        border-bottom: 1px solid var(--border);
        font-size: 0.73rem;
        vertical-align: middle;
      }
      tbody tr:last-child td {
        border-bottom: 0;
      }
      td strong,
      td small {
        display: block;
      }
      td small {
        margin-top: 3px;
        color: var(--muted);
        font-size: 0.65rem;
      }
      .received-row {
        opacity: 0.72;
      }
      .amount {
        color: var(--forest);
        font-size: 0.82rem;
      }
      .grade,
      .status-label {
        display: inline-flex;
        padding: 5px 8px;
        border-radius: 99px;
        background: var(--forest-light);
        color: var(--forest);
        font-weight: 700;
        font-size: 0.65rem;
      }
      .status-label:not(.received) {
        background: var(--warning-soft);
        color: var(--warning-ink);
      }
      .status-action {
        border: 0;
        border-radius: 7px;
        background: var(--forest-light);
        color: var(--forest);
        padding: 7px 9px;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        cursor: pointer;
        font-size: 0.66rem;
        font-weight: 700;
      }
      .status-action.received {
        background: var(--surface-subtle);
        color: var(--muted);
      }
      .status-action svg {
        width: 13px;
        height: 13px;
      }
      .receipt-note {
        white-space: nowrap;
      }
      .loading {
        padding: 24px;
        color: var(--muted);
      }
      @media (max-width: 1000px) {
        .rate-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      @media (max-width: 720px) {
        .page-title,
        .section-heading {
          align-items: stretch;
          flex-direction: column;
        }
        .metrics {
          grid-template-columns: 1fr;
        }
        .rate-grid {
          grid-template-columns: 1fr;
        }
        .filters {
          width: 100%;
        }
        .filters button {
          flex: 1;
        }
      }
    `,
  ],
})
export class CommissionsComponent {
  readonly auth = inject(AuthService);
  private readonly service = inject(CommissionService);
  private readonly snackBar = inject(MatSnackBar);
  readonly overview = signal<CommissionOverview | null>(null);
  readonly filter = signal<LedgerFilter>('outstanding');
  readonly savingSettings = signal(false);
  readonly editingSettings = signal(false);
  readonly roleLabel = (role: keyof typeof USER_ROLES) => USER_ROLES[role];
  readonly settingsForm = new FormGroup({
    agentLevel1Percent: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0), Validators.max(100)],
    }),
    agentLevel2Percent: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0), Validators.max(100)],
    }),
    seniorAgentLevel1Percent: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0), Validators.max(100)],
    }),
    seniorAgentLevel2Percent: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0), Validators.max(100)],
    }),
  });
  readonly filteredRecords = computed(() => {
    const records = this.overview()?.records ?? [];
    if (this.filter() === 'all') return records;
    return records.filter((record) => record.isReceived === (this.filter() === 'received'));
  });
  readonly outstandingCount = computed(
    () => this.overview()?.records.filter((record) => !record.isReceived).length ?? 0,
  );
  readonly currentLevel = computed(() => {
    const userId = this.auth.user()?.id;
    return (
      this.overview()?.agents.find((agent) => agent.userId === userId)?.commissionLevel ??
      this.auth.user()?.commissionLevel ??
      1
    );
  });

  constructor() {
    this.load();
  }

  load() {
    this.service.overview().subscribe((value) => {
      this.overview.set(value);
      if (value.settings) this.settingsForm.patchValue(value.settings);
    });
  }

  rates(settings: CommissionSettings) {
    return [
      { label: 'Agent · Level 1', level: 1, value: settings.agentLevel1Percent },
      { label: 'Agent · Level 2', level: 2, value: settings.agentLevel2Percent },
      { label: 'Senior Agent · Level 1', level: 1, value: settings.seniorAgentLevel1Percent },
      { label: 'Senior Agent · Level 2', level: 2, value: settings.seniorAgentLevel2Percent },
    ];
  }

  startSettingsEdit() {
    const settings = this.overview()?.settings;
    if (settings) this.settingsForm.reset(settings);
    this.editingSettings.set(true);
  }

  cancelSettingsEdit() {
    const settings = this.overview()?.settings;
    if (settings) this.settingsForm.reset(settings);
    this.editingSettings.set(false);
  }

  saveSettings() {
    if (this.settingsForm.invalid) return;
    this.savingSettings.set(true);
    this.service.updateSettings(this.settingsForm.getRawValue()).subscribe({
      next: (settings) => {
        this.savingSettings.set(false);
        this.editingSettings.set(false);
        this.overview.update((value) => (value ? { ...value, settings } : value));
        this.snackBar.open('Commission rates updated.', 'Dismiss', {
          duration: 3000,
          panelClass: ['success-toast'],
        });
      },
      error: () => this.savingSettings.set(false),
    });
  }

  toggleReceived(record: CommissionRecord) {
    this.service.setReceived(record.id, !record.isReceived).subscribe((updated) => {
      this.overview.update((value) => {
        if (!value) return value;
        const records = value.records.map((item) => (item.id === updated.id ? updated : item));
        const agents = value.agents.map((agent) => {
          if (agent.userId !== updated.sellingAgentUserId) return agent;
          const agentRecords = records.filter((item) => item.sellingAgentUserId === agent.userId);
          return {
            ...agent,
            totalCommission: agentRecords.reduce((sum, item) => sum + item.commissionAmount, 0),
            outstandingCommission: agentRecords
              .filter((item) => !item.isReceived)
              .reduce((sum, item) => sum + item.commissionAmount, 0),
            receivedCommission: agentRecords
              .filter((item) => item.isReceived)
              .reduce((sum, item) => sum + item.commissionAmount, 0),
            outstandingCount: agentRecords.filter((item) => !item.isReceived).length,
          };
        });
        return {
          ...value,
          records,
          agents,
          totalOutstanding: records
            .filter((item) => !item.isReceived)
            .reduce((sum, item) => sum + item.commissionAmount, 0),
          totalReceived: records
            .filter((item) => item.isReceived)
            .reduce((sum, item) => sum + item.commissionAmount, 0),
        };
      });
    });
  }
}
