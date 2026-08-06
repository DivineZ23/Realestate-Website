import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TeamMember } from '../../core/models/user.models';
import { SettingsService } from '../../core/services/management.services';
@Component({
  selector: 'app-settings',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="page-title">
      <p class="eyebrow">Administration</p>
      <h1>Settings</h1>
      <p>Operational configuration is intentionally narrow and secure.</p>
    </div>
    <div class="settings">
      <section class="panel team-editor">
        <header>
          <div>
            <h2>Public team</h2>
            <p>These cards appear on the About page.</p>
          </div>
          <button class="btn btn-secondary" (click)="add()">Add member</button>
        </header>
        <div class="members">
          @for (member of members(); track member.id; let index = $index) {
            <article>
              <img [src]="member.imageUrl" alt="" />
              <label class="field"><span>Name</span><input [(ngModel)]="member.name" /></label>
              <label class="field"><span>Title</span><input [(ngModel)]="member.title" /></label>
              <label class="field wide"
                ><span>Biography</span><textarea rows="2" [(ngModel)]="member.biography"></textarea>
              </label>
              <label class="field wide"
                ><span>Image URL</span><input [(ngModel)]="member.imageUrl"
              /></label>
              <button class="remove" (click)="remove(index)">Remove</button>
            </article>
          }
        </div>
        <button class="btn btn-primary save" [disabled]="saving()" (click)="save()">
          {{ saving() ? 'Saving…' : 'Save public team' }}
        </button>
      </section>
      <section class="panel">
        <div>
          <h2>Eviction reasons</h2>
          <p>Require a reason before completing every eviction workflow.</p>
        </div>
        <span class="enabled">Required</span>
      </section>
      <section class="panel">
        <div>
          <h2>File storage</h2>
          <p>
            Uses Zipline when server credentials are configured, with local storage as the
            development fallback.
          </p>
        </div>
        <span>Server-managed</span>
      </section>
      <section class="panel">
        <div>
          <h2>Discord identity</h2>
          <p>Employee identity is synchronized from the configured Discord OAuth application.</p>
        </div>
        <span>Server-managed</span>
      </section>
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
      .settings {
        display: grid;
        gap: 14px;
        max-width: 900px;
      }
      .settings section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 22px;
      }
      .settings .team-editor {
        display: block;
      }
      .team-editor header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 18px;
      }
      .members {
        display: grid;
        gap: 12px;
      }
      .members article {
        display: grid;
        grid-template-columns: 64px 1fr 1fr auto;
        gap: 12px;
        align-items: end;
        padding: 14px;
        border: 1px solid var(--border);
        border-radius: 12px;
      }
      .members img {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        object-fit: cover;
      }
      .members .wide {
        grid-column: 2 / span 2;
      }
      .remove {
        border: 0;
        background: none;
        color: var(--danger);
        cursor: pointer;
      }
      .save {
        margin-top: 16px;
      }
      .settings h2 {
        font-size: 1.05rem;
        margin-bottom: 5px;
      }
      .settings p {
        color: var(--muted);
        font-size: 0.8rem;
        margin: 0;
      }
      .settings span {
        color: var(--muted);
        font-size: 0.72rem;
      }
      .settings .enabled {
        color: var(--forest);
        background: var(--forest-light);
        padding: 6px 9px;
        border-radius: 99px;
      }
      @media (max-width: 760px) {
        .members article {
          grid-template-columns: 52px 1fr;
        }
        .members img {
          width: 52px;
          height: 52px;
        }
        .members .wide {
          grid-column: 2;
        }
      }
    `,
  ],
})
export class SettingsComponent {
  private settings = inject(SettingsService);
  readonly members = signal<TeamMember[]>([]);
  readonly saving = signal(false);
  constructor() {
    this.settings.team().subscribe((members) => this.members.set(members));
  }
  add() {
    this.members.update((members) => [
      ...members,
      { id: crypto.randomUUID(), name: '', title: '', biography: '', imageUrl: '' },
    ]);
  }
  remove(index: number) {
    this.members.update((members) => members.filter((_, i) => i !== index));
  }
  save() {
    this.saving.set(true);
    this.settings.updateTeam(this.members()).subscribe({
      next: (members) => {
        this.members.set(members);
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }
}
