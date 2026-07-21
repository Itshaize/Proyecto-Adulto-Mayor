import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AccessibilityMenuComponent } from './shared/accessibility-menu/accessibility-menu.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AccessibilityMenuComponent],
  template: '<router-outlet /><app-accessibility-menu />'
})
export class AppComponent {}

