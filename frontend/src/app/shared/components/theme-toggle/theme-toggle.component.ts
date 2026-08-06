import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="theme-toggle"
      (click)="theme.toggle()"
      [attr.aria-label]="theme.theme() === 'light' ? 'Switch to dark mode' : 'Switch to light mode'"
      [attr.title]="theme.theme() === 'light' ? 'Dark mode' : 'Light mode'"
    >
      @if (theme.theme() === 'light') {
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.4 15.4A8.5 8.5 0 0 1 8.6 3.6 8.5 8.5 0 1 0 20.4 15.4Z" />
        </svg>
      } @else {
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path
            d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
          />
        </svg>
      }
    </button>
  `,
  styles: [
    `
      .theme-toggle {
        display: grid;
        place-items: center;
        width: 40px;
        height: 40px;
        padding: 0;
        border: 1px solid var(--border);
        border-radius: 50%;
        background: var(--surface-strong);
        color: var(--ink);
        cursor: pointer;
        transition:
          color var(--ease),
          background var(--ease),
          border-color var(--ease),
          transform var(--ease);
      }
      .theme-toggle:hover {
        color: var(--bronze);
        border-color: var(--bronze);
        transform: translateY(-1px);
      }
      .theme-toggle:focus-visible {
        outline: 3px solid var(--focus-ring);
        outline-offset: 2px;
      }
      svg {
        width: 19px;
        height: 19px;
        fill: none;
        stroke: currentColor;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-width: 1.8;
      }
    `,
  ],
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);
}
