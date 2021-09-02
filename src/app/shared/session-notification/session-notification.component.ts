import { Component, OnInit, Output, EventEmitter, Inject } from '@angular/core';
import { JourneyService } from '../../services/journey.service';
import { JourneySearchCriteria } from '../../models/journey-search-criteria';
import { Observable, ReplaySubject } from 'rxjs/Rx';
import { ActivatedRoute, Router } from '@angular/router';
import { RetailhubApiService } from '../../services/retailhub-api.service';
import { BasketService } from '../../services/basket.service';
import { IWindow } from '../../models/confirmation-ga';
import { Device } from 'ng2-device-detector/src/index';

declare var window: Window;

@Component({
  selector: 'app-session-notification',
  styleUrls: ['./session-notification.component.scss'],
  templateUrl: './session-notification.component.html'
})
export class SessionNotificationComponent implements OnInit {
  @Output() public onResetState = new EventEmitter<boolean>();

  private searchCriteria$: ReplaySubject<JourneySearchCriteria>;
  private lastSearchCriteria: JourneySearchCriteria;
  private promotion: string;
  private isReturn: boolean = false;
  private hasRailcard: boolean = false;
  private outTime: string;
  private returnTime: string;

  constructor(
    private journeyService?: JourneyService,
    private router?: Router,
    private retailhubApiService?: RetailhubApiService,
    private device?: Device,
    private basketService?: BasketService
  ) {
    this.searchCriteria$ = this.journeyService.searchCriteria$;
    this.searchCriteria$.subscribe((searchCriteria: JourneySearchCriteria) => {
      this.lastSearchCriteria = searchCriteria;
      if (searchCriteria.promotion !== undefined) {
        this.promotion = searchCriteria.promotion;
      }

      this.isReturn = this.lastSearchCriteria.isreturn;
      this.hasRailcard = this.lastSearchCriteria.railcards.length > 0 ? true : false;
    });

  }

  public ngOnInit(): void {
    window.scroll(0, 0);
  }

  public previousSearchOptions() {
    let queryOptions = {
      adults: this.lastSearchCriteria.adults,
      children: this.lastSearchCriteria.children,
      depart: this.lastSearchCriteria.outwardDepartAfter ? 'depart-after' : 'arrive-before',
      destination: this.lastSearchCriteria.destination,
      origin: this.lastSearchCriteria.origin,
      time: this.lastSearchCriteria.datetimedepart.format()
    };

    if (this.lastSearchCriteria.via) {
      queryOptions['via'] = this.lastSearchCriteria.via;
    } else if (this.lastSearchCriteria.avoid) {
      queryOptions['avoid'] = this.lastSearchCriteria.avoid;
    }

    if (this.lastSearchCriteria.isreturn && this.lastSearchCriteria.datetimeReturn.isValid()) {
      queryOptions['isreturn'] = true;
      if (this.lastSearchCriteria.isopenreturn) {
        queryOptions['isopenreturn'] = true;
      } else {
        queryOptions['return'] = this.lastSearchCriteria.returnDepartAfter ? 'depart-after' : 'arrive-before';
        queryOptions['returntime'] = this.lastSearchCriteria.datetimeReturn.format();
      }
    }

    if (this.promotion) {
      queryOptions['promotion'] = this.promotion;
    }

    return queryOptions;
  }

  public resetToSearch(queryOptions: any): any {
    this.onResetState.emit(true);

    if (this.device.isMobile()) {
      if (queryOptions) {
        this.router.navigate(['/qtt', queryOptions]);
      } else {
        this.router.navigate(['/qtt']);
      }
    } else {
      window.location.assign(window.location.origin + '/tickets');
    }
  }

  public searchNew(e: any, searchNew: any): void {
    if (searchNew == true) {
      this.resetToSearch (this.previousSearchOptions()); // reset basket & session, then init previous search
    } else {
      this.resetToSearch (null); // reset basket & session, then trigger new search
    }
  }
}
