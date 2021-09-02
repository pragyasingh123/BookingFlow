import { Injectable } from '@angular/core';
import { ReplaySubject, BehaviorSubject, Observable } from 'rxjs/Rx';
import { JourneySearchCriteria } from '../models/journey-search-criteria';
import { RetailhubApiService } from './retailhub-api.service';
import * as moment from 'moment';
import { JourneySearchResult } from '../models/journey-search-result';
import { JourneySearchResultService } from '../models/journey-search-result-service';
import { Router } from '@angular/router';

const API_DATE_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

@Injectable()
export class CheapestFareFinderService {
  public isCheckInProgress$: BehaviorSubject<boolean>;
  public isSearchInProgress$: BehaviorSubject<boolean>;
  public searchCriteria$: BehaviorSubject<JourneySearchCriteria>;
  public isCffRoute$: ReplaySubject<boolean>;
  public searchResults$: BehaviorSubject<ICffJourneySearchResult[]>;
  public multidaysResults$: BehaviorSubject<{ [key: string]: any }>;
  public isConfigReady$: Observable<boolean>;
  public cachingPeriod: number = 1440; // in minutes
  public qttParams: any;
  private flows: any;

  constructor(private retailhubApi: RetailhubApiService, private router: Router) {
    this.isSearchInProgress$ = new BehaviorSubject(false);
    this.isCheckInProgress$ = new BehaviorSubject(false);
    this.isCffRoute$ = new ReplaySubject<boolean>(1);
    this.searchCriteria$ = new BehaviorSubject<JourneySearchCriteria>(null);
    this.searchResults$ = new BehaviorSubject([]);
    let storedResults = localStorage.getItem('multidaysResults');
    this.multidaysResults$ = new BehaviorSubject(storedResults ? JSON.parse(storedResults) : {});

    this.searchCriteria$
      .filter((searchCriteria: JourneySearchCriteria) => searchCriteria !== null)
      .distinctUntilChanged()
      .subscribe((searchCriteria: JourneySearchCriteria) => this.isCffRoute(searchCriteria));
  }

  public amendSelection(): void {
    this.router.navigate(['/qtt', this.qttParams]);
  }

  public toggleFares(type: string): void {
    if (type === 'all') {
      this.router.navigate(['/search', this.qttParams]);
    }
  }

  public getMultidays(
    origin: number,
    destination: number,
    from: moment.Moment,
    to: moment.Moment,
    adults: number = 1,
    children: number = 0
  ): Observable<IDayFromApiResponse[]> {
    const results$ = new BehaviorSubject<any>(null);
    const timeFrom = from.isBefore(moment()) ? moment().add(1, 'hour') : from;
    const key = origin + '|' + destination + '|' + adults + '|' + children + '|' + timeFrom.format('YYYYMM');
    const body = {
      datetimefrom: timeFrom.format(API_DATE_FORMAT),
      datetimeto: to.format(API_DATE_FORMAT),
      locfrom: origin,
      locto: destination,
      passengergroup: [{ adults, children, numberofrailcards: '0', originalfareid: '0', railcardcode: '' }],
      period: 'AllDay'
    };

    this.isSearchInProgress$.next(true);
    let cachedResults = this.multidaysResults$.getValue();
    const allowedCacheTime = moment().subtract(this.cachingPeriod, 'minutes');
    if (cachedResults[key] && cachedResults[key]['cached_on'] && moment(cachedResults[key]['cached_on']).isAfter(allowedCacheTime)) {
      setTimeout(() => {
        results$.next(cachedResults[key]['days']);
        this.isSearchInProgress$.next(false);
      }, 1000);
    } else {
      this.retailhubApi.post('/rail/journeys/multidays', body, null).subscribe(
        (data) => {
          let days = [];
          data.data['daysummaries'].forEach((daysummary) => {
            const day = {
              cheapestfirst: '',
              cheapeststandard: '',
              date: daysummary.date.substring(0, 10),
              ischeapestfirst: false,
              ischeapeststandard: false,
              iseligible: false,
              ispromotional: false,
              pricecheapest: '',
            };
            const isEligible = daysummary.cheapeststandard < 2147483647 && daysummary.cheapestfirst < 2147483647;
            if (isEligible) {
              day.iseligible = true;
              day.cheapeststandard = (daysummary.cheapeststandard / 100).toFixed(2);
              day.cheapestfirst = (daysummary.cheapestfirst / 100).toFixed(2);
              day.pricecheapest = (daysummary.pricecheapest / 100).toFixed(2);
              day.ischeapeststandard = daysummary.ischeapest;
              day.ischeapestfirst = daysummary.ischeapest;
              day.ispromotional = daysummary.ispromotional;
            }
            days.push(day);
          });
          cachedResults = this.multidaysResults$.getValue();
          cachedResults[key] = { cached_on: moment(), days };
          this.multidaysResults$.next(cachedResults);
          localStorage.setItem('multidaysResults', JSON.stringify(cachedResults));
          results$.next(days);
          this.isSearchInProgress$.next(false);
        }, (error) => {
          results$.next({ error });
          this.handleError(error);
          this.isSearchInProgress$.next(false);
        }
      );
    }
    return Observable.from(results$)
      .filter((x) => x != null)
      .take(1);
  }

