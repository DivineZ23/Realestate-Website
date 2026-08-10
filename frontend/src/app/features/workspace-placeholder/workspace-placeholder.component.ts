import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LucideConstruction } from '@lucide/angular';

@Component({
  selector: 'app-workspace-placeholder',
  imports: [LucideConstruction],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="page-title">
      <div>
        <p class="eyebrow">{{ section }}</p>
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
      </div>
    </div>
    <div class="panel placeholder">
      <svg lucideConstruction></svg>
      <div>
        <h2>Workflow coming next</h2>
        <p>This navigation is ready. The workflow and data model will be added once defined.</p>
      </div>
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
      .page-title p:last-child,
      .placeholder p {
        color: var(--muted);
      }
      .placeholder {
        display: flex;
        align-items: center;
        gap: 18px;
        padding: 28px;
      }
      .placeholder > svg {
        width: 30px;
        height: 30px;
        color: var(--bronze);
      }
      .placeholder h2,
      .placeholder p {
        margin-bottom: 4px;
      }
    `,
  ],
})
export class WorkspacePlaceholderComponent {
  private readonly route = inject(ActivatedRoute);
  readonly section = this.route.snapshot.data['section'] as string;
  readonly title = this.route.snapshot.data['title'] as string;
  readonly description = this.route.snapshot.data['description'] as string;
}
