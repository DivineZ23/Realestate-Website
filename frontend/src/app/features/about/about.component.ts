import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { SettingsService } from '../../core/services/management.services';
@Component({
  selector: 'app-about',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="about-hero">
      <div class="container">
        <p class="eyebrow">About Imperial Estates</p>
        <h1>Property is personal. Our work should feel that way.</h1>
        <p>
          We are an independent estate and property-management company built around attentiveness,
          sound judgement, and lasting local relationships.
        </p>
      </div>
    </section>
    <section class="section">
      <div class="container story">
        <div>
          <img
            src="/assets/imperial-city-story.webp"
            alt="Imperial Estates city district"
            width="1672"
            height="941"
            loading="lazy"
          />
        </div>
        <article>
          <p class="eyebrow">Our story</p>
          <h2>Care, made consistent.</h2>
          <p>
            Imperial Estates began with a simple observation: finding a home can feel fragmented,
            and managing one can feel distant. We created a more joined-up experience.
          </p>
          <p>
            Today, our agents and managers work as one team—from honest property presentation and
            responsive enquiries to careful handovers and long-term tenancy support.
          </p>
          <blockquote>
            “A well-managed home should give people confidence, not create more work.”
          </blockquote>
        </article>
      </div>
    </section>
    <section class="section values">
      <div class="container">
        <div class="section-heading">
          <p class="eyebrow">What guides us</p>
          <h2>Values you can notice.</h2>
        </div>
        <div class="value-grid">
          <article>
            <span>01</span>
            <h3>Clarity</h3>
            <p>Plain language, accurate status, and no hidden next steps.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Stewardship</h3>
            <p>We look after each property as a long-term asset and a real home.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Responsiveness</h3>
            <p>Questions are acknowledged quickly and owned until resolved.</p>
          </article>
          <article>
            <span>04</span>
            <h3>Respect</h3>
            <p>For owners, residents, colleagues, privacy, and people’s time.</p>
          </article>
        </div>
      </div>
    </section>
    <section class="section team">
      <div class="container">
        <div class="section-heading">
          <p class="eyebrow">The people behind the properties</p>
          <h2>Small team. Shared standard.</h2>
        </div>
        <div class="team-grid">
          @for (member of team(); track member.id) {
            <article>
              <img [src]="member.imageUrl" [alt]="member.name" />
              <div>
                <p>{{ member.title }}</p>
                <h3>{{ member.name }}</h3>
                <span>{{ member.biography }}</span>
              </div>
            </article>
          }
        </div>
      </div>
    </section>
    <section class="contact">
      <div class="container">
        <div>
          <p class="eyebrow">Talk to us</p>
          <h2>Have a property question?</h2>
        </div>
        <div>
          <p>
            Whether you are looking, letting, or considering management support, our team is ready
            to listen.
          </p>
          <a routerLink="/properties" class="btn btn-primary">Browse properties</a>
        </div>
      </div>
    </section>`,
  styles: [
    `
      .about-hero {
        padding: 110px 0;
        background: var(--surface-soft);
      }
      .about-hero h1 {
        max-width: 1000px;
        margin: 20px 0 28px;
      }
      .about-hero p:last-child {
        max-width: 720px;
        font-size: 1.1rem;
        color: var(--muted);
      }
      .story {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 90px;
        align-items: center;
      }
      .story > div {
        height: 620px;
      }
      .story img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 220px 220px 20px 20px;
      }
      .story article > p {
        color: var(--muted);
      }
      blockquote {
        margin: 34px 0 0;
        padding-left: 22px;
        border-left: 3px solid var(--bronze);
        font-family: Georgia, serif;
        font-size: 1.3rem;
      }
      .values {
        background: var(--contrast-surface);
        color: var(--contrast-text);
      }
      .values .eyebrow {
        color: var(--bronze);
      }
      .value-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        border-top: 1px solid var(--contrast-border);
      }
      .value-grid article {
        padding: 32px 28px;
        border-right: 1px solid var(--contrast-border);
      }
      .value-grid span {
        color: var(--bronze);
        font-size: 0.75rem;
      }
      .value-grid h3 {
        margin-top: 55px;
      }
      .value-grid p {
        color: var(--contrast-muted);
      }
      .team-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 22px;
      }
      .team-grid article {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        overflow: hidden;
      }
      .team-grid img {
        width: 100%;
        height: 380px;
        object-fit: cover;
      }
      .team-grid article div {
        padding: 20px;
      }
      .team-grid p {
        color: var(--bronze);
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }
      .team-grid h3 {
        margin-bottom: 10px;
      }
      .team-grid span {
        color: var(--muted);
        font-size: 0.86rem;
      }
      .contact {
        padding: 90px 0;
        background: var(--surface-muted);
      }
      .contact > .container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 80px;
        align-items: end;
      }
      .contact p {
        color: var(--muted);
      }
      @media (max-width: 850px) {
        .story {
          grid-template-columns: 1fr;
          gap: 45px;
        }
        .value-grid {
          grid-template-columns: 1fr 1fr;
        }
        .team-grid {
          grid-template-columns: 1fr 1fr;
        }
        .contact > .container {
          grid-template-columns: 1fr;
          gap: 20px;
        }
      }
      @media (max-width: 600px) {
        .about-hero {
          padding: 70px 0;
        }
        .story > div {
          height: 460px;
        }
        .value-grid,
        .team-grid {
          grid-template-columns: 1fr;
        }
        .value-grid article {
          border-bottom: 1px solid var(--contrast-border);
        }
        .team-grid img {
          height: 360px;
        }
      }
    `,
  ],
})
export class AboutComponent {
  private settings = inject(SettingsService);
  readonly team = toSignal(this.settings.team().pipe(catchError(() => of([]))), {
    initialValue: [],
  });
}
