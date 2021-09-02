import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Observable, BehaviorSubject, ReplaySubject } from 'rxjs/Rx';
import * as _ from 'lodash';
import { JourneyCardComponent } from '../shared/journey-card/journey-card.component';
import { JourneySearchCriteria } from '../models/journey-search-criteria';
import { JourneySearchResult } from '../models/journey-search-result';
import { JourneySearchResultService } from '../models/journey-search-result-service';
import { JourneyService } from '../services/journey.service';
import { BasketService } from '../services/basket.service';
import { RetailhubApiService } from '../services/retailhub-api.service';
import { JourneySelectionService } from '../services/journey-selection-service';
import { UiService } from '../services/ui.service';
import { Analytics } from '../services/analytics.service';
import { SleeperService } from '../services/sleeper.service';
import { AlertService } from '../services/alert.service';
import { CONFIG_TOKEN } from '../constants';

@Component({
  selector: 'app-return-journey-selector',
  styleUrls: ['return-journey-selector.component.scss', '../outward-journey-selector/outward-journey-selector.component.scss'],
  templateUrl: 'return-journey-selector.component.html'
})
export class ReturnJourneySelectorComponent implements OnInit {
  public addToBasketByModalFunction: () => void;
  private searchCriteria$: ReplaySubject<JourneySearchCriteria>;
  private isSearchInProgress$: BehaviorSubject<boolean>;
  private isBasketRefreshing$: BehaviorSubject<boolean>;
  private searchResults$: BehaviorSubject<JourneySearchResult>;
  private lastSearchCriteria: JourneySearchCriteria;
  private searchResults: JourneySearchResult;
  private outwardService: JourneySearchResultService;
  private promotion: string;
  private outgoingFareGroup: string;
  private serviceid: number;
  private singleReturn: boolean = false;
  private disableSelection: boolean = false;
  private sleeperJourneySelected;
  private sleeperModalVisible: boolean = false;

  constructor(
      private journeyService: JourneyService,
      private basketService: BasketService,
      private route: ActivatedRoute,
      private router: Router,
      private journeySelectionService: JourneySelectionService,
      private uiService: UiService,
      private titleService: Title,
      private analytics: Analytics,
      private sleeperService: SleeperService,
      private alertService: AlertService,
      @Inject(CONFIG_TOKEN) private config: any) {

    this.isSearchInProgress$ = this.journeyService.isSearchInProgress$;
    this.searchCriteria$ = this.journeyService.searchCriteria$;
    this.searchResults$ = this.journeyService.searchResults$;
    this.isBasketRefreshing$ = this.basketService.isBasketRefreshing$;

    // get outgoing fare group and service id
    this.route.params.subscribe((params) => {
      if (params['service']) {
        this.outgoingFareGroup = params['fareGroup'];
        this.serviceid = Number(params['service']);
        this.singleReturn = params['singleReturn'];
      } else {
        this.router.navigate(['/qtt']);
      }
    });

    this.journeyService.searchResults$.subscribe((searchResults: JourneySearchResult) => this.searchResults = searchResults );
    this.searchCriteria$.subscribe((searchCriteria: JourneySearchCriteria) =>  {
      this.lastSearchCriteria = searchCriteria;
      this.outwardService = _.find(this.searchResults.outwardServices, {id: this.serviceid });
    });
  }

  public ngOnInit(): void {
    this.titleService.setTitle('Select return journey');
    this.analytics.trackPage(this.titleService.getTitle());
    this.addToBasketByModalFunction = this.addToBasketByModal.bind(this);
  }

  public getPassengers(numberOfPassengers: number): string {
    return numberOfPassengers > 1 ? `${numberOfPassengers} passengers` : `${numberOfPassengers} passenger`;
  }

  public onServiceSelect(service: JourneySearchResultService, journeyCard: JourneyCardComponent): void {
    if (this.disableSelection) { return; }

    this.disableSelection = true;
    this.sleeperService.isReturnSleeper = service.flags.length > 0 && service.flags.some((x) => x === 'Sleeper');

    if (this.sleeperService.isReturnSleeper) {
      this.sleeperModalVisible = true;
      this.sleeperJourneySelected = {service, journeyCard};
      return;
    } else {
      journeyCard.showLoadingState = true;
      this.addToBasket(service, journeyCard);
    }
  }

  public addToBasket(service: JourneySearchResultService, journeyCard: JourneyCardComponent): void {
    let selectedService = {
      outwardfaregroup: this.outgoingFareGroup,
      outwardserviceid: this.serviceid,
      returnServiceId: service.id,
      returnfaregroup: this.singleReturn ? service.cheapeastSingleReturn.singlefaregroupid || service.cheapestSingleFareGroup : null
    };

    this.basketService.addServiceToBasket(selectedService).subscribe((tripno: number) => {
      this.saveJourney(tripno, selectedService);
      this.continueJourney(tripno);
    }, (err: any) => {
      this.uiService.error("Sorry, there's a problem with our system. Please try booking your journey again.");
      this.disableSelection = false;
      journeyCard.showLoadingState = false;
    });
  }

  public addToBasketByModal(): void {
    this.sleeperJourneySelected.journeyCard.showLoadingState = true;
    this.addToBasket(this.sleeperJourneySelected.service, this.sleeperJourneySelected.journeyCard);
    this.sleeperModalVisible = false;
  }

  public saveJourney(tripno: any, selectedService: any): void {
    this.journeySelectionService.addTrip({
      searchResults: this.searchResults,
      selectedService,
      tripNo: tripno
    });
  }

  public continueJourney(tripno: number): void {
    this.isBasketRefreshing$.subscribe((ready: boolean) => {
     return ready ? this.router.navigate(['/selections', { trip: tripno }]) : false;
    }).unsubscribe();
  }

  public amendSelection(): void {
    this.lastSearchCriteria.promotion = this.promotion;
    this.router.navigate(['/qtt', this.journeySelectionService.amendSearchParams(this.lastSearchCriteria)]);
  }

  public onClickedExtendSearch(link: string): void {
    this.journeyService.extendSearch(link).toPromise().then((data) => {}).catch((err) => {
      throw(err);
    });
  }
}
