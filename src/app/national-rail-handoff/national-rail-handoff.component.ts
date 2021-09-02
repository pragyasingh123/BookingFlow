import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { JourneySearchCriteria } from '../models/journey-search-criteria';
import { JourneyService } from '../services/journey.service';
import { JourneySelectionService } from '../services/journey-selection-service';
import { JourneySearchResult } from '../models/journey-search-result';
import { BasketService } from '../services/basket.service';
import { Subscription, Observable } from 'rxjs/Rx';
import { Title } from '@angular/platform-browser';
import { Basket } from '../models/basket';
import { Trip } from '../models/trip';
import { JourneySearchResultService } from '../models/journey-search-result-service';
import { IRouteDetailParams } from '../models/route-detail-params';
import { IJourney } from '../models/journey-selection';
import { Analytics } from '../services/analytics.service';
import { CONFIG_TOKEN } from '../constants';
import * as moment from 'moment';
import * as _ from 'lodash';
import { NreHelper } from '../services/nre-helper/nre-helper';
import { Location } from '../models/location';
import { LocationService } from '../services/locations.service';

@Component({
  selector: 'app-national-rail-handoff',
  styleUrls: [ './national-rail-handoff.component.scss' ],
  templateUrl: './national-rail-handoff.component.html'
})
export class NationalRailHandoffComponent implements OnInit, OnDestroy {

  public showLoader: boolean = true;
  public showErrorMsg: boolean = false;
  public from: string;
  public to: string;
  public passengers: string;
  public typeOfJourney: string;
  public ticketPrice: string;
  public nectarPoints: string;
  public returtType: string;
  public isReturnJourney: boolean = false;
  public isOpenReturn: boolean = false;
  public outwardData: any;
  public returnData: any;
  public railcardsAreUse: boolean = false;
  public trip: any;
  public isSingleReturn: boolean = false;
  public outwardRouteDetailsParams: IRouteDetailParams;
  public returnRouteDetailsParams: IRouteDetailParams;
  public amendJourneyInProgress: boolean = false;
  public returnJourneyPackage: boolean = false;
  private criteria: JourneySearchCriteria;
  private selectedJourney: any;
  private selectedService: any;
  private searchResults: JourneySearchResult;
  private isBasketRefreshing$: Subscription;
  private searchJourneySubscription: void;
  private isSearchJourneyStarted: boolean = false;
  private isAmendJourneyStarted: boolean = false;
  private journey: IJourney | null;
  private selectedOutwardFare: any = null;
  private tripId: number;
  private journeyTime: string;
  private errorMessage: string = 'We\'re sorry but this ticket is no longer available.\nChoose a different time or date of travel and search again.';
  private nreHandoffCompleted: boolean = false;

  constructor(private router: Router,
    private route: ActivatedRoute,
    private journeyService: JourneyService,
    private basketService: BasketService,
    private journeySelectionService: JourneySelectionService,
    private titleService: Title,
    private analytics: Analytics,
    private locationService: LocationService,
    @Inject(CONFIG_TOKEN) private config: any) { }
  public inflect(num: number, noun: string): string {
    let nounCap = noun[ 0 ].toUpperCase() + noun.slice(1);
    if (noun === 'child') {
      return num === 1 ? '1 Child' : num + ' Children';
    } else {
      return num === 1 ? '1 ' + nounCap : num + ' ' + nounCap + 's';
    }
  }
  public ngOnInit(): void {
    this.analytics.trackPage(this.titleService.getTitle());
    this.searchJourneySubscription = this.initNreSearchFlow();
    NreHelper.setNreHandedOffSystemSession();
  }

  public searchAgain(clearRailcards: boolean): void {
    let queryOptions = {
      adults: this.criteria.adults,
      children: this.criteria.children,
      depart: this.criteria.outwardDepartAfter ? 'depart-after' : 'arrive-before',
      destination: this.criteria.destination,
      origin: this.criteria.origin,
      railcards: clearRailcards ? '[]' : JSON.stringify(this.criteria.railcards),
      time: this.criteria.datetimedepart.format()
    };

    if (this.criteria.via) {
      queryOptions[ 'via' ] = this.criteria.via;
    } else if (this.criteria.avoid) {
      queryOptions[ 'avoid' ] = this.criteria.avoid;
    }

    if (this.criteria.isreturn) {
      queryOptions[ 'isreturn' ] = true;

      if (this.criteria.isopenreturn) {
        queryOptions[ 'isopenreturn' ] = true;
      } else {
        queryOptions[ 'return' ] = this.criteria.returnDepartAfter ? 'depart-after' : 'arrive-before';
        queryOptions[ 'returntime' ] = this.criteria.datetimeReturn.format();
      }
    }

    if (this.criteria.promotion) {
      queryOptions[ 'promotion' ] = this.criteria.promotion;
    }

    NreHelper.removeNreVisualFLag();
    this.router.navigate([ '/qtt', queryOptions ]);
  }

