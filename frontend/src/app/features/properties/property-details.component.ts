import { CurrencyPipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { PublicProperty } from '../../core/models/property.models';
import { EnquiryService } from '../../core/services/management.services';
import { PropertyService } from '../../core/services/property.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PropertyCardComponent } from '../../shared/components/property-card/property-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-property-details',
  imports: [
    CurrencyPipe,
    TitleCasePipe,
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
        <div class="content-grid">
          <article>
            <div class="headline">
              <div>
                <app-status-badge [status]="p.status" />
                <p class="eyebrow">{{ p.blockName }} · Property {{ p.propertyId }}</p>
                <h1>{{ p.propertyName }}</h1>
              </div>
              <p class="price">
                {{ p.rent | currency: 'USD' : 'symbol' : '1.0-0' }}<small> per month</small>
              </p>
            </div>
            <div class="facts">
              <span
                ><b>{{ p.type | titlecase }}</b
                >Type</span
              ><span
                ><b>{{ p.bedrooms ?? '—' }}</b
                >Bedrooms</span
              ><span
                ><b>{{ p.bathrooms ?? '—' }}</b
                >Bathrooms</span
              ><span
                ><b>{{ p.area ?? '—' }}</b
                >Sq ft</span
              >
            </div>
            <section>
              <h2>About this property</h2>
              <p>{{ p.description }}</p>
            </section>
            <section>
              <h2>Details</h2>
              <dl>
                <div>
                  <dt>Furnishing</dt>
                  <dd>{{ p.furnishingStatus || 'Not specified' }}</dd>
                </div>
                <div>
                  <dt>Floor</dt>
                  <dd>{{ p.floor ?? 'Not specified' }}</dd>
                </div>
                <div>
                  <dt>Storage</dt>
                  <dd>{{ p.storage || 'Not specified' }}</dd>
                </div>
                <div>
                  <dt>Security deposit</dt>
                  <dd>
                    {{
                      p.securityDeposit
                        ? (p.securityDeposit | currency: 'USD' : 'symbol' : '1.0-0')
                        : 'Ask our team'
                    }}
                  </dd>
                </div>
              </dl>
            </section>
            <section>
              <h2>Amenities</h2>
              <div class="amenities">
                @for (item of p.amenities; track item) {
                  <span>✓ {{ item }}</span>
                }
              </div>
            </section>
          </article>
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
                  ><input formControlName="phoneNumber" autocomplete="tel" />
                  @if (invalid('phoneNumber')) {
                    <small class="error">Enter a valid phone number.</small>
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
      .gallery {
        display: grid;
        grid-template-columns: 1fr 110px;
        gap: 12px;
      }
      .primary {
        height: min(650px, 65vw);
        overflow: hidden;
        border-radius: var(--radius-lg);
      }
      .primary img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .thumbs {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .thumbs button {
        padding: 0;
        border: 2px solid transparent;
        border-radius: 12px;
        overflow: hidden;
        background: none;
        cursor: pointer;
      }
      .thumbs button.active {
        border-color: var(--forest);
      }
      .thumbs img {
        width: 100%;
        aspect-ratio: 1;
        object-fit: cover;
      }
      .content-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 380px;
        gap: 70px;
        margin-top: 58px;
      }
      .headline {
        display: flex;
        justify-content: space-between;
        gap: 30px;
        border-bottom: 1px solid var(--border);
        padding-bottom: 34px;
      }
      .headline .eyebrow {
        margin: 14px 0 8px;
      }
      .headline h1 {
        font-size: clamp(2.5rem, 5vw, 4.5rem);
        margin: 0;
      }
      .price {
        font-size: 1.55rem;
        font-weight: 750;
        white-space: nowrap;
      }
      .price small {
        display: block;
        color: var(--muted);
        font-size: 0.72rem;
        font-weight: 500;
        text-align: right;
      }
      .facts {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        padding: 26px 0;
        border-bottom: 1px solid var(--border);
      }
      .facts span {
        display: grid;
        color: var(--muted);
        font-size: 0.75rem;
      }
      .facts b {
        color: var(--ink);
        font-size: 1rem;
      }
      article section {
        padding: 34px 0;
        border-bottom: 1px solid var(--border);
      }
      article section h2 {
        font-size: 1.35rem;
      }
      article section p {
        color: var(--muted);
      }
      dl {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin: 0;
      }
      dl div {
        display: flex;
        justify-content: space-between;
        border-bottom: 1px dashed var(--border);
        padding: 8px 0;
      }
      dt {
        color: var(--muted);
      }
      dd {
        margin: 0;
        font-weight: 650;
      }
      .amenities {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .amenities span {
        padding: 9px 12px;
        background: var(--forest-light);
        border-radius: 99px;
        color: var(--forest);
        font-size: 0.8rem;
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
        background: #e9ede8;
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
      @media (max-width: 900px) {
        .content-grid {
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
        .gallery {
          grid-template-columns: 1fr;
        }
        .primary {
          height: 420px;
        }
        .thumbs {
          flex-direction: row;
          overflow-x: auto;
        }
        .thumbs button {
          width: 75px;
          flex: 0 0 auto;
        }
        .headline {
          flex-direction: column;
        }
        .price small {
          text-align: left;
        }
        .facts {
          grid-template-columns: repeat(2, 1fr);
          gap: 18px;
        }
        .related-grid {
          grid-template-columns: 1fr;
        }
        dl {
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
  readonly fallback =
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1400&q=80';
  readonly form = new FormGroup({
    fullName: new FormControl('', [Validators.required, Validators.maxLength(160)]),
    phoneNumber: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[+0-9()\-\s]{7,24}$/),
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
