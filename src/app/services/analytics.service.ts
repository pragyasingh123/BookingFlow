import { Injectable, Inject } from '@angular/core';
import { IWindow } from '../models/confirmation-ga';
import { CONFIG_TOKEN } from '../constants';

declare var window: IWindow;

@Injectable()
export class Analytics {
  private currentScreenName: any;

  constructor(@Inject(CONFIG_TOKEN) private config: any) { }

  public trackPage(pageTitle: string): void {
    if (window.SCBeacon) {
      window.SCBeacon.trackEvent('Page visited', {
        pageName: pageTitle
      });
    }
  }

  public trackGoal(goal: string): void {
    if (window.SCBeacon) {
      window.SCBeacon.trackGoal(goal);
    }
  }

  public trackGoalOutcomes(goal: string, data): void {
    if (window.SCBeacon) {
      window.SCBeacon.trackGoal(goal, {
        data,
        dataKey: 'montaryValue'
      });
    }
  }

  public trackEvent(data: any): void {
    if (window.SCBeacon) {
      window.SCBeacon.trackEvent('Page visited', {
        xIcon: '',
        xSection: data.region,
        xText: data.event.target.innerHTML.trim(),
        xType: data.type
      });
    }
  }

  public trackButtonClick(data: any): void {
    if (window.SCBeacon) {
      window.SCBeacon.trackEvent(data);
    }
  }

  public trackOutcome(outcome: any, params: any): void {
    if (window.SCBeacon) {
      window.SCBeacon.trackOutcome(outcome, params);
    }
  }

  public updateContactFacet(name: string, data: any): void {
    if (window.SCBeacon) {
      let messageBody = {
        data,
        name
      };

      let message = {
        ucfParams: encodeURI(JSON.stringify(messageBody))
      };

      window.SCBeacon.trackEvent('Update Contact Facet', message);
    }
  }

  public gtmTrackPage(location: any, url: any): void {
    var currentScreenName = this.GetScreenChangeName(url);

    if (this.currentScreenName && currentScreenName === this.currentScreenName) {
      return;
    }

    this.currentScreenName = currentScreenName;

    // dont log seats and extra preferences.
    if (url.indexOf('preferences') > -1) { return; }

    if (window.dataLayer) {
      let page;

      if (url.indexOf('seats-and-extras') > -1) {
        page = `${location.pathname + location.hash.substring(0, location.hash.lastIndexOf('/'))}/`;
      } else if ((url.indexOf('confirmation') > -1) || (url.indexOf('review-order') > -1)) {
        page = `${location.pathname + location.hash.split('?')[0]}/`;
      } else {
        page = `${location.pathname + location.hash.split(';')[0]}/`;
      }

      this.gtmTrackEvent({
        angularPage: page,
        event: 'screen-change',
        hashString: location.hash
      });
    }
  }

  public gtmTrackEvent(data: any): void {
    if (window.dataLayer) {
      if (this.config.appVersion) {
        data['application_version'] = this.config.appVersion;
      }

      window.dataLayer.push(data);
    }
  }

  private GetScreenChangeName(url: string): any {
    var shortUrl =  url.split(';')[0].split('/')[1];

    switch (shortUrl) {
      case '':
      case 'qtt' :
        return 'search';
      case 'search' :
      case 'selections':
        return 'tickets';
      case 'seats-and-extras':
        return 'extras';
      case 'delivery':
        return 'delivery';
      case 'review-order':
        return 'review';
      case 'confirmation':
        return 'payment';
      default :
        return 'default';
    }
  }
}
