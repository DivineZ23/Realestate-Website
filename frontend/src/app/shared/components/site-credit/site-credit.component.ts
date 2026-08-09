import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-site-credit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<footer aria-label="Website credits">
    <span>Designed &amp; Built by</span>
    <strong>DIVINE</strong>
    <span>&amp;</span>
    <strong>MAYANK</strong>
    <span class="separator">&bull;</span>
    <span>IMPERIAL ESTATES</span>
  </footer>`,
  styles: [
    `
      :host {
        display: block;
      }
      footer {
        min-height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        padding: 9px 20px;
        border-top: 1px solid var(--border);
        background: var(--surface);
        color: var(--muted);
        font-size: 0.72rem;
        letter-spacing: 0.025em;
        text-align: center;
      }
      strong {
        color: var(--bronze);
        font-size: inherit;
        font-weight: 800;
        letter-spacing: 0.07em;
      }
      .separator {
        margin-inline: 3px;
        color: var(--border);
      }
    `,
  ],
})
export class SiteCreditComponent {}
