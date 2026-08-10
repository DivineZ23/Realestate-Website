import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PropertyStatus } from '../../../core/models/property.models';

@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<span class="badge" [class]="\'badge \'+status()">{{ label() }}</span>',
  styles: [
    `
      .badge {
        display: inline-flex;
        padding: 5px 10px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        line-height: 16px;
        text-transform: capitalize;
      }
      .available {
        background: var(--available-bg);
        color: var(--available-ink);
      }
      .booked {
        background: var(--booked-bg);
        color: var(--booked-ink);
      }
      .owned {
        background: var(--owned-bg);
        color: var(--owned-ink);
      }
      .unavailable {
        background: var(--neutral-soft);
        color: var(--muted);
      }
    `,
  ],
})
export class StatusBadgeComponent {
  readonly status = input.required<PropertyStatus>();
  readonly label = () => (this.status() === 'owned' ? 'Occupied' : this.status());
}
