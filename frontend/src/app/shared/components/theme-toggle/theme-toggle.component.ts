import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  signal,
} from '@angular/core';
import { LucideCheck, LucideMoon, LucidePalette, LucideSun } from '@lucide/angular';
import { THEME_PALETTES, ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  imports: [LucideCheck, LucideMoon, LucidePalette, LucideSun],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="theme-picker" [class.inline-picker]="inline()">
      @if (!inline()) {
        <button
          class="picker-trigger"
          type="button"
          (click)="togglePicker($event)"
          [attr.aria-expanded]="open()"
          aria-haspopup="dialog"
          aria-label="Choose website theme"
          title="Appearance"
        >
          <svg lucidePalette [size]="17"></svg>
          <span class="active-dot" aria-hidden="true"></span>
        </button>
      }

      @if (inline() || open()) {
        <section
          class="appearance-card"
          [class.popover]="!inline()"
          aria-label="Appearance settings"
        >
          <header>
            <div>
              <strong>Appearance</strong>
              <small>Choose palette & mode</small>
            </div>
            <div class="mode-switch" aria-label="Color mode">
              <button
                type="button"
                [class.active]="theme.mode() === 'light'"
                (click)="theme.setMode('light')"
              >
                <svg lucideSun></svg>Light
              </button>
              <button
                type="button"
                [class.active]="theme.mode() === 'dark'"
                (click)="theme.setMode('dark')"
              >
                <svg lucideMoon></svg>Dark
              </button>
            </div>
          </header>

          <div class="palette-grid" aria-label="Color palette">
            @for (palette of palettes; track palette.id) {
              <button
                type="button"
                class="palette-option"
                [class.active]="theme.palette() === palette.id"
                (click)="theme.setPalette(palette.id)"
                [attr.aria-label]="'Use ' + palette.label + ' palette'"
              >
                <span class="swatch" [class]="'swatch ' + palette.id">
                  @if (theme.palette() === palette.id) {
                    <svg lucideCheck></svg>
                  }
                </span>
                <b>{{ palette.label }}</b>
              </button>
            }
          </div>

          <footer>
            <span>Active</span><strong>{{ theme.activeLabel() }}</strong>
          </footer>
        </section>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .theme-picker {
        position: relative;
      }
      .picker-trigger {
        position: relative;
        display: grid;
        place-items: center;
        width: 36px;
        height: 36px;
        padding: 0;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--surface-strong);
        color: var(--muted);
        box-shadow: var(--shadow-sm);
        cursor: pointer;
      }
      .picker-trigger:hover,
      .picker-trigger[aria-expanded='true'] {
        color: var(--forest);
        border-color: var(--forest);
      }
      .active-dot {
        position: absolute;
        right: 5px;
        bottom: 5px;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--forest);
        box-shadow: 0 0 0 2px var(--surface-strong);
      }
      .appearance-card {
        width: min(100%, 390px);
        padding: 16px;
        border: 1px solid var(--border);
        border-radius: 16px;
        background: var(--surface);
        color: var(--ink);
        box-shadow: var(--shadow-lg);
      }
      .appearance-card.popover {
        position: absolute;
        z-index: 100;
        top: calc(100% + 10px);
        right: 0;
        width: 360px;
        animation: reveal 140ms ease-out;
      }
      .appearance-card header {
        display: grid;
        gap: 14px;
      }
      .appearance-card header > div:first-child {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .appearance-card header strong {
        font-size: 0.86rem;
      }
      .appearance-card header small,
      footer span {
        color: var(--muted);
        font-size: 0.7rem;
      }
      .mode-switch {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      .mode-switch button {
        min-height: 40px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--surface-subtle);
        color: var(--muted);
        font-size: 0.78rem;
        font-weight: 700;
        cursor: pointer;
      }
      .mode-switch button:hover {
        color: var(--ink);
        border-color: var(--drop-border);
      }
      .mode-switch button.active {
        color: var(--forest);
        border-color: var(--forest);
        background: var(--forest-light);
      }
      .mode-switch svg {
        width: 15px;
        height: 15px;
      }
      .palette-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 9px;
        margin-top: 13px;
      }
      .palette-option {
        min-height: 82px;
        display: grid;
        place-items: center;
        align-content: center;
        gap: 7px;
        padding: 9px;
        border: 1px solid var(--border);
        border-radius: 12px;
        background: var(--surface-subtle);
        color: var(--muted);
        cursor: pointer;
      }
      .palette-option:hover {
        border-color: var(--drop-border);
        color: var(--ink);
        transform: translateY(-1px);
      }
      .palette-option.active {
        border-color: var(--forest);
        color: var(--ink);
        background: var(--forest-light);
      }
      .palette-option b {
        font-size: 0.69rem;
      }
      .swatch {
        position: relative;
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 10px;
        overflow: hidden;
        color: white;
        background: linear-gradient(
          135deg,
          var(--swatch-primary) 0 50%,
          var(--swatch-secondary) 50% 100%
        );
        box-shadow: 0 5px 12px rgba(0, 0, 0, 0.16);
      }
      .swatch svg {
        position: relative;
        z-index: 1;
        width: 15px;
        height: 15px;
        stroke-width: 3;
      }
      .swatch.imperial {
        --swatch-primary: #f4b000;
        --swatch-secondary: #17130a;
      }
      .swatch.ocean {
        --swatch-primary: #1685e5;
        --swatch-secondary: #071729;
      }
      .swatch.emerald {
        --swatch-primary: #10b981;
        --swatch-secondary: #072219;
      }
      .swatch.violet {
        --swatch-primary: #744ee8;
        --swatch-secondary: #18102c;
      }
      .swatch.ruby {
        --swatch-primary: #dc315c;
        --swatch-secondary: #2a0d16;
      }
      footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--border);
        font-size: 0.7rem;
      }
      footer strong {
        color: var(--forest);
      }
      .inline-picker .appearance-card {
        width: 100%;
        box-shadow: none;
      }
      @keyframes reveal {
        from {
          opacity: 0;
          transform: translateY(-5px) scale(0.985);
        }
      }
      @media (max-width: 520px) {
        .appearance-card.popover {
          position: fixed;
          top: 66px;
          left: 12px;
          right: 12px;
          width: auto;
        }
      }
    `,
  ],
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);
  readonly inline = input(false);
  readonly open = signal(false);
  readonly palettes = THEME_PALETTES;
  private readonly host = inject(ElementRef<HTMLElement>);

  togglePicker(event: MouseEvent) {
    event.stopPropagation();
    this.open.update((open) => !open);
  }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: Event) {
    if (!this.inline() && !this.host.nativeElement.contains(event.target as Node))
      this.open.set(false);
  }

  @HostListener('document:keydown.escape')
  closeOnEscape() {
    this.open.set(false);
  }
}
