import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { PropertyService } from '../../core/services/property.service';
import { PropertyCardComponent } from '../../shared/components/property-card/property-card.component';

@Component({
  selector: 'app-home',
  imports: [RouterLink, PropertyCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero">
      <div class="container hero-grid">
        <div class="hero-copy">
          <p class="eyebrow">Property, thoughtfully managed</p>
          <h1>A better place begins with better care.</h1>
          <p class="intro">
            Distinctive homes, clear guidance, and a management team that stays present long after
            the keys change hands.
          </p>
          <div class="actions">
            <a routerLink="/properties" class="btn btn-primary">Browse properties</a
            ><a routerLink="/about" class="btn btn-secondary">Meet our team</a>
          </div>
          <div class="trust">
            <span><b>12+</b> years of local care</span><span><b>96%</b> enquiry response rate</span
            ><span><b>4.9</b> resident rating</span>
          </div>
        </div>
        <div class="hero-image">
          <img
            src="https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1500&q=86"
            alt="Refined, light-filled living room"
          />
          <div class="note">
            <span>Now available</span><strong>Riverside Collection</strong
            ><a routerLink="/properties">View homes →</a>
          </div>
        </div>
      </div>
    </section>
    <section class="section featured">
      <div class="container">
        <div class="heading-row">
          <div class="section-heading">
            <p class="eyebrow">Selected residences</p>
            <h2>Homes that make room for life.</h2>
          </div>
          <a routerLink="/properties">View every property →</a>
        </div>
        <div class="grid">
          @for (property of featured(); track property.id) {
            <app-property-card [property]="property" />
          } @empty {
            @for (item of skeletons; track item) {
              <div class="skeleton"></div>
            }
          }
        </div>
      </div>
    </section>
    <section class="section highlights">
      <div class="container highlight-grid">
        <div>
          <p class="eyebrow">A considered approach</p>
          <h2>Calm guidance at every turn.</h2>
          <p>
            We combine local judgement with attentive service, so property decisions feel clearer
            and homes are cared for consistently.
          </p>
        </div>
        <div class="benefits">
          <article>
            <span>01</span>
            <div>
              <h3>Curated, never crowded</h3>
              <p>
                Every available home is checked, accurately presented, and ready for a genuine
                conversation.
              </p>
            </div>
          </article>
          <article>
            <span>02</span>
            <div>
              <h3>People who stay accountable</h3>
              <p>
                A dedicated estate team manages the details from first enquiry through the complete
                tenancy.
              </p>
            </div>
          </article>
          <article>
            <span>03</span>
            <div>
              <h3>Clear by design</h3>
              <p>Transparent status, pricing, and next steps help you move with confidence.</p>
            </div>
          </article>
        </div>
      </div>
    </section>
    <section class="section process">
      <div class="container">
        <div class="section-heading">
          <p class="eyebrow">Simple from the start</p>
          <h2>Your next home, in three clear steps.</h2>
        </div>
        <div class="steps">
          <article>
            <b>01</b>
            <h3>Explore</h3>
            <p>Browse verified, currently available properties and filter around what matters.</p>
          </article>
          <article>
            <b>02</b>
            <h3>Connect</h3>
            <p>Send an enquiry and our team will arrange the right conversation or viewing.</p>
          </article>
          <article>
            <b>03</b>
            <h3>Settle in</h3>
            <p>We handle the handover carefully and remain available throughout your tenancy.</p>
          </article>
        </div>
      </div>
    </section>
    <section class="cta">
      <div class="container">
        <p class="eyebrow">Begin your search</p>
        <h2>There is more to a home than an address.</h2>
        <a routerLink="/properties" class="btn">Find yours</a>
      </div>
    </section>
  `,
  styles: [
    `
      .hero {
        padding: 44px 0 82px;
        background: linear-gradient(120deg, #f7f5f0 58%, #ecebe4 58%);
      }
      .hero-grid {
        display: grid;
        grid-template-columns: 1.02fr 0.98fr;
        align-items: center;
        gap: 52px;
      }
      .hero-copy {
        padding: 42px 0;
      }
      .hero h1 {
        max-width: 690px;
        margin: 18px 0 26px;
      }
      .intro {
        max-width: 590px;
        color: var(--muted);
        font-size: 1.08rem;
      }
      .actions {
        display: flex;
        gap: 12px;
        margin: 34px 0 52px;
      }
      .trust {
        display: flex;
        gap: 28px;
        border-top: 1px solid var(--border);
        padding-top: 24px;
        color: var(--muted);
        font-size: 0.75rem;
      }
      .trust span {
        display: grid;
      }
      .trust b {
        color: var(--ink);
        font-size: 1.1rem;
      }
      .hero-image {
        position: relative;
        height: min(650px, 70vh);
      }
      .hero-image > img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 220px 220px 24px 24px;
      }
      .note {
        position: absolute;
        left: -42px;
        bottom: 30px;
        display: grid;
        gap: 3px;
        background: var(--surface);
        padding: 20px 24px;
        border-radius: 14px;
        box-shadow: var(--shadow-lg);
      }
      .note span {
        font-size: 0.65rem;
        text-transform: uppercase;
        color: var(--bronze);
        letter-spacing: 0.1em;
      }
      .note a {
        font-size: 0.78rem;
        margin-top: 8px;
        font-weight: 700;
      }
      .heading-row {
        display: flex;
        align-items: end;
        justify-content: space-between;
      }
      .heading-row > a {
        margin-bottom: 44px;
        font-weight: 700;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 22px;
      }
      .highlights {
        background: #e7ece7;
      }
      .highlight-grid {
        display: grid;
        grid-template-columns: 0.8fr 1.2fr;
        gap: 90px;
      }
      .highlight-grid > div:first-child p:not(.eyebrow) {
        color: var(--muted);
        font-size: 1.05rem;
      }
      .benefits article {
        display: grid;
        grid-template-columns: 50px 1fr;
        gap: 18px;
        padding: 24px 0;
        border-bottom: 1px solid #cbd4ce;
      }
      .benefits article > span {
        color: var(--bronze);
        font-size: 0.75rem;
      }
      .benefits h3 {
        margin-bottom: 7px;
      }
      .benefits p {
        margin: 0;
        color: var(--muted);
      }
      .steps {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1px;
        background: var(--border);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        overflow: hidden;
      }
      .steps article {
        background: var(--surface);
        padding: 36px;
      }
      .steps b {
        color: var(--bronze);
        font-size: 0.75rem;
      }
      .steps h3 {
        margin-top: 42px;
      }
      .steps p {
        color: var(--muted);
        margin-bottom: 0;
      }
      .cta {
        text-align: center;
        background: #173f38;
        color: #fff;
        padding: 100px 0;
      }
      .cta h2 {
        max-width: 760px;
        margin: 18px auto 30px;
      }
      .cta .btn {
        background: white;
        color: var(--forest);
      }
      @media (max-width: 900px) {
        .hero {
          background: var(--paper);
        }
        .hero-grid {
          grid-template-columns: 1fr;
        }
        .hero-image {
          height: 500px;
        }
        .note {
          left: 14px;
        }
        .grid {
          grid-template-columns: repeat(2, 1fr);
        }
        .highlight-grid {
          grid-template-columns: 1fr;
          gap: 30px;
        }
      }
      @media (max-width: 620px) {
        .hero {
          padding-top: 0;
        }
        .hero-grid {
          gap: 10px;
        }
        .hero-copy {
          padding-top: 42px;
        }
        .hero-image {
          height: 420px;
        }
        .hero-image > img {
          border-radius: 130px 130px 18px 18px;
        }
        .trust {
          gap: 15px;
          overflow-x: auto;
        }
        .grid,
        .steps {
          grid-template-columns: 1fr;
        }
        .heading-row {
          align-items: start;
        }
        .heading-row > a {
          display: none;
        }
        .actions {
          align-items: stretch;
          flex-direction: column;
        }
        .steps article h3 {
          margin-top: 20px;
        }
      }
    `,
  ],
})
export class HomeComponent {
  private properties = inject(PropertyService);
  readonly skeletons = [1, 2, 3];
  readonly featured = toSignal(this.properties.featured().pipe(catchError(() => of([]))), {
    initialValue: [],
  });
}
