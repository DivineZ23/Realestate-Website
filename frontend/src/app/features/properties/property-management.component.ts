import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { debounceTime, finalize, startWith, switchMap } from 'rxjs';
import { PROPERTY_STATUSES, PROPERTY_TYPES } from '../../core/constants/property-status.constants';
import { PagedResult } from '../../core/models/api.models';
import { Block, Property, PropertyStatus, PropertyType } from '../../core/models/property.models';
import { AuthService } from '../../core/services/auth.service';
import { BlockService } from '../../core/services/management.services';
import { PropertyService } from '../../core/services/property.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-property-management',
  imports: [
    CurrencyPipe,
    DatePipe,
    TitleCasePipe,
    ReactiveFormsModule,
    RouterLink,
    StatusBadgeComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="page-title">
      <div>
        <p class="eyebrow">Portfolio</p>
        <h1>Properties</h1>
        <p>Search, update, and progress every property through its lifecycle.</p>
      </div>
      @if (auth.isManager()) {
        <a class="btn btn-primary" routerLink="new">Add property</a>
      }
    </div>
    <form [formGroup]="filters" class="toolbar panel">
      <input
        formControlName="search"
        placeholder="Search name, block, or ID"
        aria-label="Search properties"
      /><select formControlName="status">
        <option value="">All statuses</option>
        @for (status of statuses; track status.value) {
          <option [value]="status.value">{{ status.label }}</option>
        }</select
      ><select formControlName="type">
        <option value="">All types</option>
        @for (type of types; track type) {
          <option [value]="type">{{ type | titlecase }}</option>
        }</select
      ><select formControlName="blockId">
        <option value="">All blocks</option>
        @for (block of blocks(); track block.id) {
          <option [value]="block.id">{{ block.blockName }}</option>
        }
      </select>
    </form>
    <div class="panel table-wrap">
      @if (loading()) {
        <div class="loading">Updating portfolio…</div>
      }
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Property</th>
            <th>Block</th>
            <th>Type</th>
            <th>Rent</th>
            <th>Status</th>
            <th>Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (property of result().items; track property.id) {
            <tr>
              <td>#{{ property.propertyId }}</td>
              <td>
                <b>{{ property.propertyName }}</b>
              </td>
              <td>{{ property.blockName }}</td>
              <td>{{ property.type | titlecase }}</td>
              <td>{{ property.rent | currency: 'USD' : 'symbol' : '1.0-0' }}</td>
              <td><app-status-badge [status]="property.status" /></td>
              <td>{{ property.updatedAt | date: 'mediumDate' }}</td>
              <td>
                <div class="row-actions">
                  @if (property.status === 'available' || property.status === 'booked') {
                    <a [routerLink]="[property.id, 'edit']">Assign</a>
                  } @else if (property.status === 'owned') {
                    <button class="danger" (click)="evict(property)">Evict</button>
                  }
                  @if (property.status === 'available') {
                    <button (click)="book(property)">Book</button>
                  }
                  @if (property.status === 'booked') {
                    <button (click)="release(property)">Release</button>
                  }
                  @if (auth.isManager()) {
                    <button class="danger" (click)="remove(property)">Delete</button>
                  }
                </div>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="8">
                <app-empty-state
                  title="No properties found"
                  message="Adjust your filters or add the first property."
                />
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
    <div class="pagination">
      <button
        class="btn btn-secondary"
        [disabled]="!result().hasPreviousPage"
        (click)="page(result().page - 1)"
      >
        Previous</button
      ><span>Page {{ result().page }} of {{ result().totalPages || 1 }}</span
      ><button
        class="btn btn-secondary"
        [disabled]="!result().hasNextPage"
        (click)="page(result().page + 1)"
      >
        Next
      </button>
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
      .toolbar {
        display: grid;
        grid-template-columns: 2fr repeat(3, 1fr);
        gap: 10px;
        padding: 14px;
        margin-bottom: 18px;
      }
      .toolbar input,
      .toolbar select {
        height: 42px;
        border: 1px solid var(--border);
        border-radius: 9px;
        background: white;
        padding: 0 12px;
      }
      .loading {
        padding: 12px;
        color: var(--bronze);
        font-size: 0.8rem;
      }
      .row-actions {
        display: flex;
        align-items: center;
        gap: 9px;
      }
      .row-actions a,
      .row-actions button {
        border: 0;
        background: none;
        color: var(--forest);
        font-weight: 700;
        font-size: 0.78rem;
        cursor: pointer;
      }
      .row-actions .danger {
        color: var(--danger);
      }
      .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 20px;
        margin-top: 24px;
        font-size: 0.8rem;
      }
      @media (max-width: 850px) {
        .toolbar {
          grid-template-columns: 1fr 1fr;
        }
        .page-title .btn {
          display: none;
        }
      }
    `,
  ],
})
export class PropertyManagementComponent {
  readonly auth = inject(AuthService);
  private service = inject(PropertyService);
  private blockService = inject(BlockService);
  private dialog = inject(MatDialog);
  private destroy = inject(DestroyRef);
  readonly statuses = PROPERTY_STATUSES;
  readonly types = PROPERTY_TYPES;
  readonly blocks = signal<Block[]>([]);
  readonly loading = signal(false);
  readonly result = signal<PagedResult<Property>>({
    items: [],
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  });
  readonly filters = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    status: new FormControl<PropertyStatus | ''>('', { nonNullable: true }),
    type: new FormControl<PropertyType | ''>('', { nonNullable: true }),
    blockId: new FormControl('', { nonNullable: true }),
    page: new FormControl(1, { nonNullable: true }),
  });
  constructor() {
    this.blockService.all().subscribe((v) => this.blocks.set(v));
    this.filters.valueChanges
      .pipe(
        startWith(this.filters.getRawValue()),
        debounceTime(220),
        switchMap((value) => {
          this.loading.set(true);
          return this.service
            .all({ ...value, pageSize: 20 })
            .pipe(finalize(() => this.loading.set(false)));
        }),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe((v) => this.result.set(v));
  }
  page(page: number) {
    this.filters.controls.page.setValue(page);
  }
  refresh() {
    this.filters.controls.page.setValue(this.filters.controls.page.value, { emitEvent: true });
  }
  book(property: Property) {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Book this property?',
          message: 'The property will be removed from public availability and marked as Booked.',
          confirmLabel: 'Book',
        },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result?.confirmed)
          this.service.changeStatus(property.id, 'booked').subscribe(() => this.refresh());
      });
  }
  release(property: Property) {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Release this property?',
          message: 'The current booking will be removed and the property will become available.',
          confirmLabel: 'Release',
        },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result?.confirmed)
          this.service.changeStatus(property.id, 'available').subscribe(() => this.refresh());
      });
  }
  evict(property: Property) {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Evict current tenant?',
          message:
            'The active tenancy will be ended, history preserved, and the property returned to Available.',
          requireReason: true,
          dangerous: true,
          confirmLabel: 'Evict tenant',
        },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result?.confirmed)
          this.service.evict(property.id, result.reason).subscribe(() => this.refresh());
      });
  }
  remove(property: Property) {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete property?',
          message:
            'The property will be deactivated and removed from active management views. History is retained.',
          dangerous: true,
          confirmLabel: 'Delete',
        },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result?.confirmed) this.service.delete(property.id).subscribe(() => this.refresh());
      });
  }
}
