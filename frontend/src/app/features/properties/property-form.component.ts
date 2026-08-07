import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideSave } from '@lucide/angular';
import {
  isSupportedPropertyType,
  PROPERTY_TYPE_OPTIONS,
  propertyTypeCapacity,
} from '../../core/constants/property-status.constants';
import {
  Block,
  Property,
  PropertyType,
  UpsertPropertyRequest,
} from '../../core/models/property.models';
import { BlockService } from '../../core/services/management.services';
import { PropertyService } from '../../core/services/property.service';
import { ImageUploaderComponent } from '../../shared/components/image-uploader/image-uploader.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-property-form',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    ImageUploaderComponent,
    StatusBadgeComponent,
    LucideArrowLeft,
    LucideSave,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="back">
      <a routerLink="/dashboard/properties"><svg lucideArrowLeft></svg>Back to properties</a>
    </div>
    <div class="page-title">
      <div>
        <p class="eyebrow">{{ id() ? 'Manage property' : 'New property' }}</p>
        <h1>{{ property()?.propertyName || 'Add a property' }}</h1>
        @if (property(); as p) {
          <app-status-badge [status]="p.status" />
        }
      </div>
      <button class="btn btn-primary" (click)="save()" [disabled]="form.invalid || saving()">
        <svg lucideSave></svg>{{ saving() ? 'Saving…' : 'Save property' }}
      </button>
    </div>
    <div class="editor-grid">
      <form class="panel form" [formGroup]="form">
        <section>
          <h2>Core information</h2>
          <div class="fields">
            <label class="field"
              ><span>Property ID</span><input type="number" formControlName="propertyId" /></label
            ><label class="field"
              ><span>Property name</span><input formControlName="propertyName" /></label
            ><label class="field"
              ><span>Block</span
              ><select formControlName="blockId">
                <option value="">Select block</option>
                @for (block of blocks(); track block.id) {
                  <option [value]="block.id">{{ block.blockName }}</option>
                }
              </select></label
            ><label class="field"
              ><span class="field-heading"
                ><span>Type</span
                ><small class="capacity"
                  >Capacity: {{ capacity(form.controls.type.value) }}
                  {{ capacity(form.controls.type.value) === 1 ? 'person' : 'people' }}</small
                ></span
              ><select formControlName="type">
                @for (type of types; track type.value) {
                  <option [value]="type.value">{{ type.label }}</option>
                }
              </select></label
            ><label class="field wide"
              ><span>Description</span><textarea rows="5" formControlName="description"></textarea>
            </label>
          </div>
        </section>
        <section>
          <h2>Property images</h2>
          <app-image-uploader [images]="images()" (imagesChange)="images.set($event)" />
        </section>
        <section class="checks">
          <label><input type="checkbox" formControlName="isFeatured" /> Feature publicly</label
          ><label><input type="checkbox" formControlName="isActive" /> Active property</label>
        </section>
      </form>
      <aside>
        @if (property(); as p) {
          <section class="panel summary">
            <h2>At a glance</h2>
            <dl>
              <div>
                <dt>Block</dt>
                <dd>{{ p.blockName }}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{{ p.createdAt | date }}</dd>
              </div>
            </dl>
          </section>
        }
      </aside>
    </div>`,
  styles: [
    `
      .back {
        font-size: 0.8rem;
        color: var(--muted);
        margin-bottom: 20px;
      }
      .back a {
        display: inline-flex;
        align-items: center;
        gap: 7px;
      }
      .back svg {
        width: 16px;
        height: 16px;
      }
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
      .editor-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 340px;
        gap: 20px;
      }
      .form {
        padding: 28px;
      }
      .form section + section {
        border-top: 1px solid var(--border);
        padding-top: 28px;
        margin-top: 28px;
      }
      .form h2,
      .summary h2 {
        font-size: 1.15rem;
      }
      .fields {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        align-items: start;
      }
      .wide {
        grid-column: 1/-1;
      }
      .field-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .capacity {
        padding: 2px 8px;
        border-radius: 999px;
        background: var(--forest-light);
        color: var(--forest);
        font-size: 0.68rem;
        font-weight: 750;
        line-height: 1.3;
        white-space: nowrap;
      }
      .checks {
        display: flex;
        gap: 30px;
      }
      .checks label {
        display: flex;
        gap: 8px;
      }
      .summary {
        padding: 22px;
        margin-bottom: 20px;
      }
      .summary dl {
        margin: 0;
      }
      .summary dl div {
        display: flex;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px solid var(--border);
      }
      dt {
        color: var(--muted);
      }
      dd {
        margin: 0;
        font-weight: 650;
      }
      @media (max-width: 1000px) {
        .editor-grid {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 600px) {
        .fields {
          grid-template-columns: 1fr;
        }
        .wide {
          grid-column: auto;
        }
        .page-title .btn {
          position: fixed;
          z-index: 30;
          bottom: 18px;
          right: 18px;
        }
        .form {
          padding: 18px;
        }
      }
    `,
  ],
})
export class PropertyFormComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(PropertyService);
  private blockService = inject(BlockService);
  private snackBar = inject(MatSnackBar);
  private destroy = inject(DestroyRef);
  readonly id = signal<string | null>(null);
  readonly property = signal<Property | null>(null);
  readonly blocks = signal<Block[]>([]);
  readonly images = signal<string[]>([]);
  readonly saving = signal(false);
  readonly types = PROPERTY_TYPE_OPTIONS;
  readonly capacity = propertyTypeCapacity;
  readonly form = new FormGroup({
    propertyId: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    blockId: new FormControl('', { nonNullable: true, validators: Validators.required }),
    propertyName: new FormControl('', { nonNullable: true, validators: Validators.required }),
    description: new FormControl(''),
    type: new FormControl<PropertyType>('motel', { nonNullable: true }),
    isFeatured: new FormControl(false, { nonNullable: true }),
    isActive: new FormControl(true, { nonNullable: true }),
  });
  constructor() {
    this.blockService.all().subscribe((v) => this.blocks.set(v));
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroy)).subscribe((params) => {
      const id = params.get('id');
      this.id.set(id);
      if (id)
        this.service.details(id).subscribe((p) => {
          this.property.set(p);
          this.images.set(p.images);
          this.form.patchValue({
            ...p,
            type: isSupportedPropertyType(p.type) ? p.type : 'motel',
          });
        });
    });
  }
  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const existing = this.property();
    const body: UpsertPropertyRequest = {
      propertyId: raw.propertyId!,
      blockId: raw.blockId,
      propertyName: raw.propertyName,
      description: raw.description || null,
      type: raw.type,
      storage: existing?.storage ?? null,
      rent: existing?.rent ?? 0,
      securityDeposit: existing?.securityDeposit ?? null,
      bedrooms: existing?.bedrooms ?? null,
      bathrooms: existing?.bathrooms ?? null,
      floor: existing?.floor ?? null,
      area: existing?.area ?? null,
      furnishingStatus: existing?.furnishingStatus ?? null,
      amenities: existing?.amenities ?? [],
      images: this.images(),
      isFeatured: raw.isFeatured,
      isActive: raw.isActive,
    };
    const isEditing = Boolean(this.id());
    const request = isEditing ? this.service.update(this.id()!, body) : this.service.create(body);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open(
          `Property ${isEditing ? 'updated' : 'created'} successfully.`,
          'Dismiss',
          {
            duration: 4000,
            panelClass: ['success-toast'],
          },
        );
        this.router.navigate(['/dashboard/properties']);
      },
      error: () => this.saving.set(false),
    });
  }
}
