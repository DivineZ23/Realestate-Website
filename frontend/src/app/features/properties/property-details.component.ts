import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { PHONE_NUMBER_PATTERN, PHONE_NUMBER_PLACEHOLDER } from '../../core/constants/app.constants';
import { PublicProperty } from '../../core/models/property.models';
import { EnquiryService } from '../../core/services/management.services';
import { PropertyService } from '../../core/services/property.service';
import {
  propertyTypeCapacity,
  propertyTypeLabel,
  propertyTypeStorageCapacity,
} from '../../core/constants/property-status.constants';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PropertyCardComponent } from '../../shared/components/property-card/property-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-property-details',
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    RouterLink,
    StatusBadgeComponent,
    PropertyCardComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@if (property(); as p) {
      <section class="container detail">
        <div class="crumb">
          <a routerLink="/properties">Properties</a><span>/</span><span>{{ p.propertyName }}</span>
        </div>
        <header class="listing-header">
          <div class="listing-title">
            <app-status-badge [status]="p.status" />
            <p class="eyebrow">{{ p.blockName }} · Property {{ p.propertyId }}</p>
            <h1>{{ p.propertyName }}</h1>
            @if (p.description) {
              <p class="listing-description">{{ p.description }}</p>
            }
          </div>
          <div class="listing-price">
            <small>Monthly rent</small>
            <strong>
              @if (p.rent > 0) {
                {{ p.rent | currency: 'USD' : 'symbol' : '1.0-0' }}
              } @else {
                Ask our team
              }
            </strong>
          </div>
        </header>

        <div class="listing-layout">
          <main class="listing-main">
            <div class="gallery">
              <div class="primary">
                <img [src]="p.images[activeImage()] || fallback" [alt]="p.propertyName" />
              </div>
              @if (p.images.length > 1) {
                <div class="thumbs">
                  @for (image of p.images; track image; let i = $index) {
                    <button [class.active]="activeImage() === i" (click)="activeImage.set(i)">
                      <img [src]="image" alt="" />
                    </button>
                  }
                </div>
              }
            </div>
            <dl class="property-facts panel">
              <div>
                <dt>Interior structure</dt>
                <dd>{{ typeLabel(p.type) }}</dd>
              </div>
              <div>
                <dt>Person capacity</dt>
                <dd>{{ p.personCapacity ?? typeCapacity(p.type) ?? '—' }}</dd>
              </div>
              <div>
                <dt>Storage capacity</dt>
                <dd>{{ storageLabel(p) }}</dd>
              </div>
              <div>
                <dt>Security deposit</dt>
                <dd>
                  {{
                    p.securityDeposit && p.securityDeposit > 0
                      ? (p.securityDeposit | currency: 'USD' : 'symbol' : '1.0-0')
                      : 'Ask our team'
                  }}
                </dd>
              </div>
            </dl>
          </main>
          <aside class="panel enquiry">
            <p class="eyebrow">Arrange a conversation</p>
            <h2>Interested in this home?</h2>
            <p>Tell us how to reach you. An estate agent will respond shortly.</p>
            @if (submitted()) {
              <div class="success">
                <b>Thank you.</b>
                <p>Your enquiry is with our team. We will be in touch soon.</p>
              </div>
            } @else {
              <form [formGroup]="form" (ngSubmit)="submit(p.id)">
                <label class="field"
                  ><span>Full name</span><input formControlName="fullName" autocomplete="name" />
                  @if (invalid('fullName')) {
                    <small class="error">Your name is required.</small>
                  }</label
                ><label class="field"
                  ><span>Phone number</span
                  ><input
                    formControlName="phoneNumber"
                    autocomplete="tel"
                    inputmode="tel"
                    maxlength="8"
                    [placeholder]="phonePlaceholder"
                  />
                  @if (invalid('phoneNumber')) {
                    <small class="error">Use the format 123-4567.</small>
                  }</label
                ><label class="field"
                  ><span>Email <i>optional</i></span
                  ><input formControlName="email" type="email" autocomplete="email" />
                  @if (invalid('email')) {
                    <small class="error">Enter a valid email.</small>
                  }</label
                ><label class="field"
                  ><span>Message <i>optional</i></span
                  ><textarea rows="4" formControlName="message"></textarea></label
                ><button class="btn btn-primary" [disabled]="form.invalid || submitting()">
                  {{ submitting() ? 'Sending…' : 'Send enquiry' }}
                </button>
              </form>
            }
          </aside>
        </div>
      </section>
      @if (related().length) {
        <section class="section related">
          <div class="container">
            <div class="section-heading">
              <p class="eyebrow">You may also like</p>
              <h2>More available homes.</h2>
            </div>
            <div class="related-grid">
              @for (item of related(); track item.id) {
                <app-property-card [property]="item" />
              }
            </div>
          </div>
        </section>
      }
    } @else if (notFound()) {
      <app-empty-state
        title="Property unavailable"
        message="This property may have been booked or is no longer publicly listed."
        ><a class="btn btn-primary" routerLink="/properties"
          >Browse available properties</a
        ></app-empty-state
      >
    } @else {
      <div class="loading-page">Loading property…</div>
    }`,
  styles: [
    `
      .detail {
        padding: 28px 0 90px;
      }
      .crumb {
        display: flex;
        gap: 9px;
        color: var(--muted);
        font-size: 0.78rem;
        margin: 14px 0 24px;
      }
      .listing-header {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: end;
        gap: 36px;
        margin-bottom: 26px;
        padding-bottom: 26px;
        border-bottom: 1px solid var(--border);
      }
      .listing-title {
        min-width: 0;
      }
      .listing-title .eyebrow {
        margin: 14px 0 7px;
      }
      .listing-title h1 {
        margin: 0;
        font-size: clamp(2.8rem, 5vw, 4.8rem);
        line-height: 0.96;
      }
      .listing-description {
        max-width: 760px;
        margin: 18px 0 0;
        color: var(--muted);
        font-size: 0.95rem;
        line-height: 1.65;
      }
      .listing-price {
        display: grid;
        min-width: 180px;
        padding-left: 30px;
        border-left: 1px solid var(--border);
      }
      .listing-price small {
        color: var(--muted);
        font-size: 0.7rem;
        font-weight: 650;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .listing-price strong {
        margin-top: 5px;
        font-size: 1.65rem;
        line-height: 1.15;
      }
      .listing-layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 380px;
        align-items: start;
        gap: 28px;
      }
      .listing-main,
      .gallery {
        min-width: 0;
      }
      .primary {
        aspect-ratio: 16 / 9;
        max-height: 540px;
        overflow: hidden;
        border-radius: var(--radius-lg);
        background: var(--surface-subtle);
      }
      .primary img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .thumbs {
        display: flex;
        gap: 10px;
        margin-top: 12px;
        padding-bottom: 2px;
        overflow-x: auto;
      }
      .thumbs button {
        flex: 0 0 88px;
        width: 88px;
        padding: 0;
        border: 2px solid transparent;
        border-radius: 10px;
        overflow: hidden;
        background: none;
        cursor: pointer;
      }
      .thumbs button.active {
        border-color: var(--forest);
      }
      .thumbs img {
        display: block;
        width: 100%;
        aspect-ratio: 4 / 3;
        object-fit: cover;
      }
      .property-facts {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 0;
        margin: 16px 0 0;
        padding: 0;
        overflow: hidden;
      }
      .property-facts div {
        display: grid;
        align-content: center;
        min-width: 0;
        min-height: 82px;
        padding: 16px 18px;
        border-right: 1px solid var(--border);
      }
      .property-facts div:last-child {
        border-right: 0;
      }
      .property-facts dt {
        color: var(--muted);
        font-size: 0.67rem;
      }
      .property-facts dd {
        margin: 5px 0 0;
        overflow-wrap: anywhere;
        font-size: 0.9rem;
        font-weight: 700;
      }
      .enquiry {
        height: max-content;
        padding: 30px;
        position: sticky;
        top: 110px;
      }
      .enquiry h2 {
        font-size: 2rem;
      }
      .enquiry > p:not(.eyebrow) {
        color: var(--muted);
      }
      form {
        display: grid;
        gap: 16px;
        margin-top: 24px;
      }
      .field i {
        font-style: normal;
        color: var(--muted);
        font-weight: 400;
      }
      .success {
        padding: 20px;
        background: var(--forest-light);
        border-radius: 12px;
        color: var(--forest);
      }
      .success p {
        margin: 5px 0 0;
      }
      .related {
        background: var(--surface-soft);
      }
      .related-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 22px;
      }
      .loading-page {
        height: 60vh;
        display: grid;
        place-items: center;
        color: var(--muted);
      }
      @media (max-width: 1100px) {
        .listing-layout {
          grid-template-columns: minmax(0, 1fr) 340px;
        }
        .property-facts {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .property-facts div:nth-child(2) {
          border-right: 0;
        }
        .property-facts div:nth-child(-n + 2) {
          border-bottom: 1px solid var(--border);
        }
      }
      @media (max-width: 900px) {
        .listing-layout {
          grid-template-columns: 1fr;
          gap: 40px;
        }
        .enquiry {
          position: static;
        }
        .related-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      @media (max-width: 620px) {
        .listing-header {
          grid-template-columns: 1fr;
          align-items: start;
          gap: 20px;
        }
        .listing-price {
          padding: 0;
          border-left: 0;
        }
        .listing-title h1 {
          font-size: 2.65rem;
        }
        .primary {
          aspect-ratio: 4 / 3;
          max-height: none;
        }
        .property-facts {
          grid-template-columns: 1fr;
        }
        .property-facts div,
        .property-facts div:nth-child(2) {
          border-right: 0;
          border-bottom: 1px solid var(--border);
        }
        .property-facts div:last-child {
          border-bottom: 0;
        }
        .related-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class PropertyDetailsComponent {
  private route = inject(ActivatedRoute);
  private properties = inject(PropertyService);
  private enquiries = inject(EnquiryService);
  private destroy = inject(DestroyRef);
  readonly property = signal<PublicProperty | null>(null);
  readonly related = signal<PublicProperty[]>([]);
  readonly activeImage = signal(0);
  readonly notFound = signal(false);
  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly typeLabel = propertyTypeLabel;
  readonly typeCapacity = propertyTypeCapacity;
  readonly phonePlaceholder = PHONE_NUMBER_PLACEHOLDER;
  readonly fallback = '/assets/imperial-estate-hero.webp';
  readonly form = new FormGroup({
    fullName: new FormControl('', [Validators.required, Validators.maxLength(160)]),
    phoneNumber: new FormControl('', [
      Validators.required,
      Validators.pattern(PHONE_NUMBER_PATTERN),
    ]),
    email: new FormControl('', Validators.email),
    message: new FormControl(''),
  });
  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => this.properties.publicDetails(params.get('id')!)),
        catchError(() => {
          this.notFound.set(true);
          return of(null);
        }),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe((value) => {
        this.property.set(value);
        if (value)
          this.properties
            .available({ pageSize: 4, blockId: value.blockId })
            .subscribe((r) =>
              this.related.set(r.items.filter((x) => x.id !== value.id).slice(0, 3)),
            );
      });
  }
  invalid(name: keyof typeof this.form.controls) {
    const c = this.form.controls[name];
    return c.invalid && (c.dirty || c.touched);
  }
  storageLabel(property: PublicProperty): string {
    const capacity = property.storageCapacity ?? propertyTypeStorageCapacity(property.type);
    return capacity ? `${capacity.toLocaleString()} units` : 'Ask our team';
  }
  submit(propertyId: string) {
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.enquiries
      .create({
        propertyId,
        ...this.form.getRawValue(),
        email: this.form.value.email || undefined,
        message: this.form.value.message || undefined,
      } as never)
      .subscribe({
        next: () => {
          this.submitted.set(true);
          this.submitting.set(false);
        },
        error: () => this.submitting.set(false),
      });
  }
}
