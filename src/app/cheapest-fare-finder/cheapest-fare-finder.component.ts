import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs/Rx';
import { Title } from '@angular/platform-browser';
import { JourneySearchCriteria } from '../models/journey-search-criteria';
import { JourneyService } from '../services/journey.service';
import { BasketService } from '../services/basket.service';
import { JourneySelectionService } from '../services/journey-selection-service';
import { Analytics } from '../services/analytics.service';
import { LocationService } from '../services/locations.service';
import { CheapestFareFinderService, ICffJourneySearchResult } from '../services/cheapest-fare-finder.service';
import { SubscriberComponent } from '../shared/subscriber.component';

@Component({
  selector: 'app-cheapest-fare-finder',
  styleUrls: ['cheapest-fare-finder.component.scss'],
  templateUrl: 'cheapest-fare-finder.component.html'
})
export class CheapestFareFinderComponent extends SubscriberComponent implements OnInit {
  public cffToggleOptions;
  public cffStep$: BehaviorSubject<string>;
  public canContinue$: BehaviorSubject<boolean>;
  public selectedOutbound$: BehaviorSubject<ICffJourneySearchResult>;
  public hasSelectedDay: boolean = false;
  public isSearchInProgress$: BehaviorSubject<boolean>;
  public searchCriteria$: Observable<JourneySearchCriteria>;
  public isBasketRefreshing$: BehaviorSubject<boolean>;
  public journeyLocations$ = new BehaviorSubject<{ [key: string]: string }>(null);
  private lastSearchCriteria: JourneySearchCriteria;

  constructor(
    private journeyService: JourneyService,
    private cffService: CheapestFareFinderService,
    private locationService: LocationService,
    private basketService: BasketService,
    private route: ActivatedRoute,
    private router: Router,
    private journeySelectionService: JourneySelectionService,
    private titleService: Title,
    private analytics: Analytics
  ) {
    super();
    // Always set a local observable variable so that Angular Zone is configured properly (otherwise nothing happens
    // when the observable emits a value
    this.isSearchInProgress$ = this.cffService.isSearchInProgress$;
    this.searchCriteria$ = this.cffService.searchCriteria$.filter((searchCriteria) => searchCriteria !== null);
    this.isBasketRefreshing$ = this.basketService.isBasketRefreshing$;
    this.cffToggleOptions = this.cffService.getToggleOptions();
    this.cffStep$ = new BehaviorSubject('outbound');
    this.canContinue$ = new BehaviorSubject(false);
    this.selectedOutbound$ = new BehaviorSubject(null);

    this.subscriptions.push(
      Observable.combineLatest(this.cffStep$, this.selectedOutbound$).subscribe((data) => {
        this.canContinue$.next((data[0] === 'outbound' && data[1] != null));
      }),

      this.cffService.isCffRoute$.filter((val) => !val).subscribe(() => this.toggleFares('all')),
      this.searchCriteria$.subscribe((searchCriteria: JourneySearchCriteria) => this.setLocations(searchCriteria)),

      this.route.params.filter(() => !this.lastSearchCriteria).subscribe((params) => {
        this.lastSearchCriteria = this.journeySelectionService.parseSearchParams(params);
        this.cffService.updateSearch(this.lastSearchCriteria);
      }),

      this.route.params.subscribe((params) => this.cffService.qttParams = params)
    );
  }

  public ngOnInit() {
    this.analytics.trackPage(this.titleService.getTitle());
  }

  public selectDay(day: string): void {
    this.hasSelectedDay = day !== null;
  }

  public getPassengersCount(criteria: JourneySearchCriteria): string {
    if (criteria) {
      const sum = criteria.adults + criteria.children;
      return sum + ' passenger' + (sum > 1 ? 's' : '');
    } else {
      return '';
    }
  }

  public toggleFares(type: string): void {
    this.cffService.toggleFares(type);
  }

  public amendSelection(): void {
    this.cffService.amendSelection();
  }

  private setLocations(criteria: JourneySearchCriteria = this.lastSearchCriteria): void {
    Observable.combineLatest(
      this.locationService.findOne({ id: criteria.origin }),
      this.locationService.findOne({ id: criteria.destination })
    ).subscribe(([origin, destination]) => this.journeyLocations$.next({ originName: origin.name, destinationName: destination.name }));
  }
}
