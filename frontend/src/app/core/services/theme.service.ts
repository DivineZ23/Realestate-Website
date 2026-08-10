import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Injectable, signal } from '@angular/core';

export type ThemePalette = 'imperial' | 'ocean' | 'emerald' | 'violet' | 'ruby';
export type ThemeMode = 'light' | 'dark';
export type AppTheme = `${ThemePalette}-${ThemeMode}`;

export interface ThemePaletteOption {
  id: ThemePalette;
  label: string;
  color: string;
  darkColor: string;
}

export const THEME_PALETTES: readonly ThemePaletteOption[] = [
  { id: 'imperial', label: 'Imperial', color: '#f4b000', darkColor: '#17130a' },
  { id: 'ocean', label: 'Ocean', color: '#1685e5', darkColor: '#071729' },
  { id: 'emerald', label: 'Emerald', color: '#10b981', darkColor: '#072219' },
  { id: 'violet', label: 'Violet', color: '#744ee8', darkColor: '#18102c' },
  { id: 'ruby', label: 'Ruby', color: '#dc315c', darkColor: '#2a0d16' },
] as const;

const THEME_STORAGE_KEY = 'imperial-estates-theme';
const PALETTES = new Set<ThemePalette>(THEME_PALETTES.map((palette) => palette.id));

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  readonly theme = signal<AppTheme>(this.readInitialTheme());
  readonly palette = computed<ThemePalette>(() => this.theme().split('-')[0] as ThemePalette);
  readonly mode = computed<ThemeMode>(() => (this.theme().endsWith('-dark') ? 'dark' : 'light'));
  readonly activeLabel = computed(() => {
    const label =
      THEME_PALETTES.find((palette) => palette.id === this.palette())?.label ?? 'Imperial';
    return `${label} · ${this.mode() === 'dark' ? 'Dark' : 'Light'}`;
  });

  constructor() {
    effect(() => this.applyTheme(this.theme()));
  }

  toggle() {
    this.setMode(this.mode() === 'light' ? 'dark' : 'light');
  }

  setTheme(theme: AppTheme) {
    this.theme.set(theme);
  }

  setPalette(palette: ThemePalette) {
    this.setTheme(`${palette}-${this.mode()}`);
  }

  setMode(mode: ThemeMode) {
    this.setTheme(`${this.palette()}-${mode}`);
  }

  private readInitialTheme(): AppTheme {
    const browserWindow = this.document.defaultView;
    if (!browserWindow) return 'imperial-light';

    try {
      const savedTheme = browserWindow.localStorage.getItem(THEME_STORAGE_KEY);
      const parsed = this.parseTheme(savedTheme);
      if (parsed) return parsed;
    } catch {
      // Browsers can disable storage; the system preference remains a safe fallback.
    }

    return browserWindow.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'imperial-dark'
      : 'imperial-light';
  }

  private parseTheme(value: string | null): AppTheme | null {
    if (!value) return null;

    // Migrate the original three themes without resetting a user's preference.
    if (value === 'light') return 'imperial-light';
    if (value === 'dark') return 'emerald-dark';
    if (value === 'graphite') return 'imperial-dark';

    const [palette, mode] = value.split('-') as [ThemePalette, ThemeMode];
    return PALETTES.has(palette) && (mode === 'light' || mode === 'dark')
      ? `${palette}-${mode}`
      : null;
  }

  private applyTheme(theme: AppTheme) {
    const root = this.document.documentElement;
    const [palette, mode] = theme.split('-') as [ThemePalette, ThemeMode];
    root.dataset['theme'] = theme;
    root.dataset['palette'] = palette;
    root.dataset['mode'] = mode;
    root.style.colorScheme = mode;

    const themeColor =
      mode === 'light'
        ? '#f4f6f9'
        : (THEME_PALETTES.find((option) => option.id === palette)?.darkColor ?? '#080908');
    this.document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);

    try {
      this.document.defaultView?.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Theme switching still works for the current page when storage is unavailable.
    }
  }
}
