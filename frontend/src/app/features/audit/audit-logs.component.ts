import { DatePipe, JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AuditService } from '../../core/services/management.services';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
@Component({
  selector: 'app-audit-logs',
  imports: [DatePipe, JsonPipe, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="page-title">
      <p class="eyebrow">Accountability</p>
      <h1>Audit logs</h1>
      <p>Immutable context for material portfolio and access changes.</p>
    </div>
    <div class="panel table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Action</th>
            <th>Entity</th>
            <th>Entity ID</th>
            <th>Performed by</th>
            <th>Metadata</th>
          </tr>
        </thead>
        <tbody>
          @for (log of logs(); track log.id) {
            <tr>
              <td>{{ log.createdAt | date: 'medium' }}</td>
              <td>
                <b>{{ label(log.action) }}</b>
              </td>
              <td>{{ log.entityType }}</td>
              <td>
                <code>{{ log.entityId }}</code>
              </td>
              <td>
                <code>{{ log.performedByUserId }}</code>
              </td>
              <td>
                <small>{{ log.metadata | json }}</small>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="6">
                <app-empty-state
                  title="No audited actions yet"
                  message="Important changes will be recorded here."
                />
              </td>
            </tr>
          }
        </tbody>
      </table>
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
      code {
        font-size: 0.72rem;
        color: var(--muted);
      }
      small {
        display: block;
        max-width: 280px;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `,
  ],
})
export class AuditLogsComponent {
  private service = inject(AuditService);
  readonly logs = toSignal(this.service.all().pipe(map((x) => x.items)), { initialValue: [] });
  label(value: string) {
    return value.replaceAll('.', ' · ').replace(/^./, (x) => x.toUpperCase());
  }
}
