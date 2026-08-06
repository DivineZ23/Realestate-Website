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
        font-size: 0.72rem;
        font-weight: 760;
        text-transform: capitalize;
      }
      .available {
        background: #dcece3;
        color: #14533d;
      }
      .booked {
        background: #f7e9cb;
        color: #7a541a;
      }
      .owned {
        background: #dfe7f3;
        color: #294c7b;
      }
      .unavailable {
        background: #ece7e4;
        color: #655b56;
      }
    `,
  ],
})
export class StatusBadgeComponent {
  readonly status = input.required<PropertyStatus>();
  readonly label = () => (this.status() === 'owned' ? 'Occupied' : this.status());
}
