import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PROPERTY_TYPES } from '../../core/constants/property-status.constants';
import {
  AssignTenantRequest,
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
    CurrencyPipe,
    DatePipe,
    TitleCasePipe,
    ReactiveFormsModule,
    RouterLink,
    ImageUploaderComponent,
    StatusBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="back"><a routerLink="/dashboard/properties">← Back to properties</a></div>
    <div class="page-title">
      <div>
        <p class="eyebrow">{{ id() ? 'Manage property' : 'New property' }}</p>
        <h1>{{ property()?.propertyName || 'Add a property' }}</h1>
        @if (property(); as p) {
          <app-status-badge [status]="p.status" />
        }
      </div>
      <button class="btn btn-primary" (click)="save()" [disabled]="form.invalid || saving()">
        {{ saving() ? 'Saving…' : 'Save property' }}
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
              ><span>Type</span
              ><select formControlName="type">
                @for (type of types; track type) {
                  <option [value]="type">{{ type | titlecase }}</option>
                }
              </select></label
            ><label class="field wide"
              ><span>Description</span><textarea rows="5" formControlName="description"></textarea>
            </label>
          </div>
        </section>
        <section>
          <h2>Pricing & dimensions</h2>
          <div class="fields">
            <label class="field"
              ><span>Monthly rent</span><input type="number" formControlName="rent" /></label
            ><label class="field"
              ><span>Security deposit</span
              ><input type="number" formControlName="securityDeposit" /></label
            ><label class="field"
              ><span>Bedrooms</span><input type="number" formControlName="bedrooms" /></label
            ><label class="field"
              ><span>Bathrooms</span><input type="number" formControlName="bathrooms" /></label
            ><label class="field"
              ><span>Floor</span><input type="number" formControlName="floor" /></label
            ><label class="field"
              ><span>Area (sq ft)</span><input type="number" formControlName="area" /></label
            ><label class="field"
              ><span>Furnishing</span
              ><select formControlName="furnishingStatus">
                <option value="">Not specified</option>
                <option>Furnished</option>
                <option>Semi-furnished</option>
                <option>Unfurnished</option>
              </select></label
            ><label class="field"><span>Storage</span><input formControlName="storage" /></label>
          </div>
        </section>
        <section>
          <h2>Amenities</h2>
          <label class="field"
            ><span>Comma-separated amenities</span
            ><input formControlName="amenitiesText" placeholder="Parking, Security, Balcony"
          /></label>
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
          <section class="panel lifecycle">
            <h2>Lifecycle</h2>
            <p>Occupied status can only be set with complete tenant details.</p>
            @if (p.status === 'available' || p.status === 'booked') {
              <form [formGroup]="tenantForm" (ngSubmit)="assignTenant()">
                <label class="field"
                  ><span>Tenant full name</span><input formControlName="fullName" /></label
                ><label class="field"
                  ><span>Phone</span><input formControlName="phoneNumber" /></label
                ><label class="field"
                  ><span>Email</span><input type="email" formControlName="email" /></label
                ><label class="field"
                  ><span>Start date</span><input type="date" formControlName="startDate" /></label
                ><label class="field"
                  ><span>Monthly rent</span
                  ><input type="number" formControlName="monthlyRent" /></label
                ><label class="field"
                  ><span>Security deposit</span
                  ><input type="number" formControlName="securityDeposit" /></label
                ><label class="field"
                  ><span>Notes</span><textarea rows="3" formControlName="notes"></textarea></label
                ><button class="btn btn-primary" [disabled]="tenantForm.invalid || saving()">
                  Finalize tenancy
                </button>
              </form>
            } @else if (p.status === 'owned') {
              <div class="occupied">
                <b>Active tenant linked</b>
                <p>Use the Evict action from the property table to end this tenancy safely.</p>
              </div>
            } @else {
              <p>Make the property available before assigning a tenant.</p>
            }
          </section>
          <section class="panel summary">
            <h2>At a glance</h2>
            <dl>
              <div>
                <dt>Rent</dt>
                <dd>{{ p.rent | currency: 'USD' : 'symbol' : '1.0-0' }}</dd>
              </div>
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
      .lifecycle h2,
      .summary h2 {
        font-size: 1.15rem;
      }
      .fields {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      .wide {
        grid-column: 1/-1;
      }
      .checks {
        display: flex;
        gap: 30px;
      }
      .checks label {
        display: flex;
        gap: 8px;
      }
      .lifecycle,
      .summary {
        padding: 22px;
        margin-bottom: 20px;
      }
      .lifecycle > p {
        font-size: 0.8rem;
        color: var(--muted);
      }
      .lifecycle form {
        display: grid;
        gap: 12px;
      }
      .occupied {
        padding: 16px;
        background: var(--forest-light);
        border-radius: 12px;
      }
      .occupied p {
        margin: 5px 0 0;
        font-size: 0.8rem;
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
  private destroy = inject(DestroyRef);
  readonly id = signal<string | null>(null);
  readonly property = signal<Property | null>(null);
  readonly blocks = signal<Block[]>([]);
  readonly images = signal<string[]>([]);
  readonly saving = signal(false);
  readonly types = PROPERTY_TYPES;
  readonly form = new FormGroup({
    propertyId: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    blockId: new FormControl('', { nonNullable: true, validators: Validators.required }),
    propertyName: new FormControl('', { nonNullable: true, validators: Validators.required }),
    description: new FormControl(''),
    type: new FormControl<PropertyType>('apartment', { nonNullable: true }),
    storage: new FormControl(''),
    rent: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    securityDeposit: new FormControl<number | null>(null, Validators.min(0)),
    bedrooms: new FormControl<number | null>(null, Validators.min(0)),
    bathrooms: new FormControl<number | null>(null, Validators.min(0)),
    floor: new FormControl<number | null>(null),
    area: new FormControl<number | null>(null, Validators.min(0)),
    furnishingStatus: new FormControl(''),
    amenitiesText: new FormControl(''),
    isFeatured: new FormControl(false, { nonNullable: true }),
    isActive: new FormControl(true, { nonNullable: true }),
  });
  readonly tenantForm = new FormGroup({
    fullName: new FormControl('', { nonNullable: true, validators: Validators.required }),
    phoneNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[+0-9()\-\s]{7,24}$/)],
    }),
    email: new FormControl('', { nonNullable: true, validators: Validators.email }),
    startDate: new FormControl(new Date().toISOString().slice(0, 10), {
      nonNullable: true,
      validators: Validators.required,
    }),
    monthlyRent: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    securityDeposit: new FormControl<number | null>(null),
    notes: new FormControl('', { nonNullable: true }),
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
          this.form.patchValue({ ...p, amenitiesText: p.amenities.join(', ') });
          this.tenantForm.patchValue({
            monthlyRent: p.rent,
            securityDeposit: p.securityDeposit ?? null,
          });
        });
    });
  }
  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const body: UpsertPropertyRequest = {
      ...raw,
      propertyId: raw.propertyId!,
      rent: raw.rent!,
      description: raw.description || null,
      storage: raw.storage || null,
      securityDeposit: raw.securityDeposit,
      bedrooms: raw.bedrooms,
      bathrooms: raw.bathrooms,
      floor: raw.floor,
      area: raw.area,
      furnishingStatus: raw.furnishingStatus || null,
      amenities: (raw.amenitiesText || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      images: this.images(),
    };
    const request = this.id() ? this.service.update(this.id()!, body) : this.service.create(body);
    request.subscribe({
      next: (p) => {
        this.saving.set(false);
        this.router.navigate(['/dashboard/properties', p.id, 'edit']);
      },
      error: () => this.saving.set(false),
    });
  }
  assignTenant() {
    if (this.tenantForm.invalid || !this.id()) return;
    this.saving.set(true);
    const raw = this.tenantForm.getRawValue();
    const body: AssignTenantRequest = {
      ...raw,
      monthlyRent: raw.monthlyRent!,
      email: raw.email || undefined,
      securityDeposit: raw.securityDeposit ?? undefined,
      notes: raw.notes || undefined,
    };
    this.service.assignTenant(this.id()!, body).subscribe({
      next: (p) => {
        this.property.set(p);
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }
}
