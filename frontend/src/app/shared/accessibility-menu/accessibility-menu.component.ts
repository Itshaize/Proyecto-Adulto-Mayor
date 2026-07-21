import { Component, HostListener, signal } from '@angular/core';

type AccessibilitySetting = 'largeText' | 'highContrast';

@Component({
  selector: 'app-accessibility-menu',
  standalone: true,
  templateUrl: './accessibility-menu.component.html',
  styleUrl: './accessibility-menu.component.scss'
})
export class AccessibilityMenuComponent {
  private readonly storageKey = 'kairos_accessibility';

  readonly isOpen = signal(false);
  readonly largeText = signal(false);
  readonly highContrast = signal(false);

  constructor() {
    this.restorePreferences();
    this.applyPreferences();
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isOpen.update((open) => !open);
  }

  toggle(setting: AccessibilitySetting): void {
    if (setting === 'largeText') this.largeText.update((active) => !active);
    if (setting === 'highContrast') this.highContrast.update((active) => !active);
    this.applyPreferences();
    this.savePreferences();
  }

  close(): void {
    this.isOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.close();
  }

  private restorePreferences(): void {
    try {
      const saved = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
      this.largeText.set(saved.largeText === true);
      this.highContrast.set(saved.highContrast === true);
    } catch {}
  }

  private savePreferences(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({
        largeText: this.largeText(),
        highContrast: this.highContrast()
      }));
    } catch {}
  }

  private applyPreferences(): void {
    document.documentElement.classList.toggle('a11y-large-text', this.largeText());
    document.documentElement.classList.toggle('a11y-high-contrast', this.highContrast());
  }
}
