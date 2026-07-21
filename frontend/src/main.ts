import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { initializeFirebaseAnalytics } from './app/core/firebase/firebase';

registerLocaleData(localeEs);
void initializeFirebaseAnalytics();
bootstrapApplication(AppComponent, appConfig).catch((error) => console.error(error));
