import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideSave } from '@lucide/angular';
import { switchMap } from 'rxjs';
import {
  isSupportedPropertyType,
  PROPERTY_TYPE_OPTIONS,
  propertyTypeCapacity,
} from '../../core/constants/property-status.constants';
import {
  Block,
  AssignTenantRequest,
  Property,
  PropertyType,
  UpsertPropertyRequest,
} from '../../core/models/property.models';
import { BlockService } from '../../core/services/management.services';
import { PropertyService } from '../../core/services/property.service';
import { ImageUploaderComponent } from '../../shared/components/image-uploader/image-uploader.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { depositAtLeastRentValidator } from '../../core/validators/financial.validators';

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
      <button
        class="btn btn-primary"
        (click)="save()"
        [disabled]="form.invalid || (hasTenant() && tenantForm.invalid) || saving()"
      >
        <svg lucideSave></svg>{{ saving() ? 'Saving…' : 'Save property' }}
      </button>
    </div>
    <div class="editor-grid">
      <div class="panel form">
        <section [formGroup]="form">
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
            >
            @if (!hasTenant()) {
              <label class="field"
                ><span>Monthly rent <small>Optional</small></span
                ><input type="number" min="0" formControlName="rent" placeholder="Ask our team" />
                <small class="field-note"
                  >Leave empty or enter 0 to show “Ask our team”.</small
                ></label
              ><label class="field">
                <span>Security deposit <small>Optional</small></span>
                <input
                  type="number"
                  [min]="form.controls.rent.value ?? 0"
                  formControlName="securityDeposit"
                  placeholder="Ask our team"
                />
                <small class="field-note"
                  >Leave empty to show “Ask our team”. If entered, it must be at least the monthly
                  rent.</small
                >
                @if (
                  form.hasError('depositBelowRent') &&
                  (form.controls.securityDeposit.dirty || form.controls.securityDeposit.touched)
                ) {
                  <small class="error">Deposit cannot be lower than the monthly rent.</small>
                }
              </label>
            }
            <label class="field wide"
              ><span>Description</span><textarea rows="5" formControlName="description"></textarea>
            </label>
          </div>
        </section>
        @if (hasTenant()) {
          <section [formGroup]="tenantForm" class="tenant-section">
            <div class="section-heading">
              <div>
                <p class="eyebrow">Active tenancy</p>
                <h2>Tenant information</h2>
                <p>Update the resident details attached to this property.</p>
              </div>
              @if (property()?.rentPaidThrough; as paidThrough) {
                <div class="sync-value">
                  <span>Rent paid through</span>
                  <strong>{{ paidThrough | date: 'mediumDate' }}</strong>
                  <small>Managed by Data Sync</small>
                </div>
              }
            </div>
            <div class="fields">
              <label class="field"
                ><span>CID</span><input type="number" min="1" formControlName="cid"
              /></label>
              <label class="field"
                ><span>Tenant full name</span><input formControlName="fullName"
              /></label>
              <label class="field"
                ><span>Phone number</span
                ><input formControlName="phoneNumber" inputmode="numeric" placeholder="123-4567" />
                @if (
                  tenantForm.controls.phoneNumber.invalid && tenantForm.controls.phoneNumber.touched
                ) {
                  <small class="error">Use the format 123-4567.</small>
                }
              </label>
              <label class="field"
                ><span>Discord ID</span
                ><input formControlName="discordId" inputmode="numeric" autocomplete="off" />
                @if (tenantForm.controls.discordId.invalid && tenantForm.controls.discordId.touched) {
                  <small class="error">Enter a numeric Discord ID.</small>
                }
              </label>
              <label class="field"
                ><span>Monthly rent</span
                ><input type="number" min="0" formControlName="monthlyRent"
              /></label>
              <label class="field">
                <span>Security deposit</span>
                <input
                  type="number"
                  [min]="tenantForm.controls.monthlyRent.value ?? 0"
                  formControlName="securityDeposit"
                />
                @if (
                  tenantForm.hasError('depositBelowRent') &&
                  (tenantForm.controls.securityDeposit.dirty ||
                    tenantForm.controls.securityDeposit.touched)
                ) {
                  <small class="error">Deposit cannot be lower than the monthly rent.</small>
                }
              </label>
              <label class="field"
                ><span>Tenancy start date</span><input type="date" formControlName="startDate"
              /></label>
              <label class="field"
                ><span>Expected end date <small>Optional</small></span
                ><input type="date" formControlName="expectedEndDate"
              /></label>
              <label class="field wide"
                ><span>Emergency contact <small>Optional</small></span
                ><input formControlName="emergencyContact"
              /></label>
              <label class="field wide"
                ><span>Notes <small>Optional</small></span
                ><textarea rows="4" formControlName="notes"></textarea>
              </label>
            </div>
          </section>
        }
        <section>
          <h2>Property images</h2>
          <app-image-uploader [images]="images()" (imagesChange)="images.set($event)" />
        </section>
        <section class="checks" [formGroup]="form">
          <label><input type="checkbox" formControlName="isFeatured" /> Feature publicly</label
          ><label><input type="checkbox" formControlName="isActive" /> Active property</label>
          <label class="booking-setting">
            <input type="checkbox" formControlName="allowOccupiedBookings" />
            <span>
              Allow bookings while occupied
              <small>Show the Book action even while this property has an active tenant.</small>
            </span>
          </label>
        </section>
      </div>
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
        align-items: center;
        gap: 20px;
        width: calc(100% - 360px);
        margin-bottom: 24px;
      }
      .page-title .btn {
        flex: 0 0 auto;
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
      .section-heading {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 18px;
      }
      .section-heading h2 {
        margin: 3px 0 5px;
      }
      .section-heading > div > p:last-child {
        margin: 0;
        color: var(--muted);
        font-size: 0.82rem;
      }
      .sync-value {
        flex: 0 0 auto;
        min-width: 160px;
        padding: 11px 13px;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--surface-soft);
        display: grid;
        gap: 2px;
      }
      .sync-value span,
      .sync-value small {
        color: var(--muted);
        font-size: 0.68rem;
      }
      .sync-value strong {
        font-size: 0.84rem;
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
      .field > span small,
      .field-note {
        color: var(--muted);
        font-size: 0.68rem;
        font-weight: 500;
      }
      .checks {
        display: flex;
        flex-wrap: wrap;
        gap: 30px;
      }
      .checks label {
        display: flex;
        gap: 8px;
      }
      .booking-setting {
        flex: 1 1 100%;
        align-items: flex-start;
      }
      .booking-setting span {
        display: grid;
        gap: 3px;
      }
      .booking-setting small {
        color: var(--muted);
        font-size: 0.7rem;
        font-weight: 500;
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
        .page-title {
          width: 100%;
        }
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
        .section-heading {
          display: grid;
        }
        .sync-value {
          width: 100%;
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
  readonly hasTenant = computed(() => Boolean(this.property()?.currentTenantId));
  readonly types = PROPERTY_TYPE_OPTIONS;
  readonly capacity = propertyTypeCapacity;
  readonly form = new FormGroup(
    {
      propertyId: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
      blockId: new FormControl('', { nonNullable: true, validators: Validators.required }),
      propertyName: new FormControl('', { nonNullable: true, validators: Validators.required }),
      description: new FormControl(''),
      type: new FormControl<PropertyType>('motel', { nonNullable: true }),
      rent: new FormControl<number | null>(null, Validators.min(0)),
      securityDeposit: new FormControl<number | null>(null, Validators.min(0)),
      isFeatured: new FormControl(false, { nonNullable: true }),
      isActive: new FormControl(true, { nonNullable: true }),
      allowOccupiedBookings: new FormControl(false, { nonNullable: true }),
    },
    { validators: depositAtLeastRentValidator() },
  );
  readonly tenantForm = new FormGroup(
    {
      cid: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
      fullName: new FormControl('', { nonNullable: true, validators: Validators.required }),
      phoneNumber: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(/^\d{3}-\d{4}$/)],
      }),
      discordId: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(/^\d+$/), Validators.maxLength(32)],
      }),
      monthlyRent: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
      securityDeposit: new FormControl<number | null>(null, [
        Validators.required,
        Validators.min(0),
      ]),
      startDate: new FormControl('', { nonNullable: true, validators: Validators.required }),
      expectedEndDate: new FormControl('', { nonNullable: true }),
      emergencyContact: new FormControl('', { nonNullable: true }),
      notes: new FormControl('', { nonNullable: true }),
    },
    { validators: depositAtLeastRentValidator('monthlyRent', 'securityDeposit') },
  );
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
          if (p.currentTenantId) {
            this.tenantForm.patchValue({
              cid: p.tenantCid ?? null,
              fullName: p.tenantName ?? '',
              phoneNumber: p.tenantPhoneNumber ?? '',
              discordId: p.tenantDiscordId ?? '',
              monthlyRent: p.tenantMonthlyRent ?? p.rent,
              securityDeposit: p.tenantSecurityDeposit ?? p.securityDeposit ?? null,
              startDate: this.dateInputValue(p.tenantStartDate),
              expectedEndDate: this.dateInputValue(p.tenantExpectedEndDate),
              emergencyContact: p.tenantEmergencyContact ?? '',
              notes: p.tenantNotes ?? '',
            });
          }
        });
    });
  }
  save() {
    if (this.form.invalid || (this.hasTenant() && this.tenantForm.invalid)) {
      this.form.markAllAsTouched();
      this.tenantForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const existing = this.property();
    const tenantRaw = this.tenantForm.getRawValue();
    const body: UpsertPropertyRequest = {
      propertyId: raw.propertyId!,
      blockId: raw.blockId,
      propertyName: raw.propertyName,
      description: raw.description || null,
      type: raw.type,
      storage: existing?.storage ?? null,
      rent: this.hasTenant() ? tenantRaw.monthlyRent! : (raw.rent ?? 0),
      securityDeposit: this.hasTenant()
        ? tenantRaw.securityDeposit!
        : (raw.securityDeposit ?? null),
      bedrooms: existing?.bedrooms ?? null,
      bathrooms: existing?.bathrooms ?? null,
      floor: existing?.floor ?? null,
      area: existing?.area ?? null,
      furnishingStatus: existing?.furnishingStatus ?? null,
      amenities: existing?.amenities ?? [],
      images: this.images(),
      isFeatured: raw.isFeatured,
      isActive: raw.isActive,
      allowOccupiedBookings: raw.allowOccupiedBookings,
    };
    const isEditing = Boolean(this.id());
    let request = isEditing ? this.service.update(this.id()!, body) : this.service.create(body);
    if (isEditing && this.hasTenant()) {
      const tenantRequest: AssignTenantRequest = {
        cid: tenantRaw.cid!,
        fullName: tenantRaw.fullName,
        phoneNumber: tenantRaw.phoneNumber,
        discordId: tenantRaw.discordId,
        monthlyRent: tenantRaw.monthlyRent!,
        securityDeposit: tenantRaw.securityDeposit!,
        startDate: tenantRaw.startDate,
        expectedEndDate: tenantRaw.expectedEndDate || undefined,
        emergencyContact: tenantRaw.emergencyContact || undefined,
        notes: tenantRaw.notes || undefined,
      };
      request = request.pipe(
        switchMap(() => this.service.updateTenant(this.id()!, tenantRequest)),
      );
    }
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

  private dateInputValue(value?: string): string {
    return value ? value.slice(0, 10) : '';
  }
}
