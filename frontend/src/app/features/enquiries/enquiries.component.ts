import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Enquiry, EnquiryStatus } from '../../core/models/management.models';
import { AgentSummary } from '../../core/models/user.models';
import { EnquiryService, TeamService } from '../../core/services/management.services';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-enquiries',
  imports: [DatePipe, FormsModule, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="page-title">
      <div>
        <p class="eyebrow">Leads & bookings</p>
        <h1>Enquiries</h1>
        <p>Keep every conversation moving toward a clear outcome.</p>
      </div>
      <select [(ngModel)]="filter" (ngModelChange)="load()">
        <option value="">All enquiries</option>
        @for (status of statuses; track status) {
          <option [value]="status">{{ label(status) }}</option>
        }
      </select>
    </div>
    <div class="cards">
      @for (item of enquiries(); track item.id) {
        <article class="panel">
          <div class="card-head">
            <div>
              <span>{{ item.propertyName }}</span>
              <h2>{{ item.fullName }}</h2>
            </div>
            <select [ngModel]="item.status" (ngModelChange)="update(item, $event)">
              @for (status of statuses; track status) {
                <option [value]="status">{{ label(status) }}</option>
              }
            </select>
          </div>
          <div class="contact">
            <a [href]="'tel:' + item.phoneNumber">{{ item.phoneNumber }}</a>
            @if (item.email) {
              <a [href]="'mailto:' + item.email">{{ item.email }}</a>
            }
            <time>{{ item.createdAt | date: 'medium' }}</time>
          </div>
          @if (item.message) {
            <blockquote>{{ item.message }}</blockquote>
          }
          <label class="field"
            ><span>Assigned agent</span
            ><select [ngModel]="item.assignedAgentId || ''" (ngModelChange)="assign(item, $event)">
              <option value="">Unassigned</option>
              @for (agent of agents(); track agent.id) {
                <option [value]="agent.id">{{ agent.displayName }}</option>
              }
            </select></label
          >
          <label class="field"
            ><span>Internal notes</span
            ><textarea
              rows="2"
              [ngModel]="item.internalNotes"
              (blur)="notes(item, $any($event.target).value)"
              placeholder="Add private team notes"
            ></textarea>
          </label>
        </article>
      } @empty {
        <app-empty-state
          title="No enquiries in this view"
          message="New visitor enquiries will appear here."
        />
      }
    </div>`,
  styles: [
    `
      .page-title {
        display: flex;
        justify-content: space-between;
        align-items: end;
        margin-bottom: 24px;
      }
      .page-title h1 {
        font-size: 2.5rem;
        margin: 4px 0;
      }
      .page-title p:last-child {
        color: var(--muted);
        margin: 0;
      }
      .page-title select,
      .card-head select {
        border: 1px solid var(--border);
        border-radius: 9px;
        background: var(--surface-strong);
        color: var(--ink);
        padding: 10px;
      }
      .cards {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
      }
      .cards article {
        padding: 22px;
      }
      .card-head {
        display: flex;
        justify-content: space-between;
        gap: 20px;
      }
      .card-head span {
        font-size: 0.72rem;
        color: var(--bronze);
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .card-head h2 {
        font-size: 1.25rem;
        margin: 6px 0;
      }
      .contact {
        display: flex;
        gap: 16px;
        padding: 14px 0;
        border-block: 1px solid var(--border);
        font-size: 0.78rem;
      }
      .contact time {
        margin-left: auto;
        color: var(--muted);
      }
      blockquote {
        margin: 18px 0;
        color: var(--muted);
        font-style: italic;
      }
      .field {
        margin-top: 16px;
      }
      .field select {
        border: 1px solid var(--border);
        border-radius: 9px;
        background: var(--surface-strong);
        color: var(--ink);
        padding: 10px;
      }
      @media (max-width: 780px) {
        .cards {
          grid-template-columns: 1fr;
        }
        .page-title {
          align-items: start;
        }
        .contact {
          flex-wrap: wrap;
        }
        .contact time {
          width: 100%;
          margin: 0;
        }
      }
    `,
  ],
})
export class EnquiriesComponent {
  private service = inject(EnquiryService);
  private team = inject(TeamService);
  readonly enquiries = signal<Enquiry[]>([]);
  readonly agents = signal<AgentSummary[]>([]);
  readonly statuses: EnquiryStatus[] = [
    'new',
    'contacted',
    'viewingScheduled',
    'booked',
    'closed',
    'rejected',
  ];
  filter: EnquiryStatus | '' = '';
  constructor() {
    this.load();
    this.team.agents().subscribe((agents) => this.agents.set(agents));
  }
  load() {
    this.service.all(1, this.filter || undefined).subscribe((v) => this.enquiries.set(v.items));
  }
  label(s: string) {
    return s.replace(/([A-Z])/g, ' $1').replace(/^./, (x) => x.toUpperCase());
  }
  update(item: Enquiry, status: EnquiryStatus) {
    this.service.update(item.id, { status }).subscribe(() => this.load());
  }
  assign(item: Enquiry, assignedAgentId: string) {
    this.service.update(item.id, { assignedAgentId }).subscribe(() => this.load());
  }
  notes(item: Enquiry, internalNotes: string) {
    if (internalNotes !== item.internalNotes)
      this.service.update(item.id, { internalNotes }).subscribe(() => this.load());
  }
}