  public amendJourney(): void {
    this.amendJourneyInProgress = true;
    this.getAndClearBasket().subscribe(() => {
      if (!this.isAmendJourneyStarted) {
        this.amendJourneyInProgress = false;
        this.isAmendJourneyStarted = true;
        this.searchAgain(/*clearRailcards:*/ false);
      }
    }, (error: any) => {
      this.amendJourneyInProgress = false;
      throw error;
    });
  }

  public goToSeatsAndExtras(): void {
    this.router.navigate([ '/seats-and-extras', this.tripId ]);
  }

  public ngOnDestroy(): void {
    if (this.isBasketRefreshing$ !== undefined) {
      this.isBasketRefreshing$.unsubscribe();
    }
  }

  private initNreSearchFlow(): void {
    this.getAndClearBasket().subscribe(() => {
      if (!this.isSearchJourneyStarted) {
        this.isSearchJourneyStarted = true;
        this.searchNreJourney();
      }
    }, (error: any) => {
      var params = this.route.params[ 0 ];
      this.criteria = this.createJourneySearch(params);
      this.selectedJourney = this.createSelectedJourney(params);
      this.journeyTime = moment(this.selectedJourney.outboundDepart).format('ddd D MMM YYYY');
      this.showStationNameOnError(this.criteria, '0: Failed to get basket.');
    });
  }

  private searchNreJourney(): void {
    NreHelper.setNreHandedOffVisualSession();
    this.route.params.forEach((params) => {
      this.criteria = this.createJourneySearch(params);
      this.selectedJourney = this.createSelectedJourney(params);
      this.journeyTime = moment(this.selectedJourney.outboundDepart).format('ddd D MMM YYYY');
      this.journeyService.search(this.criteria).subscribe(this.selectJourney, (error: any) => {
        this.showStationNameOnError(this.criteria, '0: Error from search API.');
      });
    });
  }

  private addToBasket(service): void {
    this.basketService.addServiceToBasket(service).subscribe((tripno: number) => {
      this.isBasketRefreshing$ = this.basketService.isBasketRefreshing$.subscribe((basketReady) => {
        if (!basketReady) {
          this.tripId = tripno;
          this.journeySelectionService.addTrip({
            isOpenReturn: false,
            searchResults: this.searchResults,
            selectedService: service,
            tripNo: tripno
          });

          this.basketService.basket$.subscribe((basket: Basket) => {
            if (basket.trips.length > 0) {
              this.ticketPrice = (basket.totalCostPence / 100).toFixed(2);
              this.setNectarPoints(basket.loyaltyPoints);
              this.trip = basket.trips[ (basket.trips.length - 1) ];
              this.isSingleReturn = this.trip.outwardJourneys[ 0 ].fares.length > 1;
              this.setJourney(this.trip.id);
            }
            if (!this.nreHandoffCompleted) {
              this.showLoader = false;
              this.setHandoverStatus(true, '');
            }
          }, (error: any) => {
            this.showLoader = false;
            this.setHandoverStatus(false, '4: Failed to get item added to basket.');
          });
        }
      });
    }, (error: any) => {
      this.showLoader = false;
      this.setHandoverStatus(false, '3: Failed to add item to basket.');
    });
  }

  private setNectarPoints(points: number): void {
    if (points == 1) {
      this.nectarPoints = points.toString() + ' point';
    } else {
      this.nectarPoints = points.toString() + ' points';
    }
  }

  private createServiceModelFromData(service: JourneySearchResultService, priceToCompare: string): any {
    let changes;
    let ticketPrice;
    let ticketType;
    let ticketRestriction;
    let railcards;
    let faregroupId;

    if (service.changes == 0) {
      changes = 'Direct';
    } else if (service.changes == 1) {
      changes = service.changes + ' Change';
    } else {
      changes = service.changes + ' Changes';
    }

    service.otherfaregroups.forEach((fare) => {
      if (fare.cost.totalfare == priceToCompare) {
        ticketPrice = (fare.cost.totalfare / 100).toFixed(2);
        ticketType = fare.faregroupname;
        ticketRestriction = fare.routedescription;
        railcards = fare.railcards.join(', ');
        faregroupId = fare.faregroupid;
      }
    });

    return {
      arriveTime: service.arrivalDateTime.format('HH:mm'),
      changes,
      departureDate: service.departureDateTime.format('ddd D MMM YYYY'),
      departureDateTime: service.departureDateTime.format('ddd D MMM YYYY HH:mm'),
      departureTime: service.departureDateTime.format('HH:mm'),
      duration: service.durationLabel,
      faregroupId,
      railcards,
      ticketPrice,
      ticketRestriction,
      ticketType
    };
  }

