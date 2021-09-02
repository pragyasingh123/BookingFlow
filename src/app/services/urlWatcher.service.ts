import { Router, NavigationEnd } from '@angular/router';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from '../../../node_modules/rxjs';
import { SubscriberComponent } from '../shared/subscriber.component';

@Injectable()
export class UrlWatcherService extends SubscriberComponent {
  public urlChange: BehaviorSubject<string>;
  private currentStateOfUrl: string;
  private previousStateOfUrl: string;

  constructor(private router: Router) {
    super();
    this.urlChange = new BehaviorSubject<string>('');
    this.currentStateOfUrl = this.router.url;
    this.subscriptions.push(router.events.subscribe((routerEvent) => {
        if (routerEvent instanceof NavigationEnd) {
          this.previousStateOfUrl = this.currentStateOfUrl;
          this.currentStateOfUrl = routerEvent.url;
          this.urlChange.next(this.currentStateOfUrl);
        }
      })
    );
  }

  public urlState(): IUrlStateObject {
    return {previous: this.previousStateOfUrl, current: this.currentStateOfUrl};
  }
}

export interface IUrlStateObject {
  previous: string;
  current: string;
}
