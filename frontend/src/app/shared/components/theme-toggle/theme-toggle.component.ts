import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideMoon, LucideSun } from '@lucide/angular';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  imports: [LucideMoon, LucideSun],
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
        <svg lucideMoon [size]="19" [strokeWidth]="1.8"></svg>
      } @else {
        <svg lucideSun [size]="19" [strokeWidth]="1.8"></svg>
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
        flex: 0 0 auto;
      }
    `,
  ],
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);
}