  public getMultiday(
    origin: number,
    destination: number,
    when: moment.Moment,
    departAfter: boolean,
    adults: number = 1,
    children: number = 0,
    closestCount: number = 2
  ): void {
    const body = {
      locfrom: origin,
      locto: destination,
      passengergroup: [{ adults, children, numberofrailcards: '0', originalfareid: '0', railcardcode: '' }],
      period: 'AllDay',
      searchdate: when.format(API_DATE_FORMAT)
    };

    this.isSearchInProgress$.next(true);

    this.retailhubApi.post('/rail/journeys/multiday', body, null).subscribe(
      (data: any) => {
        // find cheapest price
        let cffPrice = Infinity;
        data.data.journeys.forEach((journey) => {
          journey.cheapfares.forEach((cheapestFare) => {
            const cf = parseInt(cheapestFare.totalfare, 10);
            cffPrice = cf < cffPrice ? cf : cffPrice;
          });
        });
        // filter proper journeys which price is lower/equal then cheapest price
        const journeys = data.data.journeys
          .filter((journey) => journey.cheapfares[0].totalfare <= cffPrice || journey.cheapfares[1].totalfare <= cffPrice)
          .map((journey) => this.mapToCffJourney(journey));

        this.searchResults$.next(this.markClosest(journeys, this.searchCriteria$.value.datetimedepart, closestCount));
        this.isSearchInProgress$.next(false);
      },
      (error) => {
        this.handleError(error);
        this.searchResults$.next(null);
        this.isSearchInProgress$.next(false);
      }
    );
  }

  public updateSearch(criteria: JourneySearchCriteria): void {
    this.searchCriteria$.next(criteria);
  }

  public findAvailableTicket(journey: ICffJourneySearchResult, isFirstClass: boolean): Observable<IAvailableServiceResponse> {
    const fareGroupNames = {
      first: '1st Class Advance Single',
      standard: 'Standard Class Advance Single'
    };

    return this.retailhubApi
      .post('/rail/journeys/search', this.mapToCriteria(journey).toRetailhubJSON())
      .map((data: any) => new JourneySearchResult(data.data))
      .take(1)
      .map((searchResults: JourneySearchResult) => {
        let output = null;
        const service = searchResults.allServices.find(
          (serviceData) =>
            journey.datetimefrom.isSame(serviceData.departureDateTime) && journey.datetimeto.isSame(serviceData.arrivalDateTime)
        );
        if (service) {
          const fareGroupName = isFirstClass ? fareGroupNames.first : fareGroupNames.standard;
          const fareGroup = service.otherfaregroups.find((fare) => fare.faregroupname === fareGroupName);
          if (fareGroup) {
            output = {
              searchResults,
              selectedService: service,
              service: {
                outwardfaregroup: fareGroup.faregroupid,
                outwardserviceid: service.id
              }
            };
          }
        }

        return output;
      });
  }

  public findService(journey: ICffJourneySearchResult): Observable<JourneySearchResultService> {
    return this.retailhubApi
      .post('/rail/journeys/search', this.mapToCriteria(journey).toRetailhubJSON())
      .map((data: any) => new JourneySearchResult(data.data))
      .take(1)
      .map((searchResults: JourneySearchResult) =>
        searchResults.allServices.find(
          (serviceData) =>
            journey.datetimefrom.isSame(serviceData.departureDateTime) && journey.datetimeto.isSame(serviceData.arrivalDateTime)
        )
      );
  }

  public getToggleOptions(): any {
    return [{ value: 'all', label: 'All fares' }, { value: 'cheapest', label: 'Cheapest fare finder' }];
  }

