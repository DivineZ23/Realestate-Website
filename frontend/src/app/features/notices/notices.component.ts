import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  LucideClipboardPaste,
  LucideChevronDown,
  LucideCircleCheck,
  LucideCopy,
  LucideImages,
  LucidePhone,
  LucideRefreshCw,
  LucideTrash2,
} from '@lucide/angular';
import { interval, map } from 'rxjs';
import {
  EvictionHistory,
  RentSyncRecord,
  RentSyncSnapshot,
} from '../../core/models/management.models';
import { NoticeService, TenantService, UserService } from '../../core/services/management.services';
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

interface NoticeDayGroup {
  key: string;
  snapshotId: string;
  syncedAt?: string;
  records: RentSyncRecord[];
  unresolved: number;
}
interface EvictionDayGroup {
  key: string;
  date: string;
  records: EvictionHistory[];
}

@Component({
  selector: 'app-notices',
  imports: [
    CurrencyPipe,
    DatePipe,
    FormsModule,
    EmptyStateComponent,
    LucideClipboardPaste,
    LucideChevronDown,
    LucideCircleCheck,
    LucideCopy,
    LucideImages,
    LucidePhone,
    LucideRefreshCw,
    LucideTrash2,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="page-title">
      <div>
        <p class="eyebrow">Rent status workflow</p>
        <h1>{{ title() }}</h1>
        <p>{{ description() }}</p>
      </div>
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
        <div class="sheet-sync-state" [class]="'sheet-sync-state ' + sheetSyncState()">
          <span class="status-dot" aria-hidden="true"></span>
          <div>
            <b>{{ sheetSyncTitle() }}</b>
            @if (sheetSyncState() === 'synced' && snapshot()?.googleSheetSyncedAt) {
              <small>
                Last published {{ snapshot()?.googleSheetSyncedAt | date: 'mediumDate' }} at
                {{ snapshot()?.googleSheetSyncedAt | date: 'shortTime' }}
              </small>
            } @else {
              <small>{{ sheetSyncMessage() }}</small>
            }
          </div>
          <div class="sheet-sync-controls">
            @if (snapshot()?.googleSheetUrl) {
              <a [href]="snapshot()?.googleSheetUrl" target="_blank" rel="noopener noreferrer">
                Open sheet
              </a>
            }
            @if (
              (sheetSyncState() === 'failed' || sheetSyncState() === 'ready') &&
              auth.isManager() &&
              snapshot()?.id
            ) {
              <button
                class="retry-sheet"
                [class.failure]="sheetSyncState() === 'failed'"
                type="button"
                [disabled]="sheetRetrying()"
                (click)="retryGoogleSheet()"
              >
                <svg lucideRefreshCw [class.spinning]="sheetRetrying()"></svg>
                {{
                  sheetRetrying()
                    ? 'Publishing…'
                    : sheetSyncState() === 'ready'
                      ? 'Publish now'
                      : 'Retry'
                }}
              </button>
            }
          </div>
        </div>
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
            <small
              >Every CID is matched against the tenant records to retrieve its Discord ID.</small
            >
            <button
              class="btn btn-primary"
              (click)="sync()"
              [disabled]="syncing() || !rawData.trim()"
            >
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
      @if (isNoticeView()) {
        <div class="summary-grid notice-summary">
          <div class="panel notice-total" [class.eviction]="mode() === 'evictionNotice'">
            <b>{{ currentNoticeTotal() }}</b>
            <span>{{ mode() === 'overdueNotice' ? 'Total overdue' : 'Total evictable' }}</span>
          </div>
          <div class="panel pending">
            <b>{{ pendingNoticeCount() }}</b>
            <span>Pending notices to be sent</span>
          </div>
          <div class="panel sent">
            <b>{{ noticesSentToday() }}</b>
            <span>Notices sent today</span>
          </div>
        </div>
      } @else if (mode() !== 'sync' && !isSyncedDataRecords()) {
        <div class="summary-grid">
          <div class="panel">
            <b>{{ data.total }}</b
            ><span>Total rows</span>
          </div>
          <div class="panel active">
            <b>{{ data.active }}</b
            ><span>Active</span>
          </div>
          <div class="panel overdue">
            <b>{{ data.overdue }}</b
            ><span>Overdue</span>
          </div>
          <div class="panel eviction">
            <b>{{ data.evictable }}</b
            ><span>Evictable</span>
          </div>
        </div>
      }
      @if (data.syncedAt && mode() !== 'sync' && !isSyncedDataRecords()) {
        <p class="synced">
          Last synced {{ data.syncedAt | date: 'mediumDate' }} at
          {{ data.syncedAt | date: 'shortTime' }}
        </p>
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
      @if (mode() === 'evictionList') {
        @if (evictionGroups().length) {
          <div class="notice-groups eviction-history">
            @for (group of evictionGroups(); track group.key) {
              <section class="panel day-section">
                <button
                  class="day-header"
                  type="button"
                  (click)="toggleEvictionGroup(group.key)"
                  [attr.aria-expanded]="isEvictionGroupOpen(group.key)"
                >
                  <span class="day-title"
                    ><svg lucideChevronDown [class.closed]="!isEvictionGroupOpen(group.key)"></svg
                    ><span
                      ><b>{{ group.date | date: 'fullDate' }}</b
                      ><small
                        >{{ group.records.length }}
                        {{ group.records.length === 1 ? 'eviction' : 'evictions' }}</small
                      ></span
                    ></span
                  >
                </button>
                @if (isEvictionGroupOpen(group.key)) {
                  <div class="day-content">
                    @for (eviction of group.records; track eviction.id) {
                      <article class="eviction-history-card">
                        <time>{{ eviction.evictedAt | date: 'shortTime' }}</time>
                        <div class="eviction-row">
                          <div>
                            <small>Property name</small
                            ><b>{{ eviction.propertyName || 'Unknown property' }}</b>
                          </div>
                          <div>
                            <small>Owner name</small><b>{{ eviction.tenantName }}</b>
                          </div>
                          <div>
                            <small>CID</small><b>{{ eviction.cid || 'N/A' }}</b>
                          </div>
                          <div>
                            <small>Number</small><b>{{ eviction.phoneNumber }}</b>
                          </div>
                          <div>
                            <small>Storage images</small>
                            @if (eviction.storageImageUrls.length) {
                              <button
                                class="image-toggle"
                                type="button"
                                (click)="toggleImages(eviction.id)"
                              >
                                <svg lucideImages></svg>{{ eviction.storageImageUrls.length }}
                              </button>
                            } @else {
                              <span class="no-evidence">None</span>
                            }
                          </div>
                        </div>
                        @if (imagesOpen()[eviction.id]) {
                          <div class="evidence-grid">
                            @for (image of eviction.storageImageUrls; track image) {
                              <a [href]="image" target="_blank" rel="noopener"
                                ><img [src]="image" alt="Storage evidence"
                              /></a>
                            }
                          </div>
                        }
                      </article>
                    }
                  </div>
                }
              </section>
            }
          </div>
        } @else {
          <div class="panel">
            <app-empty-state
              title="No completed evictions"
              message="Completed eviction records will appear here."
            />
          </div>
        }
      } @else if (isSyncedDataRecords()) {
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
                  <td>
                    {{ record.syncedAt ? (record.syncedAt | date: 'mediumDate') : 'Unknown date' }}
                    @if (record.syncedAt) {
                      at {{ record.syncedAt | date: 'shortTime' }}
                    }
                  </td>
                  <td>{{ record.active }}</td>
                  <td>{{ record.overdue }}</td>
                  <td>{{ record.evictable }}</td>
                  <td>
                    <code>{{ userDisplayName(record.createdBy) }}</code>
                  </td>
                  <td>
                    @if (auth.isManager()) {
                      <button
                        class="icon-button"
                        type="button"
                        (click)="deleteSnapshot(record.id)"
                        aria-label="Delete sync history snapshot"
                      >
                        <svg lucideTrash2></svg>
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else if (isNoticeView() && noticeGroups().length) {
        <div class="notice-groups">
          @for (group of noticeGroups(); track group.key) {
            <section class="panel day-section" [class.complete]="group.unresolved === 0">
              <button
                class="day-header"
                type="button"
                (click)="toggleGroup(group.key)"
                [attr.aria-expanded]="isGroupOpen(group.key)"
              >
                <span class="day-title"
                  ><svg lucideChevronDown [class.closed]="!isGroupOpen(group.key)"></svg
                  ><span
                    ><b>{{ group.syncedAt | date: 'fullDate' }}</b
                    ><small
                      >{{ group.records.length }}
                      {{ group.records.length === 1 ? 'notice' : 'notices' }}</small
                    ></span
                  ></span
                >
                @if (group.unresolved === 0) {
                  <span class="group-status resolved"><svg lucideCircleCheck></svg>Complete</span>
                } @else {
                  <span class="group-status">{{ group.unresolved }} unresolved</span>
                }
              </button>
              @if (isGroupOpen(group.key)) {
                <div class="day-content">
                  @for (record of group.records; track record.rowNumber) {
                    <article class="notice-card" [class.resolved-card]="record.isResolved">
                      <div class="notice-message">
                        <div class="notice-text">{{ noticeText(record) }}</div>
                        <button
                          class="copy message-action"
                          type="button"
                          (click)="copyNotice(group.snapshotId, record)"
                        >
                          <svg lucideCopy></svg
                          >{{
                            copiedRow() === recordKey(group.snapshotId, record) ? 'Copied' : 'Copy'
                          }}
                        </button>
                        @if (mode() === 'overdueNotice') {
                          <button
                            class="phone-copy message-action"
                            type="button"
                            [disabled]="!record.phone"
                            (click)="copyPhone(record)"
                          >
                            <svg lucidePhone></svg
                            >{{
                              copiedPhone() === recordKey(group.snapshotId, record)
                                ? 'Copied'
                                : record.phone || 'No number'
                            }}
                          </button>
                        }
                        <label class="resolve-control message-resolve">
                          <input
                            type="checkbox"
                            [checked]="record.isResolved"
                            [disabled]="resolvingRow() === recordKey(group.snapshotId, record)"
                            (change)="setResolution(group, record, $any($event.target).checked)"
                          />
                          <span>Mark as resolved</span>
                        </label>
                      </div>
                      @if (record.isResolved) {
                        <p class="resolved-by">
                          <svg lucideCircleCheck></svg>Resolved by
                          <b>{{ record.resolvedByDisplayName || 'Unknown user' }}</b>
                          @if (record.resolvedAt) {
                            <span
                              >&middot; {{ record.resolvedAt | date: 'mediumDate' }} at
                              {{ record.resolvedAt | date: 'shortTime' }}</span
                            >
                          }
                        </p>
                      }
                      @if (!record.discordId && mode() === 'evictionNotice') {
                        <p class="unmapped">Discord ID not found for CID {{ record.cid }}.</p>
                      }
                    </article>
                  }
                </div>
              }
            </section>
          }
        </div>
      } @else if (filteredRecords().length) {
        @if (isNoticeView()) {
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
                    <td>
                      <span class="status" [class]="record.status">{{ statusLabel(record) }}</span>
                    </td>
                    <td>
                      <b>{{ record.address }}</b>
                    </td>
                    <td>{{ record.interior }}</td>
                    <td>{{ record.cid ?? 'N/A' }}</td>
                    <td>{{ record.renterName ?? 'N/A' }}</td>
                    <td>{{ record.phone ?? 'N/A' }}</td>
                    <td>{{ record.income | currency: 'USD' : 'symbol' : '1.0-0' }}</td>
                    <td>{{ record.cost | currency: 'USD' : 'symbol' : '1.0-0' }}</td>
                    <td>
                      {{
                        record.discordId
                          ? '@' + record.discordId
                          : record.cid
                            ? 'Not mapped'
                            : 'N/A'
                      }}
                    </td>
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
            [message]="
              snapshot()?.syncedAt
                ? 'The latest import has no records for this view.'
                : 'Paste the in-game export in Data Sync first.'
            "
          />
        </div>
      }
    } `,
  styles: [
    `
      .page-title {
        margin-bottom: 24px;
      }
      .page-title h1 {
        margin: 4px 0;
        font-size: 2.5rem;
      }
      .page-title p:last-child,
      .sync-panel p,
      .synced {
        color: var(--muted);
      }
      .sync-panel {
        padding: 26px;
      }
      .sync-panel header {
        display: flex;
        gap: 14px;
        align-items: flex-start;
      }
      .sync-panel header > svg {
        width: 26px;
        color: var(--forest);
      }
      .sync-panel h2 {
        margin: 0 0 4px;
        font-size: 1.3rem;
      }
      textarea {
        width: 100%;
        margin-top: 20px;
        padding: 14px;
        resize: vertical;
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        background: var(--surface-strong);
        color: var(--ink);
        font: 0.78rem/1.55 monospace;
      }
      .sync-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        margin-top: 14px;
      }
      .sync-actions small {
        color: var(--muted);
      }
      .spinning {
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .message {
        margin: 14px 0 0;
      }
      .message.error,
      .unmapped {
        color: var(--danger);
      }
      .message.success {
        color: var(--forest);
      }
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        margin-top: 20px;
      }
      .summary-grid .panel {
        display: grid;
        padding: 18px;
      }
      .summary-grid b {
        font-size: 1.55rem;
      }
      .summary-grid span,
      .synced {
        font-size: 0.76rem;
        color: var(--muted);
      }
      .summary-grid .active b {
        color: var(--forest);
      }
      .summary-grid .overdue b {
        color: var(--warning-ink);
      }
      .summary-grid .eviction b {
        color: var(--danger);
      }
      .summary-grid.notice-summary {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .notice-summary .notice-total b {
        color: var(--warning-ink);
      }
      .notice-summary .pending b {
        color: var(--warning-ink);
      }
      .notice-summary .sent b {
        color: var(--forest);
      }
      .synced {
        margin: 9px 0 20px;
        text-align: right;
      }
      .record-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 14px;
      }
      .record-card {
        padding: 14px;
        display: grid;
        gap: 8px;
        min-width: 50px;
        min-height: 50px;
      }
      .record-card header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        min-width: 0;
      }
      .record-card .record-header-row {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
        min-width: 0;
      }
      .record-card .row-number {
        color: var(--muted);
        font-size: 0.82rem;
      }
      .record-card .record-status {
        padding: 4px 10px;
        border-radius: 999px;
        background: var(--neutral-soft);
        font-size: 0.72rem;
      }
      .record-card .record-meta-item {
        color: var(--muted);
        font-size: 0.78rem;
      }
      .icon-button {
        border: none !important;
        background: transparent;
        color: var(--danger);
        padding: 6px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: none;
      }
      .icon-button svg {
        width: 18px;
        height: 18px;
      }
      .record-card button:not(.icon-button) {
        border: 1px solid var(--danger);
        border-radius: 8px;
        padding: 8px 12px;
        background: var(--surface);
        color: var(--danger);
        display: inline-flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
      }
      .record-meta {
        display: none;
      }
      .record-details {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .record-details div {
        display: grid;
        gap: 4px;
      }
      .record-details strong {
        color: var(--muted);
        font-weight: 700;
      }
      .unmapped {
        margin: 10px 0 0;
        font-size: 0.78rem;
      }
      .status {
        padding: 5px 9px;
        border-radius: 99px;
        background: var(--neutral-soft);
        font-size: 0.72rem;
      }
      .status.paid {
        background: var(--forest-light);
        color: var(--forest);
      }
      .status.overdue {
        background: var(--warning-soft);
        color: var(--warning-ink);
      }
      .status.evictable {
        background: var(--danger-soft);
        color: var(--danger);
      }
      @media (max-width: 800px) {
        .summary-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        .summary-grid.notice-summary {
          grid-template-columns: 1fr;
        }
        .sync-actions {
          align-items: stretch;
          flex-direction: column;
        }
      }
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
  readonly evictionHistory = signal<EvictionHistory[]>([]);
  readonly syncing = signal(false);
  readonly sheetRetrying = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly copiedRow = signal<string | null>(null);
  readonly copiedPhone = signal<string | null>(null);
  readonly resolvingRow = signal<string | null>(null);
  readonly expandedDays = signal<Record<string, boolean>>({});
  readonly expandedEvictionDays = signal<Record<string, boolean>>({});
  readonly imagesOpen = signal<Record<string, boolean>>({});
  private readonly tenantService = inject(TenantService);
  readonly userService = inject(UserService);
  readonly users = toSignal(this.userService.all().pipe(map((x) => x.items)), { initialValue: [] });
  rawData = '';
  private readonly destroyRef = inject(DestroyRef);

  readonly sheetSyncState = computed(() =>
    this.syncing() || this.sheetRetrying()
      ? 'pending'
      : (this.snapshot()?.googleSheetSyncStatus ?? 'notConfigured'),
  );
  readonly sheetSyncTitle = computed(() => {
    const titles = {
      notConfigured: 'Google Sheet not configured',
      ready: 'Google Sheet ready',
      pending: 'Publishing to Google Sheet',
      synced: 'Google Sheet is up to date',
      failed: 'Google Sheet sync failed',
    } as const;
    return titles[this.sheetSyncState()];
  });
  readonly sheetSyncMessage = computed(() => {
    if (this.sheetSyncState() === 'failed')
      return this.snapshot()?.googleSheetSyncError ?? 'The last publish attempt failed.';
    if (this.sheetSyncState() === 'pending') return 'The latest property rows are being published.';
    if (this.sheetSyncState() === 'ready') return 'The next Data Sync will publish the latest rows.';
    return 'Add the Google service-account variables on the server to enable publishing.';
  });

  readonly title = computed(
    () =>
      ({
        sync: 'Data Sync',
        syncedDataRecords: 'Sync History',
        activeList: 'Active List',
        overdueList: 'Overdue List',
        evictionList: 'Eviction List',
        overdueNotice: 'Overdue Notices',
        evictionNotice: 'Eviction Notices',
      })[this.mode()],
  );
  readonly description = computed(
    () =>
      ({
        sync: 'Import the latest in-game property export and map renter CIDs to tenant Discord IDs.',
        syncedDataRecords:
          'Review the latest sync history snapshots and remove outdated or incorrect records.',
        activeList: 'Properties whose rent status is currently paid.',
        overdueList: 'Properties currently marked overdue in the latest export.',
        evictionList: 'Properties currently marked evictable in the latest export.',
        overdueNotice: 'Copy-ready overdue notices generated from the latest synced data.',
        evictionNotice: 'Copy-ready eviction notices with Discord mentions mapped by tenant CID.',
      })[this.mode()],
  );
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
  readonly isNoticeView = computed(
    () => this.mode() === 'overdueNotice' || this.mode() === 'evictionNotice',
  );
  readonly isSyncedDataRecords = computed(() => this.mode() === 'syncedDataRecords');
  readonly currentNoticeRecords = computed(() => {
    if (!this.isNoticeView()) return [];
    const status = this.mode() === 'overdueNotice' ? 'overdue' : 'evictable';
    return (this.snapshot()?.records ?? []).filter((record) => record.status === status);
  });
  readonly currentNoticeTotal = computed(() => this.currentNoticeRecords().length);
  readonly pendingNoticeCount = computed(
    () => this.currentNoticeRecords().filter((record) => !record.isResolved).length,
  );
  readonly noticesSentToday = computed(() => {
    if (!this.isNoticeView()) return 0;
    const status = this.mode() === 'overdueNotice' ? 'overdue' : 'evictable';
    const today = new Date();
    return this.snapshotList().reduce(
      (total, snapshot) =>
        total +
        snapshot.records.filter(
          (record) =>
            record.status === status &&
            record.isResolved &&
            this.isSameLocalDay(record.resolvedAt, today),
        ).length,
      0,
    );
  });
  readonly noticeGroups = computed<NoticeDayGroup[]>(() => {
    if (!this.isNoticeView()) return [];
    const status = this.mode() === 'overdueNotice' ? 'overdue' : 'evictable';
    const latestByDay = new Map<string, RentSyncSnapshot>();
    for (const snapshot of this.snapshotList()) {
      const key = this.dayKey(snapshot.syncedAt, snapshot.id);
      if (!latestByDay.has(key)) latestByDay.set(key, snapshot);
    }
    return Array.from(latestByDay.entries())
      .map(([key, snapshot]) => {
        const records = snapshot.records.filter((record) => record.status === status);
        return {
          key,
          snapshotId: snapshot.id,
          syncedAt: snapshot.syncedAt,
          records,
          unresolved: records.filter((record) => !record.isResolved).length,
        };
      })
      .filter((group) => group.records.length > 0);
  });
  readonly evictionGroups = computed<EvictionDayGroup[]>(() => {
    const groups = new Map<string, EvictionHistory[]>();
    for (const record of this.evictionHistory()) {
      const key = this.dayKey(record.evictedAt, record.id);
      groups.set(key, [...(groups.get(key) ?? []), record]);
    }
    return Array.from(groups.entries()).map(([key, records]) => ({
      key,
      date: records[0].evictedAt,
      records,
    }));
  });

  constructor() {
    this.load();
    interval(60_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.mode() === 'sync' && !this.syncing() && !this.sheetRetrying())
          this.loadCurrentSnapshot();
      });
    this.tenantService.evictions().subscribe({
      next: (values) => {
        this.evictionHistory.set(values);
        const first = this.evictionGroups()[0]?.key;
        if (first) this.expandedEvictionDays.set({ [first]: true });
      },
      error: () => this.evictionHistory.set([]),
    });
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
        this.error.set(
          response?.error?.detail || response?.error?.message || 'The export could not be synced.',
        );
        this.syncing.set(false);
      },
    });
  }

  retryGoogleSheet() {
    if (this.sheetRetrying()) return;
    this.sheetRetrying.set(true);
    this.error.set('');
    this.notices.retryGoogleSheet().subscribe({
      next: (snapshot) => {
        this.snapshot.set(snapshot);
        this.sheetRetrying.set(false);
        if (snapshot.googleSheetSyncStatus === 'synced')
          this.success.set('The latest data was published to Google Sheets.');
        else this.error.set(snapshot.googleSheetSyncError ?? 'Google Sheets sync failed.');
      },
      error: (response) => {
        this.error.set(
          response?.error?.detail || response?.error?.message || 'Google Sheets sync failed.',
        );
        this.sheetRetrying.set(false);
      },
    });
  }

  statusLabel(record: RentSyncRecord) {
    if (record.status === 'paid')
      return `Paid through ${record.paidThrough ? new Date(record.paidThrough).toLocaleDateString() : ''}`;
    return record.status[0].toUpperCase() + record.status.slice(1);
  }

  noticeText(record: RentSyncRecord) {
    return this.mode() === 'overdueNotice'
      ? (record.overdueNotice ?? '')
      : (record.evictionNotice ?? '');
  }

  async copyNotice(snapshotId: string, record: RentSyncRecord) {
    await navigator.clipboard.writeText(this.noticeText(record));
    this.copiedRow.set(this.recordKey(snapshotId, record));
    window.setTimeout(() => this.copiedRow.set(null), 1600);
  }

  async copyPhone(record: RentSyncRecord) {
    if (!record.phone) return;
    const group = this.noticeGroups().find((value) => value.records.includes(record));
    if (!group) return;
    const key = this.recordKey(group.snapshotId, record);
    await navigator.clipboard.writeText(record.phone);
    this.copiedPhone.set(key);
    window.setTimeout(() => this.copiedPhone.set(null), 1600);
  }

  recordKey(snapshotId: string, record: RentSyncRecord) {
    return `${snapshotId}:${record.rowNumber}`;
  }

  isGroupOpen(key: string) {
    return this.expandedDays()[key] ?? false;
  }

  toggleGroup(key: string) {
    this.expandedDays.update((values) => ({ ...values, [key]: !values[key] }));
  }
  isEvictionGroupOpen(key: string) {
    return this.expandedEvictionDays()[key] ?? false;
  }
  toggleEvictionGroup(key: string) {
    this.expandedEvictionDays.update((values) => ({ ...values, [key]: !values[key] }));
  }
  toggleImages(id: string) {
    this.imagesOpen.update((values) => ({ ...values, [id]: !values[id] }));
  }

  setResolution(group: NoticeDayGroup, record: RentSyncRecord, isResolved: boolean) {
    const key = this.recordKey(group.snapshotId, record);
    if (this.resolvingRow()) return;
    this.resolvingRow.set(key);
    this.notices.setResolution(group.snapshotId, record.rowNumber, isResolved).subscribe({
      next: (updated) => {
        this.snapshotList.update((values) =>
          values.map((value) => (value.id === updated.id ? updated : value)),
        );
        if (this.snapshot()?.id === updated.id) this.snapshot.set(updated);
        const status = this.mode() === 'overdueNotice' ? 'overdue' : 'evictable';
        const unresolved = updated.records.filter(
          (value) => value.status === status && !value.isResolved,
        ).length;
        this.expandedDays.update((values) => ({ ...values, [group.key]: unresolved > 0 }));
        this.resolvingRow.set(null);
      },
      error: () => {
        this.snackBar.open('The notice resolution could not be updated.', 'Dismiss', {
          duration: 4000,
          panelClass: ['error-toast'],
        });
        this.resolvingRow.set(null);
      },
    });
  }

  deleteSnapshot(id: string) {
    this.notices.deleteSnapshot(id).subscribe({
      next: () => {
        this.success.set('Deleted synced record successfully.');
        this.loadSnapshots();
        window.setTimeout(() => this.success.set(''), 2600);
      },
      error: (response) => {
        this.error.set(
          response?.error?.detail ||
            response?.error?.message ||
            'The snapshot could not be deleted.',
        );
        window.setTimeout(() => this.error.set(''), 2600);
      },
    });
  }

  private load() {
    this.loadCurrentSnapshot();
    this.loadSnapshots();
  }

  private loadCurrentSnapshot() {
    this.notices.snapshot().subscribe({
      next: (snapshot) => this.snapshot.set(snapshot),
      error: () =>
        this.snapshot.set({
          id: '',
          total: 0,
          active: 0,
          overdue: 0,
          evictable: 0,
          empty: 0,
          unmappedTenants: 0,
          googleSheetSyncStatus: 'notConfigured',
          records: [],
        }),
    });
  }

  private loadSnapshots() {
    this.notices.snapshots().subscribe({
      next: (snapshots) => {
        this.snapshotList.set(snapshots);
        const defaults = { ...this.expandedDays() };
        for (const group of this.noticeGroups())
          if (defaults[group.key] === undefined) defaults[group.key] = group.unresolved > 0;
        this.expandedDays.set(defaults);
      },
      error: () => this.snapshotList.set([]),
    });
  }

  private dayKey(value: string | undefined, fallback: string) {
    if (!value) return fallback;
    const date = new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private isSameLocalDay(value: string | undefined, target: Date) {
    if (!value) return false;
    const date = new Date(value);
    return (
      date.getFullYear() === target.getFullYear() &&
      date.getMonth() === target.getMonth() &&
      date.getDate() === target.getDate()
    );
  }
}