  private setDataFromSearchResults(data: any): void {
    this.from = data.originName;
    this.to = data.destinationName;

    if (data.adults > 1) {
      this.passengers = data.adults + ' adults';
    } else {
      this.passengers = data.adults + ' adult';
    }

    if (data.children == 1) {
      this.passengers += ' and ' + data.children + ' child';

    } else if (data.children > 1) {
      this.passengers += ' and ' + data.children + ' children';
    }

    if (data.isopenreturn || data.isreturn) {
      this.typeOfJourney = 'Return';
      this.isReturnJourney = true;
    } else {
      this.typeOfJourney = 'Single';
      this.isReturnJourney = false;
    }

    if (data.isopenreturn) {
      this.returtType = 'Open Rtn';
      this.isOpenReturn = true;
    } else {
      this.returtType = 'Rtn';
      this.isOpenReturn = false;
    }
  }

  private createJourneySearch = function(params: any): JourneySearchCriteria {
    let criteria = new JourneySearchCriteria({
      adults: this.getNumberUrlParamater(params, 'adults'),
      children: this.getNumberUrlParamater(params, 'children'),
      destination: this.getStringUrlParamater(params, 'destination'),
      origin: this.getStringUrlParamater(params, 'origin'),
      outwardDepartAfter: (this.getStringUrlParamater(params, 'depart') === 'depart-after') ? true : false,
      railcards: []
    });

    let outwardTimeFromSearch = moment(this.getStringUrlParamater(params, 'time'));
    let outwardTimeDepartFromJourney = moment(this.getStringUrlParamater(params, 'sj-outbound-depart'));

    criteria.datetimedepart = outwardTimeFromSearch.isSame(outwardTimeDepartFromJourney, 'day') ? outwardTimeFromSearch : outwardTimeDepartFromJourney;

    let viaParam = this.getNumberUrlParamater(params, 'via');
    let avoidParam = this.getNumberUrlParamater(params, 'avoid');

    if (viaParam) {
      criteria.via = viaParam;
    } else if (avoidParam) {
      criteria.avoid = avoidParam;
    }

    if (this.getStringUrlParamater(params, 'isreturn')) {
      criteria.isreturn = true;

      if (this.getStringUrlParamater(params, 'isopenreturn')) {
        criteria.isopenreturn = true;
      } else {
        let returnTimeFromSearch = moment(this.getStringUrlParamater(params, 'returntime'));
        let returnTimeDepartFromJourney = moment(this.getStringUrlParamater(params, 'sj-return-depart'));

        criteria.returnDepartAfter = (this.getStringUrlParamater(params, 'return') === 'depart-after') ? true : false;
        criteria.datetimeReturn = returnTimeFromSearch.isSame(returnTimeDepartFromJourney, 'day') ? returnTimeFromSearch : returnTimeDepartFromJourney;
      }
    }

    if (params[ 'railcards' ]) {
      try {
        let cards = JSON.parse(params[ 'railcards' ]);
        (cards && cards.length > 0) ? this.railcardsAreUse = true : this.railcardsAreUse = false;
        if (this.railcardsAreUse) {
          criteria.railcards = cards;
        }
      } catch (err) { }
    }

    return criteria;
  };

  private createSelectedJourney = function(params: any): any {
    let selectedJourney = {
      basketTotal: this.getNumberUrlParamater(params, 'basket-total'),
      destination: this.getStringUrlParamater(params, 'destination'),
      origin: this.getStringUrlParamater(params, 'origin'),
      outboundArrive: this.getStringUrlParamater(params, 'sj-outbound-arrive'),
      outboundDepart: this.getStringUrlParamater(params, 'sj-outbound-depart'),
      returnArrive: this.getStringUrlParamater(params, 'sj-return-arrive'),
      returnDepart: this.getStringUrlParamater(params, 'sj-return-depart')
    };
    let fareGroups = this.getStringUrlParamater(params, 'fare-groups');

    if (fareGroups) {
      let fareGroupList = fareGroups.split('|');

      if (fareGroupList[ 0 ] && fareGroupList[ 0 ].split(',')[ 0 ].toLowerCase() === 'return') {
        selectedJourney[ 'outboundPrice' ] = Number(fareGroupList[ 0 ].split(',')[ 1 ]);
        this.returnJourneyPackage = true;
      }
      if (fareGroupList[ 0 ] && fareGroupList[ 0 ].split(',')[ 0 ].toLowerCase() === 'outward') {
        selectedJourney[ 'outboundPrice' ] = Number(fareGroupList[ 0 ].split(',')[ 1 ]);
      }
      if (fareGroupList[ 1 ] && fareGroupList[ 1 ].split(',')[ 0 ].toLowerCase() === 'inward') {
        selectedJourney[ 'returnPrice' ] = fareGroupList[ 1 ].split(',')[ 1 ] ? Number(fareGroupList[ 1 ].split(',')[ 1 ]) : null;
      }
    }

    return selectedJourney;
  };