  private markClosest(journeys: ICffJourneySearchResult[], when: moment.Moment, count: number = 2): ICffJourneySearchResult[] {
    const clonedJourneys = [...journeys];
    // firstly check the query time and if it's not present then compare with passed argument
    const queryOptions = JSON.parse(window.localStorage.getItem('queryOptions'));
    const time = queryOptions ? moment(queryOptions.time) : when;
    const getTime = (dateTime: moment.Moment): moment.Moment => moment({ h: dateTime.hours(), m: dateTime.minutes() });

    let counter = 0;
    const hasClosestTrip = clonedJourneys.some((journey) => {
      if (clonedJourneys.length <= count || getTime(journey.datetimefrom).isAfter(getTime(time), 'minutes')) {
        journey.closest = true;
        counter++;
      }
      return counter === 2;
    });

    if (!hasClosestTrip) {
      clonedJourneys.some((journey) => {
        journey.closest = true;
        counter++;
        return counter === 2;
      });
    }

    return clonedJourneys;
  }

  private mapToCffJourney(journeyResult: any): ICffJourneySearchResult {
    const standardClass = journeyResult.cheapfares.find((fare) => fare.type === 'S');
    const firstClass = journeyResult.cheapfares.find((fare) => fare.type === 'F');
    const duration = moment.duration(journeyResult.duration, 'minutes');
    return {
      changes: journeyResult.changes,
      closest: false,
      datetimefrom: moment(journeyResult.datetimefrom),
      datetimeto: moment(journeyResult.datetimeto),
      duration,
      durationhum: duration.get('hours') ? duration.get('hours') + 'h ' + duration.get('minutes') + 'm' : duration.get('minutes') + 'm',
      first: {
        availability: firstClass.availability,
        code: firstClass.tickettypecode,
        fare: firstClass.totalfare,
        selected: false,
        type: firstClass.type
      },
      ispromotional: journeyResult.ispromotional,
      lastchecked: moment(journeyResult.lastchecked),
      locfrom: journeyResult.locfrom,
      locto: journeyResult.locto,
      standard: {
        availability: standardClass.availability,
        code: standardClass.tickettypecode,
        fare: standardClass.totalfare,
        selected: false,
        type: standardClass.type
      }
    };
  }

  private mapToCriteria(journeyResult: ICffJourneySearchResult): JourneySearchCriteria {
    const cffCriteria = this.searchCriteria$.value;
    return JourneySearchCriteria.from({
      adults: cffCriteria.adults,
      children: cffCriteria.children,
      datetimedepart: moment(journeyResult.datetimefrom.clone()),
      destination: journeyResult.locto.toString(),
      isreturn: false,
      origin: journeyResult.locfrom.toString(),
      outwardDepartAfter: true
    });
  }

  private handleError(error): void {
    throw error;
  }

  private isCffRoute(searchCriteria: JourneySearchCriteria): void {
    if (searchCriteria) {
      if (searchCriteria.isopenreturn || searchCriteria.isreturn) {
        this.isCffRoute$.next(false);
      } else {
        const checkFlow = () => {
          const hasCheapestFareFinder = this.flows.data['multidayflow'].some(
            (flow) => flow.fromnlc === searchCriteria.origin && flow.tonlc === searchCriteria.destination
          );
          this.isCffRoute$.next(hasCheapestFareFinder);
        };

        const getAndCheckFlows = () => {
          this.retailhubApi.get('/rail/journeys/multiday/flows').subscribe(
            (data) => {
              this.flows = data;
              checkFlow();
            },
            (error) => {
              this.handleError(error);
              this.isCffRoute$.next(false);
            }
          );
        };

        if (this.flows) {
          checkFlow();
        } else {
          getAndCheckFlows();
        }
      }
    }
  }
}

export interface ICffJourneySearchResult {
  changes: number;
  duration: moment.Duration;
  durationhum: string;
  datetimefrom: moment.Moment;
  datetimeto: moment.Moment;
  locfrom: number;
  locto: number;
  standard: ICffJourneySearchFare;
  first: ICffJourneySearchFare;
  lastchecked: moment.Moment;
  ispromotional: boolean;
  closest: boolean;
}

export interface ICffJourneySearchFare {
  fare: number;
  code: string;
  type: string;
  availability: number;
  selected: boolean;
  isAvailable?: boolean;
  isSoldOut?: boolean;
}

export interface IDayFromApiResponse {
  date: string;
  cheapeststandard: string;
  cheapestfirst: string;
  pricecheapest: string;
  ischeapeststandard: boolean;
  ischeapestfirst: boolean;
  iseligible: boolean;
  ispromotional: boolean;
}

export interface IAvailableServiceResponse {
  searchResults: JourneySearchResult;
  service: {
    outwardserviceid: number;
    outwardfaregroup: string;
  };
  selectedService: JourneySearchResultService;
}
