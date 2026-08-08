import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  LucideClipboardPaste,
  LucideCopy,
  LucideRefreshCw,
  LucideSiren,
  LucideTriangleAlert,
  LucideTrash2,
} from '@lucide/angular';
import { map } from 'rxjs';
import { RentSyncRecord, RentSyncSnapshot } from '../../core/models/management.models';
import { NoticeService, UserService } from '../../core/services/management.services';
import { AuthService } from '../../core/services/auth.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

type NoticeView =
  | 'sync'
  | 'syncedDataRecords'
  | 'activeList'
  | 'overdueList'
  | 'evictionList'
  | 'overdueNotice'
  | 'evictionNotice';

@Component({
  selector: 'app-notices',
  imports: [
    CurrencyPipe,
    DatePipe,
    FormsModule,
    EmptyStateComponent,
    LucideClipboardPaste,
    LucideCopy,
    LucideRefreshCw,
    LucideSiren,
    LucideTriangleAlert,
    LucideTrash2,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="page-title">
      <p class="eyebrow">Rent status workflow</p>
      <h1>{{ title() }}</h1>
      <p>{{ description() }}</p>
    </div>

    @if (mode() === 'sync') {
      <section class="panel sync-panel">
        <header>
          <svg lucideClipboardPaste></svg>
          <div>
            <h2>Paste exported property data</h2>
            <p>The latest successful sync replaces the previous snapshot to limit storage use.</p>
          </div>
        </header>
        @if (auth.isManager()) {
          <textarea
            rows="14"
            [(ngModel)]="rawData"
            spellcheck="false"
            placeholder="Status,Address,Interior,Renter CID,Renter Name,Phone,Income,Cost"
          ></textarea>
          @if (error()) {
            <p class="message error">{{ error() }}</p>
          }
          @if (success()) {
            <p class="message success">{{ success() }}</p>
          }
          <div class="sync-actions">
            <small>Every CID is matched against the tenant records to retrieve its Discord ID.</small>
            <button class="btn btn-primary" (click)="sync()" [disabled]="syncing() || !rawData.trim()">
              <svg lucideRefreshCw [class.spinning]="syncing()"></svg>
              {{ syncing() ? 'Syncing…' : 'Sync data' }}
            </button>
          </div>
        } @else {
          <p class="message">Only managers and owners can replace the synced rent data.</p>
        }
      </section>
    }

    @if (snapshot(); as data) {
      @if (!isSyncedDataRecords()) {
        <div class="summary-grid">
          <div class="panel"><b>{{ data.total }}</b><span>Total rows</span></div>
          <div class="panel active"><b>{{ data.active }}</b><span>Active</span></div>
          <div class="panel overdue"><b>{{ data.overdue }}</b><span>Overdue</span></div>
          <div class="panel eviction"><b>{{ data.evictable }}</b><span>Evictable</span></div>
        </div>
      }
      @if (data.syncedAt) {
        <p class="synced">Last synced {{ data.syncedAt | date: 'medium' }}</p>
      }
    }

    @if (mode() !== 'sync') {
      @if (mode() === 'syncedDataRecords') {
        @if (success()) {
          <p class="message success">{{ success() }}</p>
        }
        @if (error()) {
          <p class="message error">{{ error() }}</p>
        }
      }
      @if (isSyncedDataRecords()) {
        <div class="panel table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Active</th>
                <th>Overdue</th>
                <th>Evictable</th>
                <th>Synced by</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (record of snapshotList(); track record.id) {
                <tr>
                  <td>{{ record.syncedAt ? (record.syncedAt | date: 'medium') : 'Unknown time' }}</td>
                  <td>{{ record.active }}</td>
                  <td>{{ record.overdue }}</td>
                  <td>{{ record.evictable }}</td>
                  <td><code>{{ userDisplayName(record.createdBy) }}</code></td>
                  <td>
                    @if (auth.isManager()) {
                      <button class="icon-button" type="button" (click)="deleteSnapshot(record.id)" aria-label="Delete sync history snapshot">
                        <svg lucideTrash2></svg>
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else if (filteredRecords().length) {
        @if (isNoticeView()) {
          <div class="notice-list">
            @for (record of filteredRecords(); track record.rowNumber) {
              <article class="panel notice-card">
                <header>
                  <span>
                    @if (mode() === 'overdueNotice') {
                      <svg lucideTriangleAlert></svg>Overdue Payment Notice
                    } @else {
                      <svg lucideSiren></svg>Eviction Notice
                    }
                  </span>
                  <button class="copy" (click)="copyNotice(record)">
                    <svg lucideCopy></svg>{{ copiedRow() === record.rowNumber ? 'Copied' : 'Copy' }}
                  </button>
                </header>
                <pre>{{ noticeText(record) }}</pre>
                @if (!record.discordId && mode() === 'evictionNotice') {
                  <p class="unmapped">Discord ID not found for CID {{ record.cid }}.</p>
                }
              </article>
            }
          </div>
        } @else {
          <div class="panel table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Address</th>
                  <th>Interior</th>
                  <th>CID</th>
                  <th>Renter</th>
                  <th>Phone</th>
                  <th>Income</th>
                  <th>Cost</th>
                  <th>Discord mapping</th>
                </tr>
              </thead>
              <tbody>
                @for (record of filteredRecords(); track record.rowNumber) {
                  <tr>
                    <td><span class="status" [class]="record.status">{{ statusLabel(record) }}</span></td>
                    <td><b>{{ record.address }}</b></td>
                    <td>{{ record.interior }}</td>
                    <td>{{ record.cid ?? 'N/A' }}</td>
                    <td>{{ record.renterName ?? 'N/A' }}</td>
                    <td>{{ record.phone ?? 'N/A' }}</td>
                    <td>{{ record.income | currency: 'USD' : 'symbol' : '1.0-0' }}</td>
                    <td>{{ record.cost | currency: 'USD' : 'symbol' : '1.0-0' }}</td>
                    <td>{{ record.discordId ? '@' + record.discordId : record.cid ? 'Not mapped' : 'N/A' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      } @else {
        <div class="panel">
          <app-empty-state
            [title]="snapshot()?.syncedAt ? 'No matching records' : 'No synced data yet'"
            [message]="snapshot()?.syncedAt ? 'The latest import has no records for this view.' : 'Paste the in-game export in Data Sync first.'"
          />
        </div>
      }
    }
  `,
  styles: [
    `
      .page-title { margin-bottom: 24px; }
      .page-title h1 { margin: 4px 0; font-size: 2.5rem; }
      .page-title p:last-child, .sync-panel p, .synced { color: var(--muted); }
      .sync-panel { padding: 26px; }
      .sync-panel header { display: flex; gap: 14px; align-items: flex-start; }
      .sync-panel header > svg { width: 26px; color: var(--forest); }
      .sync-panel h2 { margin: 0 0 4px; font-size: 1.3rem; }
      textarea { width: 100%; margin-top: 20px; padding: 14px; resize: vertical; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface-strong); color: var(--ink); font: 0.78rem/1.55 monospace; }
      .sync-actions { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-top: 14px; }
      .sync-actions small { color: var(--muted); }
      .spinning { animation: spin 0.8s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
      .message { margin: 14px 0 0; }
      .message.error, .unmapped { color: var(--danger); }
      .message.success { color: var(--forest); }
      .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 20px; }
      .summary-grid .panel { display: grid; padding: 18px; }
      .summary-grid b { font-size: 1.55rem; }
      .summary-grid span, .synced { font-size: 0.76rem; color: var(--muted); }
      .summary-grid .active b { color: var(--forest); }
      .summary-grid .overdue b { color: var(--warning); }
      .summary-grid .eviction b { color: var(--danger); }
      .synced { margin: 9px 0 20px; text-align: right; }
      .record-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
      .record-card { padding: 14px; display: grid; gap: 8px; min-width: 50px; min-height: 50px; }
      .record-card header { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-width: 0; }
      .record-card .record-header-row { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; min-width: 0; }
      .record-card .row-number { color: var(--muted); font-size: 0.82rem; }
      .record-card .record-status { padding: 4px 10px; border-radius: 999px; background: var(--neutral-soft); font-size: 0.72rem; }
      .record-card .record-meta-item { color: var(--muted); font-size: 0.78rem; }
      .icon-button { border: none !important; background: transparent; color: var(--danger); padding: 6px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: none; }
      .icon-button svg { width: 18px; height: 18px; }
      .record-card button:not(.icon-button) { border: 1px solid var(--danger); border-radius: 8px; padding: 8px 12px; background: var(--surface); color: var(--danger); display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
      .record-meta { display: none; }
      .record-details { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
      .record-details div { display: grid; gap: 4px; }
      .record-details strong { color: var(--muted); font-weight: 700; }
      .notice-list { display: grid; gap: 14px; }
      .notice-card { padding: 20px; }
      .notice-card header, .notice-card header span, .copy { display: flex; align-items: center; gap: 8px; }
      .notice-card header { justify-content: space-between; color: var(--ink); font-weight: 700; }
      .notice-card header svg, .copy svg { width: 17px; height: 17px; }
      .copy { border: 1px solid var(--border); border-radius: 8px; padding: 7px 10px; background: transparent; color: var(--ink); cursor: pointer; }
      pre { margin: 18px 0 0; padding: 16px; white-space: pre-wrap; overflow-wrap: anywhere; border-radius: var(--radius-sm); background: var(--surface-soft); color: var(--muted); font: 0.8rem/1.7 monospace; }
      .unmapped { margin: 10px 0 0; font-size: 0.78rem; }
      .status { padding: 5px 9px; border-radius: 99px; background: var(--neutral-soft); font-size: 0.72rem; }
      .status.paid { background: var(--forest-light); color: var(--forest); }
      .status.overdue { background: var(--warning-soft); color: var(--warning-ink); }
      .status.evictable { background: var(--danger-soft); color: var(--danger); }
      @media (max-width: 800px) { .summary-grid { grid-template-columns: repeat(2, 1fr); } .sync-actions { align-items: stretch; flex-direction: column; } }
    `,
  ],
})
export class NoticesComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly notices = inject(NoticeService);
  readonly auth = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  readonly mode = toSignal(this.route.data.pipe(map((data) => data['mode'] as NoticeView)), {
    initialValue: 'sync' as NoticeView,
  });
  readonly snapshot = signal<RentSyncSnapshot | null>(null);
  readonly snapshotList = signal<RentSyncSnapshot[]>([]);
  readonly syncing = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly copiedRow = signal<number | null>(null);
  readonly userService = inject(UserService);
  readonly users = toSignal(this.userService.all().pipe(map((x) => x.items)), { initialValue: [] });
  rawData = '';

  readonly title = computed(() => ({
    sync: 'Data Sync',
    syncedDataRecords: 'Sync History',
    activeList: 'Active List',
    overdueList: 'Overdue List',
    evictionList: 'Eviction List',
    overdueNotice: 'Overdue Notices',
    evictionNotice: 'Eviction Notices',
  })[this.mode()]);
  readonly description = computed(() => ({
    sync: 'Import the latest in-game property export and map renter CIDs to tenant Discord IDs.',
    syncedDataRecords: 'Review the latest sync history snapshots and remove outdated or incorrect records.',
    activeList: 'Properties whose rent status is currently paid.',
    overdueList: 'Properties currently marked overdue in the latest export.',
    evictionList: 'Properties currently marked evictable in the latest export.',
    overdueNotice: 'Copy-ready overdue notices generated from the latest synced data.',
    evictionNotice: 'Copy-ready eviction notices with Discord mentions mapped by tenant CID.',
  })[this.mode()]);
  readonly filteredRecords = computed(() => {
    const records = this.snapshot()?.records ?? [];
    if (this.mode() === 'syncedDataRecords') return [];
    const statusMap = {
      activeList: 'paid',
      overdueList: 'overdue',
      evictionList: 'evictable',
      overdueNotice: 'overdue',
      evictionNotice: 'evictable',
    } as const;
    const status = statusMap[this.mode() as Exclude<NoticeView, 'sync' | 'syncedDataRecords'>];
    return status ? records.filter((record) => record.status === status) : [];
  });
  readonly isNoticeView = computed(() => this.mode() === 'overdueNotice' || this.mode() === 'evictionNotice');
  readonly isSyncedDataRecords = computed(() => this.mode() === 'syncedDataRecords');

  constructor() {
    this.load();
  }

  userDisplayName(userId?: string | null) {
    if (!userId) return 'Unknown';
    const user = this.users().find((user) => user.id === userId);
    return user?.displayName ?? user?.username ?? 'Unknown';
  }

  sync() {
    if (!this.rawData.trim() || this.syncing()) return;
    this.syncing.set(true);
    this.error.set('');
    this.success.set('');
    this.notices.sync(this.rawData).subscribe({
      next: (snapshot) => {
        this.snapshot.set(snapshot);
        this.success.set(`Synced ${snapshot.total} property rows successfully.`);
        if (snapshot.unmappedTenants > 0) {
          this.snackBar.open(
            `${snapshot.unmappedTenants} renter(s) could not be mapped to a tenant Discord ID.`,
            'Dismiss',
            { duration: 7000, panelClass: ['warning-toast'] },
          );
        }
        this.loadSnapshots();
        this.syncing.set(false);
      },
      error: (response) => {
        this.error.set(response?.error?.detail || response?.error?.message || 'The export could not be synced.');
        this.syncing.set(false);
      },
    });
  }

  statusLabel(record: RentSyncRecord) {
    if (record.status === 'paid') return `Paid through ${record.paidThrough ? new Date(record.paidThrough).toLocaleDateString() : ''}`;
    return record.status[0].toUpperCase() + record.status.slice(1);
  }

  noticeText(record: RentSyncRecord) {
    return this.mode() === 'overdueNotice' ? record.overdueNotice ?? '' : record.evictionNotice ?? '';
  }

  async copyNotice(record: RentSyncRecord) {
    await navigator.clipboard.writeText(this.noticeText(record));
    this.copiedRow.set(record.rowNumber);
    window.setTimeout(() => this.copiedRow.set(null), 1600);
  }

  deleteSnapshot(id: string) {
    this.notices.deleteSnapshot(id).subscribe({
      next: () => {
        this.success.set('Deleted synced record successfully.');
        this.loadSnapshots();
        window.setTimeout(() => this.success.set(''), 2600);
      },
      error: (response) => {
        this.error.set(response?.error?.detail || response?.error?.message || 'The snapshot could not be deleted.');
        window.setTimeout(() => this.error.set(''), 2600);
      },
    });
  }

  private load() {
    this.notices.snapshot().subscribe({
      next: (snapshot) => this.snapshot.set(snapshot),
      error: () => this.snapshot.set({ id: '', total: 0, active: 0, overdue: 0, evictable: 0, empty: 0, unmappedTenants: 0, records: [] }),
    });
    this.loadSnapshots();
  }

  private loadSnapshots() {
    this.notices.snapshots().subscribe({
      next: (snapshots) => this.snapshotList.set(snapshots),
      error: () => this.snapshotList.set([]),
    });
  }
}
