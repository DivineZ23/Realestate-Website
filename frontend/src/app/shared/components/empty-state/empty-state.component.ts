import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideInbox } from '@lucide/angular';

@Component({
  selector: 'app-empty-state',
  imports: [LucideInbox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="empty">
    <svg lucideInbox aria-hidden="true"></svg>
    <h3>{{ title() }}</h3>
    <p>{{ message() }}</p>
    <ng-content />
  </div>`,
  styles: [
    `
      .empty {
        text-align: center;
        padding: 64px 20px;
        color: var(--muted);
      }
      .empty > svg {
        display: grid;
        place-items: center;
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background: var(--forest-light);
        color: var(--forest);
        padding: 14px;
        stroke-width: 1.8;
        margin: 0 auto 18px;
      }
      h3 {
        color: var(--ink);
        margin-bottom: 8px;
      }
      p {
        max-width: 440px;
        margin: 0 auto 20px;
      }
    `,
  ],
})
export class EmptyStateComponent {
  readonly title = input('Nothing here yet');
  readonly message = input('Try adjusting your filters.');
}