  private setHandoverStatus(isSuccessful: boolean, reason: string): void {
    this.nreHandoffCompleted = true;
    this.showErrorMsg = !isSuccessful;
    this.analytics.gtmTrackEvent({
      event: 'nre-handoff',
      reason,
      successful: isSuccessful
    });
  }

  private selectJourney = (searchResults: JourneySearchResult): void => {
    this.searchResults = searchResults;

    let outboundService = _.find<JourneySearchResultService>(this.searchResults.outwardServices, {
      arrivalDateTime: moment(this.selectedJourney.outboundArrive),
      departureDateTime: moment(this.selectedJourney.outboundDepart)
    });
    let returnService = null;

    this.setDataFromSearchResults(this.searchResults.searchCriteria);

    if (outboundService) {
      this.selectedService = {};
      this.outwardData = this.createServiceModelFromData(outboundService, this.selectedJourney.outboundPrice);
      this.selectedService.outwardserviceid = outboundService.id;
      this.selectedService.outwardfaregroup = this.outwardData.faregroupId;
      this.selectedOutwardFare = _.find(outboundService.otherfaregroups, { faregroupid: this.selectedService.outwardfaregroup });

      if (!this.selectedOutwardFare) {
        this.showLoader = false;
        this.setHandoverStatus(false, '2: Outbound price not found.');
        return;
      }

      if (this.selectedJourney.returnDepart) {
        if (!this.returnJourneyPackage) {
          this.errorMessage = 'We\'re sorry but one of the chosen tickets is no longer available. Choose a different time or date of travel and search again.';
        }

        returnService = _.find<JourneySearchResultService>(this.searchResults.returnServices, {
          arrivalDateTime: moment(this.selectedJourney.returnArrive),
          departureDateTime: moment(this.selectedJourney.returnDepart)
        });

        if (returnService) {
          this.returnData = this.createServiceModelFromData(returnService, this.selectedJourney.returnPrice);
          this.selectedService.returnServiceId = returnService.id;
          this.selectedService.returnfaregroup = this.returnData.faregroupId;

          if (this.selectedJourney.returnPrice && !this.selectedService.returnfaregroup) {
            this.showLoader = false;
            this.setHandoverStatus(false, '2: Return price not found.');
            return;
          }
        }
      }

      if (this.selectedService.outwardfaregroup) {
        this.addToBasket(this.selectedService);
      }

    } else {
      this.showLoader = false;
      this.setHandoverStatus(false, '1: Outbound service not found.');
    }
  }

  private getSelectedServiceOutward(): IRouteDetailParams {
    return {
      serviceId: this.selectedService.outwardserviceid,
    };
  }

  private getSelectedServiceReturn(): IRouteDetailParams {
    return {
      serviceId: this.selectedService.returnServiceId,
    };
  }

  private setJourney(tripId: number): void {
    this.journey = this.journeySelectionService.getTrip(tripId);

    if (this.journey && this.journey.searchResults) {
      this.outwardRouteDetailsParams = this.getSelectedServiceOutward();
      this.returnRouteDetailsParams = this.getSelectedServiceReturn();
    }
  }

  private getAndClearBasket(): Observable<boolean> {
    return this.basketService.isBasketReady$
      .filter((basketReady) => !!basketReady)
      .switchMap(() => this.basketService.basket$).first()
      .pluck('trips')
      .switchMap((trips: Trip[]) => trips.length > 0 ? this.basketService.removeBasketTrips(trips) : Observable.of(null))
      .switchMap((removedBasket) => removedBasket ? this.basketService.refresh() : Observable.of(null));
  }

  private showStationNameOnError(inputData: any, errorReason: string): void {
    this.locationService.stations$.subscribe((data: Location[]) => {
      inputData.originName = this.findStationName(inputData.origin, data);
      inputData.destinationName = this.findStationName(inputData.destination, data);
      this.setDataFromSearchResults(inputData);
      this.showLoader = false;
      this.setHandoverStatus(false, errorReason);
    }, (error: any) => { throw error; });
  }

  private findStationName(code: string, inputArray: Location[]): string {
    let stationDetails = _.find<any>(inputArray, (stationObject) => stationObject.id == code);
    return stationDetails ? stationDetails.name : '';
  }

  private getUrlParameter(params: any, key: string): any {
    let value = params[ key ];
    return value ? decodeURIComponent(value) : null;
  }

  private getStringUrlParamater(params: any, key: string): string {
    let value = this.getUrlParameter(params, key);
    return value ? String(value) : null;
  }

  private getNumberUrlParamater(params: any, key: string): number {
    let value = this.getUrlParameter(params, key);
    return value ? Number(value) : null;
  }
}
