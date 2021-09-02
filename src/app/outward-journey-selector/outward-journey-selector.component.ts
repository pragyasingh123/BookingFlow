import { Component, OnInit, Input, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, BehaviorSubject, Subscription, ReplaySubject} from 'rxjs/Rx';
import { Title } from '@angular/platform-browser';
import { JourneySearchCriteria } from '../models/journey-search-criteria';
import { Basket } from '../models/basket';
import { JourneySearchResult } from '../models/journey-search-result';
import { JourneySearchResultService } from '../models/journey-search-result-service';
import { JourneyService } from '../services/journey.service';
import { CheapestFareFinderService } from '../services/cheapest-fare-finder.service';
import { BasketService } from '../services/basket.service';
import { RetailhubApiService } from '../services/retailhub-api.service';
import { JourneySelectionService } from '../services/journey-selection-service';
import { UiService } from '../services/ui.service';
import { Analytics } from '../services/analytics.service';
import { QttComponent } from '../qtt/qtt.component';
import { JourneyCardComponent } from '../shared/journey-card/journey-card.component';
import { SleeperService } from '../services/sleeper.service';
import { AlertService } from '../services/alert.service';
import { CONFIG_TOKEN } from '../constants';
import * as moment from 'moment';
import * as _ from 'lodash';

@Component({
  selector: 'app-outward-journey-selector',
  styleUrls: ['outward-journey-selector.component.scss'],
  templateUrl: 'outward-journey-selector.component.html'
})

export class OutwardJourneySelectorComponent implements OnInit {
  public cffToggleOptions;
  public addToBasketByModalFunction: () => void;
  private qtt: QttComponent;
  private isSearchInProgress$: BehaviorSubject<boolean>;
  private searchResults$: BehaviorSubject<JourneySearchResult>;
  private searchCriteria$: ReplaySubject<JourneySearchCriteria>;
  private isBasketRefreshing$: BehaviorSubject<boolean>;
  private lastSearchCriteria: JourneySearchCriteria;
  private promotion: string;
  private criteria: JourneySearchCriteria;
  private searchResults: JourneySearchResult;
  private warningHidden: boolean;
  private disableSelection: boolean = false;
  private searchError: boolean = false;
  private searchErrorMessage: string = "Sorry, there's a problem with our system. Please try booking your journey again.";
  private sleeperJourneySelected;
  private sleeperModalVisible: boolean = false;

  constructor(private journeyService: JourneyService,
              private cffService: CheapestFareFinderService,
              private basketService: BasketService,
              private route: ActivatedRoute,
              private router: Router,
              private uiService: UiService,
              private journeySelectionService: JourneySelectionService,
              private titleService: Title,
              private analytics: Analytics,
              private sleeperService: SleeperService,
              private alertService: AlertService,
              @Inject(CONFIG_TOKEN) private config: any) {

    // Always set a local obserable variable so that Angular Zone is configured properly (otherwise nothing happens
    // when the observable emits a value
    this.isSearchInProgress$ = this.journeyService.isSearchInProgress$;
    this.searchCriteria$ = this.journeyService.searchCriteria$;
    this.searchResults$ = this.journeyService.searchResults$;
    this.isBasketRefreshing$ = this.basketService.isBasketRefreshing$;

    // Last search
    this.searchResults$.subscribe((searchResults: JourneySearchResult) => this.searchResults = searchResults);
    this.cffToggleOptions = this.cffService.getToggleOptions();

    // Last criteria
    this.searchCriteria$.subscribe((searchCriteria: JourneySearchCriteria) => {
      this.lastSearchCriteria = searchCriteria;
      if (searchCriteria.promotion !== undefined) {
        this.promotion = searchCriteria.promotion;
      }
      this.cffService.updateSearch(searchCriteria);
   });
  }

  public ngOnInit(): void {
    this.titleService.setTitle('Select outward journey');
    this.analytics.trackPage(this.titleService.getTitle());

    if (this.journeySelectionService.isHandoff()) {
      this.criteria = this.journeySelectionService.parseUrlParams();
    } else {
      this.route.params.subscribe((params) => {
        this.criteria = this.journeySelectionService.parseSearchParams(params);
      });
    }
    this.addToBasketByModalFunction = this.addToBasketByModal.bind(this);
    this.searchJourney();
  }

  public getPassengers(numberOfPassengers: number): string {
    return numberOfPassengers > 1 ? `${numberOfPassengers} passengers` : `${numberOfPassengers} passenger`;
  }

