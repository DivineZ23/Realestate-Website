import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PropertyStatus } from '../../../core/models/property.models';
import { propertyStatusLabel } from '../../../core/constants/property-status.constants';

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
        white-space: nowrap;
      }
      .available {
        background: var(--available-bg);
        color: var(--available-ink);
      }
      .booked {
        background: var(--booked-bg);
        color: var(--booked-ink);
      }
      .paid,
      .auction {
        background: var(--owned-bg);
        color: var(--owned-ink);
      }
      .overdue {
        background: var(--booked-bg);
        color: var(--booked-ink);
      }
      .evictable {
        background: var(--danger-soft);
        color: var(--danger);
      }
      .onHold {
        background: var(--neutral-soft);
        color: var(--muted);
      }
    `,
  ],
})
export class StatusBadgeComponent {
  readonly status = input.required<PropertyStatus>();
  readonly label = () => propertyStatusLabel(this.status());
}
