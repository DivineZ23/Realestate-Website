import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideMoon, LucideSun, LucideSunMedium } from '@lucide/angular';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  imports: [LucideMoon, LucideSun, LucideSunMedium],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="theme-switcher" aria-label="Website theme">
      <button type="button" [class.active]="theme.theme() === 'light'" (click)="theme.setTheme('light')" aria-label="Use light theme" title="Light"><svg lucideSun [size]="16"></svg></button>
      <button type="button" [class.active]="theme.theme() === 'dark'" (click)="theme.setTheme('dark')" aria-label="Use dark theme" title="Dark"><svg lucideMoon [size]="16"></svg></button>
      <button type="button" [class.active]="theme.theme() === 'graphite'" (click)="theme.setTheme('graphite')" aria-label="Use graphite theme" title="Graphite"><svg lucideSunMedium [size]="16"></svg></button>
    </div>
  `,
  styles: [
    `
      .theme-switcher { display: flex; align-items: center; gap: 2px; padding: 3px; border: 1px solid var(--border); border-radius: 9px; background: var(--surface-soft); }
      .theme-switcher button {
        display: grid; place-items: center; width: 29px; height: 29px; padding: 0;
        border: 0; border-radius: 6px; background: transparent; color: var(--muted); cursor: pointer;
      }
      .theme-switcher button:hover { color: var(--ink); }
      .theme-switcher button.active {
        color: var(--forest); background: var(--surface-strong); box-shadow: var(--shadow-sm);
      }
      .theme-switcher button:focus-visible {
        outline: 2px solid var(--focus-ring); outline-offset: 1px;
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
