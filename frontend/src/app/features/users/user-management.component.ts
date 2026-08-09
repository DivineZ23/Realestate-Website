import { DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  LucideBan,
  LucideRotateCcw,
  LucideShieldCheck,
  LucideShieldMinus,
  LucideTrash2,
  LucideUserCheck,
  LucideUserX,
} from '@lucide/angular';
import { User } from '../../core/models/user.models';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/management.services';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { USER_ROLES } from '../../core/constants/user-role.constants';

@Component({
  selector: 'app-user-management',
  imports: [
    DatePipe,
    TitleCasePipe,
    EmptyStateComponent,
    LucideBan,
    LucideRotateCcw,
    LucideShieldCheck,
    LucideShieldMinus,
    LucideTrash2,
    LucideUserCheck,
    LucideUserX,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="page-title">
      <div>
        <p class="eyebrow">Administration</p>
        <h1>Team access</h1>
        <p>Approve employees and manage roles without trusting client-supplied permissions.</p>
      </div>
      <span class="pending">{{ pendingCount() }} pending</span>
    </div>
    <nav class="tabs">
      @for (tab of tabs; track tab.key) {
        <button [class.active]="activeTab() === tab.key" (click)="activeTab.set(tab.key); load()">
          {{ tab.label }}
        </button>
      }
    </nav>
    <div class="users">
      @for (user of users(); track user.id) {
        <article class="panel">
          <img [src]="user.avatarUrl || fallback" alt="" />
          <div class="identity">
            <h2>{{ user.displayName }}</h2>
            <p>@{{ user.username }}</p>
            <div class="badges">
              <span [class.owner]="user.role === 'owner'">{{ roleLabel(user.role) }}</span
              ><span>{{ user.approvalStatus | titlecase }}</span
              ><span [class.revoked]="user.accessStatus === 'revoked'">{{
                user.accessStatus | titlecase
              }}</span>
            </div>
          </div>
          <dl>
            <div>
              <dt>Registered</dt>
              <dd>{{ user.createdAt | date: 'mediumDate' }}</dd>
            </div>
            <div>
              <dt>Last login</dt>
              <dd>{{ user.lastLoginAt ? (user.lastLoginAt | date: 'mediumDate') : 'Never' }}</dd>
            </div>
          </dl>
          <div class="actions">
            @if (user.approvalStatus === 'pending') {
              <button (click)="simple(user, 'approve')"><svg lucideUserCheck></svg>Approve</button
              ><button class="danger" (click)="reason(user, 'reject')">
                <svg lucideUserX></svg>Reject
              </button>
            }
            @if (
              user.approvalStatus === 'approved' &&
              user.accessStatus === 'active' &&
              (user.role === 'agent' || user.role === 'seniorAgent') &&
              auth.isOwner()
            ) {
              <button (click)="simple(user, 'promote')">
                <svg lucideShieldCheck></svg>{{ user.role === 'agent' ? 'Promote to Senior Agent' : 'Promote to Manager' }}
              </button>
            }
            @if ((user.role === 'manager' || user.role === 'seniorAgent') && auth.isOwner()) {
              <button class="danger" (click)="reason(user, 'demote')">
                <svg lucideShieldMinus></svg>Demote
              </button>
            }
            @if (user.accessStatus === 'active' && canChangeAccess(user)) {
              <button class="danger" (click)="reason(user, 'revoke')">
                <svg lucideBan></svg>Revoke
              </button>
            }
            @if (
              user.accessStatus === 'revoked' &&
              user.approvalStatus === 'approved' &&
              canChangeAccess(user)
            ) {
              <button (click)="simple(user, 'restore')"><svg lucideRotateCcw></svg>Restore</button>
            }
            @if (canChangeAccess(user)) {
              <button class="danger" (click)="remove(user)"><svg lucideTrash2></svg>Delete</button>
            }
          </div>
        </article>
      } @empty {
        <app-empty-state
          title="No team members in this view"
          message="Choose another tab or wait for new registrations."
        />
      }
    </div>`,
  styles: [
    `
      .page-title {
        display: flex;
        justify-content: space-between;
        align-items: end;
      }
      .page-title h1 {
        font-size: 2.5rem;
        margin: 4px 0;
      }
      .page-title p:last-child {
        color: var(--muted);
        margin: 0;
      }
      .pending {
        background: var(--warning-soft);
        color: var(--warning-ink);
        border-radius: 99px;
        padding: 8px 13px;
        font-size: 0.78rem;
        font-weight: 700;
      }
      .tabs {
        display: flex;
        gap: 6px;
        margin: 26px 0;
        border-bottom: 1px solid var(--border);
      }
      .tabs button {
        border: 0;
        background: none;
        padding: 12px 15px;
        color: var(--muted);
        cursor: pointer;
        font-weight: 650;
      }
      .tabs button.active {
        color: var(--forest);
        border-bottom: 2px solid var(--forest);
      }
      .users {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
      }
      .users article {
        display: grid;
        grid-template-columns: 60px 1fr auto;
        gap: 16px;
        padding: 20px;
      }
      .users img {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        object-fit: cover;
      }
      .identity h2 {
        font-size: 1.15rem;
        margin: 2px 0;
      }
      .identity p {
        color: var(--muted);
        font-size: 0.78rem;
      }
      .badges {
        display: flex;
        gap: 6px;
      }
      .badges span {
        padding: 4px 7px;
        border-radius: 99px;
        background: var(--forest-light);
        color: var(--forest);
        font-size: 0.65rem;
      }
      .badges .revoked {
        background: var(--danger-soft);
        color: var(--danger);
      }
      .badges .owner {
        background: var(--bronze);
        color: var(--on-primary);
      }
      dl {
        font-size: 0.72rem;
        margin: 0;
      }
      dl div {
        margin-bottom: 8px;
      }
      dt {
        color: var(--muted);
      }
      dd {
        margin: 0;
        font-weight: 600;
      }
      .actions {
        grid-column: 2/-1;
        display: flex;
        gap: 8px;
        border-top: 1px solid var(--border);
        padding-top: 14px;
        flex-wrap: wrap;
      }
      .actions button {
        border: 0;
        background: var(--forest-light);
        color: var(--forest);
        border-radius: 8px;
        padding: 7px 10px;
        font-size: 0.72rem;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .actions button svg {
        width: 14px;
        height: 14px;
        stroke-width: 1.9;
      }
      .actions .danger {
        background: var(--danger-soft);
        color: var(--danger);
      }
      @media (max-width: 1050px) {
        .users {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 600px) {
        .tabs {
          overflow-x: auto;
        }
        .users article {
          grid-template-columns: 50px 1fr;
        }
        .users img {
          width: 50px;
          height: 50px;
        }
        .users dl {
          grid-column: 2;
        }
        .actions {
          grid-column: 1/-1;
        }
      }
    `,
  ],
})
export class UserManagementComponent {
  readonly roleLabel = (role: keyof typeof USER_ROLES) => USER_ROLES[role];
  readonly auth = inject(AuthService);
  private service = inject(UserService);
  private dialog = inject(MatDialog);
  readonly users = signal<User[]>([]);
  readonly activeTab = signal('pending');
  readonly pendingCount = signal(0);
  readonly fallback = 'https://api.dicebear.com/9.x/initials/svg?seed=User';
  readonly tabs = [
    { key: 'pending', label: 'Pending approval' },
    { key: 'agents', label: 'Active agents' },
    { key: 'seniorAgents', label: 'Senior agents' },
    { key: 'managers', label: 'Managers' },
    { key: 'owners', label: 'Owner' },
    { key: 'revoked', label: 'Revoked' },
    { key: 'rejected', label: 'Rejected' },
  ];
  constructor() {
    this.service.all({ approval: 'pending' }).subscribe((v) => this.pendingCount.set(v.totalItems));
    this.load();
  }
  load() {
    const filters =
      this.activeTab() === 'pending'
        ? { approval: 'pending' as const }
        : this.activeTab() === 'agents'
          ? { approval: 'approved' as const, access: 'active' as const, role: 'agent' as const }
          : this.activeTab() === 'seniorAgents'
            ? { approval: 'approved' as const, access: 'active' as const, role: 'seniorAgent' as const }
          : this.activeTab() === 'managers'
            ? { approval: 'approved' as const, role: 'manager' as const }
            : this.activeTab() === 'owners'
              ? { approval: 'approved' as const, role: 'owner' as const }
              : this.activeTab() === 'revoked'
                ? { access: 'revoked' as const }
                : { approval: 'rejected' as const };
    this.service.all(filters).subscribe((v) => this.users.set(v.items));
  }
  canChangeAccess(user: User): boolean {
    if (user.role === 'owner' || user.id === this.auth.user()?.id) return false;
    return this.auth.isOwner() || user.role === 'agent' || user.role === 'seniorAgent';
  }
  simple(user: User, action: 'approve' | 'promote' | 'restore') {
    this.confirm(user, action, false);
  }
  reason(user: User, action: 'reject' | 'demote' | 'revoke') {
    this.confirm(user, action, true);
  }
  private confirm(
    user: User,
    action: 'approve' | 'reject' | 'promote' | 'demote' | 'revoke' | 'restore',
    requireReason: boolean,
  ) {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: `${action[0].toUpperCase() + action.slice(1)} ${user.displayName}?`,
          message: 'This access change will be enforced immediately and recorded in the audit log.',
          requireReason,
          dangerous: ['reject', 'demote', 'revoke'].includes(action),
          confirmLabel: action[0].toUpperCase() + action.slice(1),
        },
      })
      .afterClosed()
      .subscribe((r) => {
        if (r?.confirmed)
          this.service.action(user.id, action, r.reason).subscribe(() => {
            this.load();
            this.service
              .all({ approval: 'pending' })
              .subscribe((v) => this.pendingCount.set(v.totalItems));
          });
      });
  }
  remove(user: User) {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: `Delete ${user.displayName}?`,
          message: 'This account will be soft-deleted and immediately lose access.',
          requireReason: true,
          dangerous: true,
          confirmLabel: 'Delete account',
        },
      })
      .afterClosed()
      .subscribe((r) => {
        if (r?.confirmed) this.service.delete(user.id, r.reason).subscribe(() => this.load());
      });
  }
}