  public onServiceSelect(service: JourneySearchResultService, journeyCard: JourneyCardComponent): void {
    if (this.disableSelection) {
      return;
    }

    this.sleeperService.isOutwardSleeper = service.flags.length > 0 && service.flags.some((x) => x === 'Sleeper');
    this.disableSelection = true;

    if (this.sleeperService.isOutwardSleeper) {
      this.sleeperModalVisible = true;
      this.sleeperJourneySelected = {service, journeyCard};
      return;
    } else {
      journeyCard.showLoadingState = true;
      this.addToBasket(service, journeyCard);
    }
  }

  public addToBasketByModal(): void {
    this.sleeperJourneySelected.journeyCard.showLoadingState = true;
    this.addToBasket(this.sleeperJourneySelected.service, this.sleeperJourneySelected.journeyCard);
    this.sleeperModalVisible = false;
  }

  public addToBasket(service: JourneySearchResultService, journeyCard: JourneyCardComponent): void {
    let selectedService = {
      outwardfaregroup: service.hasCheapestReturnFareCost ? service.cheapestReturnFareGroup : service.cheapestSingleFareGroup,
      outwardserviceid: service.id
    };

    if (!this.criteria.isreturn || this.criteria.isopenreturn) {
      // single ticket
      this.basketService.addServiceToBasket(selectedService).subscribe((tripno: number) => {
        this.saveJourney(tripno, selectedService, this.criteria.isopenreturn);
        this.continueJourney(tripno);
      }, (err: any) => {
        var firstError;
        if (err && err.errors && err.errors.length > 0) {
          firstError = err.errors[0];
        }
        if (firstError && firstError.indexOf('30048') !== -1) {
          this.uiService.error('You have added the maximum number of 8 trips to your basket. Please remove one to continue.');
        } else {
          this.uiService.error("Sorry, there's a problem with our system. Please try booking your journey again.");
        }
        this.disableSelection = false;
        journeyCard.showLoadingState = false;
      });
    } else if (this.criteria.isreturn && service.cheapestSingleFareGroup) {
      // return two cheapest singlessinglefaregroupid
      this.router.navigate(['/search/return', { service: service.id, fareGroup: service.cheapestSingleFareGroup, singleReturn: true }]);
    }  else {
      // return jouney
      this.router.navigate(['/search/return', { service: service.id, fareGroup: service.cheapestReturnFareGroup }]);
    }
  }

  public cancelAmend(): void {
    this.basketService.cancelAmendBooking().subscribe((response) => {
      this.basketService.routeToMyAccount();
    }, (err) => {
      throw(err);
    });
  }

  public hideWarning(): void {
    this.warningHidden = true;
  }

  public onClickedExtendSearch(link: string): void {
    this.journeyService.extendSearch(link).toPromise().then((data) => {}).catch((err) => {
      this.searchError = true;

      if (_.isArray(err.errors)) {
        if (err.errors[0] && !(err.errors[0].indexOf('html') > -1)) {
          this.searchErrorMessage = err.errors[0].split(':')[1].trim();
        }
      }
    });
  }

  public saveJourney(tripno: any, selectedService: any, isOpenReturn: any): void {
    this.journeySelectionService.addTrip({
      isOpenReturn,
      searchResults: this.searchResults,
      selectedService,
      tripNo: tripno
    });
  }

  public amendSelection() {
      this.lastSearchCriteria.promotion = this.promotion;
      this.router.navigate(['/qtt', this.journeySelectionService.amendSearchParams(this.lastSearchCriteria)]);
  }

  public continueJourney(tripno: number) {
    this.isBasketRefreshing$.subscribe((ready: boolean) => {
     return ready ? this.router.navigate(['/selections', { trip: tripno }]) : false;
    }).unsubscribe();
  }

  public toggleFares(type: string) {
    if (type == 'cheapest') {
      this.router.navigate(['/cff', this.journeySelectionService.amendSearchParams(this.lastSearchCriteria)]);
    }
  }

  private searchJourney(): void {
    this.searchError = false;

    this.journeyService.search(this.criteria).toPromise().then().catch((err) => {
      this.searchError = true;
      if (_.isArray(err.errors)) {
        if (err.errors[0] && !(err.errors[0].indexOf('html') > -1)) {
          this.searchErrorMessage = err.errors[0].split(': ').pop();
        }
      }
    });
  }
}
