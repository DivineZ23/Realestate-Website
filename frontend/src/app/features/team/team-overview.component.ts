import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { SettingsService } from '../../core/services/management.services';

@Component({
  selector: 'app-team-overview',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="page-title">
      <div>
        <p class="eyebrow">The people behind the properties</p>
        <h1>About the Team</h1>
        <p>Meet the people representing Imperial Estates and supporting its residents.</p>
      </div>
      @if (auth.isManager()) {
        <a class="btn btn-secondary" routerLink="/dashboard/settings">Edit team profiles</a>
      }
    </div>

    <section class="team-grid">
      @for (member of team(); track member.id) {
        <article class="panel">
          <img [src]="member.imageUrl" [alt]="member.name" />
          <div>
            <p>{{ member.title }}</p>
            <h2>{{ member.name }}</h2>
            <span>{{ member.biography }}</span>
          </div>
        </article>
      } @empty {
        <div class="panel empty">
          <span>IE</span>
          <h2>No team profiles yet</h2>
          <p>Managers can add public team profiles from Settings.</p>
        </div>
      }
    </section>`,
  styles: [
    `
      .page-title {
        display: flex;
        justify-content: space-between;
        align-items: end;
        gap: 24px;
        margin-bottom: 28px;
      }
      .page-title h1 {
        margin: 5px 0;
        font-size: 2.6rem;
      }
      .page-title p:last-child {
        max-width: 620px;
        margin: 0;
        color: var(--muted);
      }
      .team-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 18px;
      }
      article {
        min-height: 290px;
        overflow: hidden;
        display: grid;
        grid-template-columns: minmax(150px, 0.82fr) 1.18fr;
      }
      article img {
        width: 100%;
        height: 100%;
        min-height: 290px;
        object-fit: cover;
      }
      article div {
        display: flex;
        flex-direction: column;
        justify-content: end;
        padding: 28px;
      }
      article p {
        margin-bottom: 9px;
        color: var(--forest);
        font-size: 0.72rem;
        font-weight: 750;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      article h2 {
        margin-bottom: 12px;
        font-size: 1.55rem;
      }
      article span {
        color: var(--muted);
        font-size: 0.88rem;
      }
      .empty {
        grid-column: 1 / -1;
        min-height: 300px;
        display: grid;
        place-content: center;
        justify-items: center;
        padding: 40px;
        text-align: center;
      }
      .empty > span {
        display: grid;
        place-items: center;
        width: 54px;
        height: 54px;
        margin-bottom: 16px;
        border: 1px solid var(--border);
        border-radius: 50%;
        color: var(--forest);
        font-family: Georgia, serif;
      }
      .empty p {
        color: var(--muted);
      }
      @media (max-width: 950px) {
        .team-grid {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 600px) {
        .page-title {
          align-items: start;
          flex-direction: column;
        }
        article {
          grid-template-columns: 1fr;
        }
        article img {
          height: 260px;
          min-height: 0;
        }
      }
    `,
  ],
})
export class TeamOverviewComponent {
  readonly auth = inject(AuthService);
  private settings = inject(SettingsService);
  readonly team = toSignal(this.settings.team().pipe(catchError(() => of([]))), {
    initialValue: [],
  });
}
