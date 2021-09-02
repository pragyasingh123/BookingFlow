import {Injectable} from '@angular/core';
import * as _ from 'lodash';
import {RetailhubApiService} from './retailhub-api.service';
import {UiService} from './ui.service';
import {Analytics} from './analytics.service';
import {IWindow} from '../models/confirmation-ga';
declare var window: IWindow;

@Injectable()

export class LoginHelperService {
  private tooManyRequests: boolean = false;

  constructor(private uiService: UiService,
              private retailhubApiService: RetailhubApiService,
              private analytics: Analytics,
  ) {
    this.retailhubApiService.retryAfterAmountOfSeconds$.subscribe(
      (res) => {
        let retryAfterErrorMessage =
          'You have attempted to login too many times, please try again in ' + this.secondsToHumanRedableFormat(res);
        this.tooManyRequests = true;
        this.uiService.error(retryAfterErrorMessage);
      }
    );
    this.retailhubApiService.otherErrorsGuard$.subscribe(
      (res) => {
        this.tooManyRequests = res;
      }
    );

  }

  public secondsToHumanRedableFormat(seconds): string {
    const levels: any = [
      [Math.floor(seconds / 31536000), 'years'],
      [Math.floor((seconds % 31536000) / 86400), 'days'],
      [Math.floor(((seconds % 31536000) % 86400) / 3600), 'hours'],
      [Math.floor((((seconds % 31536000) % 86400) % 3600) / 60), 'minutes'],
      [(((seconds % 31536000) % 86400) % 3600) % 60, 'seconds'],
    ];
    let returnText = '';

    for (let i = 0, max = levels.length; i < max; i++) {
      if (levels[i][0] === 0) {
        continue;
      }
      returnText += ' ' + levels[i][0] + ' ' + (levels[i][0] === 1 ? levels[i][1].substr(0, levels[i][1].length - 1) : levels[i][1]);
    }
    return returnText.trim();
  }

  public analyticsSetup(response, redirectUri): void {
      this.analytics.updateContactFacet('personal', {
        email: response.userprofile.email.toLowerCase(),
        firstName: response.userprofile.firstname,
        id: response.userprofile.id,
        lastName: response.userprofile.lastname,
        phoneNumber: response.userprofile.mobilenumber,
        title: response.userprofile.title,
      });

      this.analytics.gtmTrackEvent({
        event: 'login',
        options: redirectUri,
        'user-type': _.find(window.dataLayer, {'engagement-name': 'account-creation' }) ? 'first-time' : 'existing',
      });
  }

  public loginError(error): void {
    if (this.tooManyRequests === false) {
      this.uiService.error(error);
    }
  }
}
