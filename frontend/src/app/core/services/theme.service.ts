import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';

export type AppTheme = 'light' | 'dark' | 'graphite';

const THEME_STORAGE_KEY = 'imperial-estates-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  readonly theme = signal<AppTheme>(this.readInitialTheme());

  constructor() {
    effect(() => this.applyTheme(this.theme()));
  }

  toggle() {
    this.theme.update((theme) => theme === 'light' ? 'dark' : theme === 'dark' ? 'graphite' : 'light');
  }

  setTheme(theme: AppTheme) {
    this.theme.set(theme);
  }

  private readInitialTheme(): AppTheme {
    const browserWindow = this.document.defaultView;
    if (!browserWindow) return 'light';

    try {
      const savedTheme = browserWindow.localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'graphite') return savedTheme;
    } catch {
      // Browsers can disable storage; the system preference remains a safe fallback.
    }

    return browserWindow.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private applyTheme(theme: AppTheme) {
    const root = this.document.documentElement;
    root.dataset['theme'] = theme;
    root.style.colorScheme = theme === 'light' ? 'light' : 'dark';

    const themeColor = theme === 'light' ? '#f4f5f7' : theme === 'graphite' ? '#111214' : '#080908';
    this.document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);

    try {
      this.document.defaultView?.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Theme switching still works for the current page when storage is unavailable.
    }
  }
}
