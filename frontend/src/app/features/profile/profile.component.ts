import { DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { USER_ROLES } from '../../core/constants/user-role.constants';
@Component({
  selector: 'app-profile',
  imports: [DatePipe, TitleCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="page-title">
      <p class="eyebrow">Personal account</p>
      <h1>Profile</h1>
    </div>
    @if (auth.user(); as user) {
      <div class="profile panel">
        <img [src]="user.avatarUrl || fallback" alt="" />
        <div>
          <h2>{{ user.displayName }}</h2>
          <p>@{{ user.username }}</p>
          <span>{{ roleLabel(user.role) }}</span>
        </div>
        <dl>
          <div>
            <dt>Email</dt>
            <dd>{{ user.email || 'Not provided by Discord' }}</dd>
          </div>
          <div>
            <dt>Approval</dt>
            <dd>{{ user.approvalStatus | titlecase }}</dd>
          </div>
          <div>
            <dt>Access</dt>
            <dd>{{ user.accessStatus | titlecase }}</dd>
          </div>
          <div>
            <dt>Last sign in</dt>
            <dd>
              {{ user.lastLoginAt ? (user.lastLoginAt | date: 'medium') : 'Current session' }}
            </dd>
          </div>
        </dl>
        <p class="note">
          Identity details and your profile image are synchronized from Discord at sign-in.
        </p>
      </div>
    }`,
  styles: [
    `
      .page-title h1 {
        font-size: 2.5rem;
        margin: 4px 0 24px;
      }
      .profile {
        max-width: 760px;
        padding: 30px;
        display: grid;
        grid-template-columns: 100px 1fr;
        gap: 24px;
      }
      .profile > img {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        object-fit: cover;
      }
      .profile h2 {
        font-size: 1.6rem;
        margin: 12px 0 2px;
      }
      .profile > div > p {
        color: var(--muted);
        margin: 0;
      }
      .profile > div > span {
        display: inline-block;
        margin-top: 10px;
        padding: 5px 9px;
        border-radius: 99px;
        background: var(--forest-light);
        color: var(--forest);
        font-size: 0.72rem;
      }
      .profile dl {
        grid-column: 1/-1;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        padding-top: 22px;
        border-top: 1px solid var(--border);
      }
      dt {
        color: var(--muted);
        font-size: 0.72rem;
      }
      dd {
        margin: 4px 0;
        font-weight: 650;
      }
      .note {
        grid-column: 1/-1;
        color: var(--muted);
        font-size: 0.8rem;
      }
    `,
  ],
})
export class ProfileComponent {
  readonly auth = inject(AuthService);
  readonly fallback = 'https://api.dicebear.com/9.x/initials/svg?seed=Imperial';
  readonly roleLabel = (role: keyof typeof USER_ROLES) => USER_ROLES[role];
}
