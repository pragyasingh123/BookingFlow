import './polyfills.ts';
import { RECAPTCHA_SETTINGS, RecaptchaSettings } from 'ng-recaptcha';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
import { environment } from './environments/environment';
import { AppModule } from './app/';
import { CONFIG_TOKEN } from './app/constants';
import 'whatwg-fetch';

fetch('config/env.json').then(bootstrap);

function bootstrap(res: Response): void {
  res.json().then((config) => {
    if (environment.production) {
      enableProdMode();
    }

    const globalSettings: RecaptchaSettings = { siteKey: config.recaptchaSiteKey, size: 'invisible' };

    platformBrowserDynamic([
      {
        provide: CONFIG_TOKEN,
        useValue: config
      },
      {
        provide: RECAPTCHA_SETTINGS,
        useValue: globalSettings
      }
    ]).bootstrapModule(AppModule);
  }).catch((error) => {
    return Promise.reject(error.message || error);
  });
}
