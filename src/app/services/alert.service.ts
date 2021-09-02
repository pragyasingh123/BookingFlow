import { Injectable, Inject } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs/Subject';
import {Http } from '@angular/http';
import { CONFIG_TOKEN } from '../constants';

@Injectable()
export class AlertService {
  private subject = new Subject<IAlert[]>();
  private keepAfterNavigationChange = false;

  constructor(
    private router: Router,
    private http: Http,
    @Inject(CONFIG_TOKEN) private config: any
  ) {
    router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        if (this.keepAfterNavigationChange) {
          this.keepAfterNavigationChange = false;
        } else {
          this.subject.next();
        }
      }
    });
  }

  public showAlerts(alerts: IAlert[], keepAfterNavigationChange = false) {
    this.keepAfterNavigationChange = keepAfterNavigationChange;
    this.subject.next(alerts);
  }

  public getAlertsCollection(): Observable<IAlert[]> {
    return this.subject.asObservable();
  }

  public getAlerts(): Observable<IAlert[]> {
    return this.http.get(this.config.defaultSitecoreApiUrl + '/api/sitesettings/getalerts').map((data) => {
      return data.json();
    });
  }

  public displayAlerts(): void {
    this.getAlerts().subscribe((res) => {
      if (res && res.length > 0) {
        this.showAlerts(res, false);
      }
    }, (error) => {
      throw(error);
    });
  }
}

interface IAlert {
  Id: string;
  Content: string;
}
