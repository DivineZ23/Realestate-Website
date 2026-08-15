import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideArrowRight } from '@lucide/angular';
import { PublicProperty } from '../../../core/models/property.models';
import {
  propertyTypeCapacity,
  propertyTypeLabel,
} from '../../../core/constants/property-status.constants';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

@Component({
  selector: 'app-property-card',
  imports: [CurrencyPipe, NgOptimizedImage, RouterLink, StatusBadgeComponent, LucideArrowRight],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="card">
      <a
        class="photo"
        [routerLink]="['/properties', property().id]"
        [attr.aria-label]="'View ' + property().propertyName"
      >
        <img
          [ngSrc]="property().images[0] || fallback"
          width="720"
          height="500"
          [alt]="property().propertyName"
        />
        <app-status-badge [status]="property().status" />
      </a>
      <div class="content">
        <div class="top">
          <div>
            <p class="meta">{{ property().blockName }} &middot; {{ typeLabel(property().type) }}</p>
            <h3>{{ property().propertyName }}</h3>
          </div>
          <p class="rent">
            {{ property().rent | currency: 'USD' : 'symbol' : '1.0-0' }}<small>/mo</small>
          </p>
        </div>
        <div class="details">
          <span
            >{{ property().personCapacity ?? typeCapacity(property().type) ?? '—' }}
            {{
              (property().personCapacity ?? typeCapacity(property().type)) === 1
                ? 'person'
                : 'people'
            }}</span
          >
        </div>
        <a class="link" [routerLink]="['/properties', property().id]"
          >Explore property <svg lucideArrowRight></svg
        ></a>
      </div>
    </article>
  `,
  styles: [
    `
      .card {
        overflow: hidden;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        transition:
          transform var(--ease),
          box-shadow var(--ease);
      }
      .card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
      }
      .photo {
        display: block;
        position: relative;
        aspect-ratio: 1.45;
        overflow: hidden;
      }
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 500ms ease;
      }
      .card:hover img {
        transform: scale(1.025);
      }
      .link {
        display: inline-flex;
        align-items: center;
        gap: 7px;
      }
      .link svg {
        width: 16px;
        height: 16px;
        transition: transform var(--ease);
      }
      .link:hover svg {
        transform: translateX(3px);
      }
      app-status-badge {
        position: absolute;
        left: 16px;
        top: 16px;
      }
      .content {
        padding: 18px;
      }
      .top {
        display: flex;
        justify-content: space-between;
        gap: 16px;
      }
      .meta {
        margin: 0 0 6px;
        color: var(--muted);
        font-size: 0.77rem;
        text-transform: uppercase;
        letter-spacing: 0.07em;
      }
      h3 {
        margin: 0;
        font-size: 1.25rem;
      }
      .rent {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 760;
        white-space: nowrap;
      }
      .rent small {
        color: var(--muted);
        font-size: 0.7rem;
        font-weight: 500;
      }
      .details {
        display: flex;
        gap: 18px;
        margin: 18px 0;
        color: var(--muted);
        font-size: 0.82rem;
      }
      .link {
        display: flex;
        justify-content: space-between;
        border-top: 1px solid var(--border);
        padding-top: 16px;
        font-weight: 700;
        font-size: 0.86rem;
      }
    `,
  ],
})
export class PropertyCardComponent {
  readonly property = input.required<PublicProperty>();
  readonly fallback = '/assets/imperial-estate-hero.webp';
  readonly typeLabel = propertyTypeLabel;
  readonly typeCapacity = propertyTypeCapacity;
}
