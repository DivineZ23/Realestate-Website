import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';
import { Block } from '../../core/models/property.models';
import { BlockService } from '../../core/services/management.services';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-block-management',
  imports: [DatePipe, ReactiveFormsModule, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="page-title">
      <div>
        <p class="eyebrow">Portfolio structure</p>
        <h1>Blocks</h1>
        <p>Group properties by location and estate collection.</p>
      </div>
      @if (auth.isManager()) {
        <button class="btn btn-primary" (click)="openNew()">Add block</button>
      }
    </div>
    <div class="layout" [class.editing]="editing()">
      <section class="panel table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Block</th>
              <th>Properties</th>
              <th>Active</th>
              <th>Updated</th>
              @if (auth.isManager()) {
                <th>Actions</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (block of blocks(); track block.id) {
              <tr>
                <td>#{{ block.blockId }}</td>
                <td>
                  <b>{{ block.blockName }}</b
                  ><small>{{ block.address || 'No address set' }}</small>
                </td>
                <td>{{ block.numberOfProperties }}</td>
                <td>
                  <span class="state" [class.on]="block.isActive">{{
                    block.isActive ? 'Active' : 'Inactive'
                  }}</span>
                </td>
                <td>{{ block.updatedAt | date: 'mediumDate' }}</td>
                @if (auth.isManager()) {
                  <td>
                    <button (click)="edit(block)">Edit</button
                    ><button class="danger" (click)="remove(block)">Delete</button>
                  </td>
                }
              </tr>
            } @empty {
              <tr>
                <td colspan="6">
                  <app-empty-state
                    title="No blocks yet"
                    message="Create the first block to start adding properties."
                  />
                </td>
              </tr>
            }
          </tbody>
        </table>
      </section>
      @if (editing()) {
        <aside class="panel">
          <div class="aside-head">
            <h2>{{ selected() ? 'Edit block' : 'New block' }}</h2>
            <button (click)="close()">×</button>
          </div>
          <form [formGroup]="form" (ngSubmit)="save()">
            <label class="field"
              ><span>Block ID</span><input type="number" formControlName="blockId" /></label
            ><label class="field"
              ><span>Block name</span><input formControlName="blockName" /></label
            ><label class="field"><span>Address</span><input formControlName="address" /></label
            ><label class="field"
              ><span>Description</span
              ><textarea rows="4" formControlName="description"></textarea></label
            ><label class="field"><span>Image URL</span><input formControlName="imageUrl" /></label
            ><label class="check"><input type="checkbox" formControlName="isActive" /> Active</label
            ><button class="btn btn-primary" [disabled]="form.invalid || saving()">
              {{ saving() ? 'Saving…' : 'Save block' }}
            </button>
          </form>
        </aside>
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
      .layout {
        display: grid;
        grid-template-columns: 1fr;
        gap: 20px;
      }
      .layout.editing {
        grid-template-columns: minmax(0, 1fr) 360px;
      }
      .data-table td small {
        display: block;
        color: var(--muted);
      }
      td button {
        border: 0;
        background: none;
        color: var(--forest);
        font-weight: 700;
        cursor: pointer;
      }
      .data-table .danger {
        color: var(--danger);
      }
      .state {
        font-size: 0.72rem;
        padding: 5px 9px;
        border-radius: 99px;
        background: var(--neutral-soft);
        color: var(--muted);
      }
      .state.on {
        background: var(--forest-light);
        color: var(--forest);
      }
      aside {
        padding: 22px;
      }
      .aside-head {
        display: flex;
        justify-content: space-between;
      }
      .aside-head button {
        border: 0;
        background: none;
        font-size: 1.4rem;
        cursor: pointer;
      }
      aside form {
        display: grid;
        gap: 14px;
      }
      .check {
        display: flex;
        gap: 8px;
      }
      @media (max-width: 1000px) {
        .layout.editing {
          grid-template-columns: 1fr;
        }
        aside {
          order: -1;
        }
      }
    `,
  ],
})
export class BlockManagementComponent {
  readonly auth = inject(AuthService);
  private service = inject(BlockService);
  private dialog = inject(MatDialog);
  readonly blocks = signal<Block[]>([]);
  readonly editing = signal(false);
  readonly selected = signal<Block | null>(null);
  readonly saving = signal(false);
  readonly form = new FormGroup({
    blockId: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    blockName: new FormControl('', { nonNullable: true, validators: Validators.required }),
    description: new FormControl(''),
    address: new FormControl(''),
    imageUrl: new FormControl(''),
    isActive: new FormControl(true, { nonNullable: true }),
  });
  constructor() {
    this.load();
  }
  load() {
    this.service.all().subscribe((v) => this.blocks.set(v));
  }
  openNew() {
    this.selected.set(null);
    this.form.reset({
      blockId: null,
      blockName: '',
      description: '',
      address: '',
      imageUrl: '',
      isActive: true,
    });
    this.editing.set(true);
  }
  edit(b: Block) {
    this.selected.set(b);
    this.form.patchValue(b);
    this.editing.set(true);
  }
  close() {
    this.editing.set(false);
  }
  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const body = {
      ...raw,
      blockId: raw.blockId!,
      description: raw.description || null,
      address: raw.address || null,
      imageUrl: raw.imageUrl || null,
    };
    const request = this.selected()
      ? this.service.update(this.selected()!.id, body)
      : this.service.create(body);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.close();
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }
  remove(b: Block) {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete block?',
          message: 'Deletion is prevented while the block contains properties.',
          dangerous: true,
          confirmLabel: 'Delete',
        },
      })
      .afterClosed()
      .subscribe((r) => {
        if (r?.confirmed) this.service.delete(b.id).subscribe(() => this.load());
      });
  }
}
