import { ChangeDetectionStrategy, Component, input } from '@angular/core';
@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="empty">
    <span aria-hidden="true">⌂</span>
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
      span {
        display: grid;
        place-items: center;
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background: var(--forest-light);
        color: var(--forest);
        font-size: 1.4rem;
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
