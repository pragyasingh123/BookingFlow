import {Injectable, Inject, Input} from '@angular/core';
import {Http, Response} from '@angular/http';
import {ReplaySubject, BehaviorSubject, Observable, Subject} from 'rxjs/Rx';
import {JourneySearchCriteria} from '../models/journey-search-criteria';
import {RetailhubApiService, IApiStandardFormat} from './retailhub-api.service';
import {BasketService} from './basket.service';
import {JourneySearchResult} from '../models/journey-search-result';
import {LatestAvailability} from '../models/latest-availability';
import {Location} from '../models/location';
import {RouteDetails} from '../models/route-details';
import {LocationService} from '../services/locations.service';
import {CONFIG_TOKEN} from '../constants';
import {UiService, UiServiceNotificationTypes} from '../services/ui.service';

@Injectable()
export class JourneyService {
  public disrutpionsMessage = new BehaviorSubject<string>('');
  public disruptionSearchQuery = new BehaviorSubject<any>(null);
  public isSearchInProgress$: BehaviorSubject<boolean>;
  public searchCriteria$: ReplaySubject<JourneySearchCriteria>;
  public searchResults$: BehaviorSubject<JourneySearchResult>;
  public disruptionsCurrentMessage = this.disrutpionsMessage.asObservable();
  public disruptionsCurrentSearchQuery = this.disruptionSearchQuery.asObservable();
  private latestAvailability$: BehaviorSubject<LatestAvailability>;
  private _isLatestAvailabilityInProgress: boolean;

  constructor(
    private retailhubApi: RetailhubApiService,
    private basketService: BasketService,
    private locationService: LocationService,
    @Inject(CONFIG_TOKEN) private config: any,
    private http: Http,
    private uiService: UiService
  ) {
    this.isSearchInProgress$ = new BehaviorSubject(false);
    this.searchResults$ = new BehaviorSubject<JourneySearchResult>(null);
    this.searchCriteria$ = new ReplaySubject<JourneySearchCriteria>(1);
    this.latestAvailability$ = new BehaviorSubject<LatestAvailability>(null);
    this._isLatestAvailabilityInProgress = false;
  }

  public search(searchParams: JourneySearchCriteria): Observable<JourneySearchResult> {
    this.isSearchInProgress$.next(true);
    this.searchCriteria$.next(searchParams);

    if (searchParams.isALink) {
      let returnDate;

      if (searchParams.isreturn && !searchParams.isopenreturn) {
        returnDate = searchParams.datetimeReturn.format();
      } else { returnDate = null; }

      let disruptionData = {
        DisplayMode: 'Qtt',
        OutwardJourneyDate: searchParams.datetimedepart.format(),
        ReturnJourneyDate: returnDate,
        StationCodes: [searchParams.origin, searchParams.destination],
        UseNlc: true
      };

      this.getDisruptions(disruptionData).subscribe((res) => {
        if (res && res.length > 0) {
          let disruptionText = ('' + res[0].Description).replace(/<a\s+href="/gi, '<a target="_blank" href="' + this.config.defaultSitecoreApiUrl);
          this.uiService.modal(disruptionText, true, UiServiceNotificationTypes.Info);
        }
      }, (error) => {
        throw(error);
      });
    }

    // We can only search when the basket is ready (since we need the sessiontoken on the request). So here we create
    // an observable that will only trigger when the basket ready$ object triggers true for the first time. Since the
    // ready$ is a BehaviourSubject, it will trigger with a ready/false immediately
    let searchObservable = this.basketService.isBasketReady$
      .filter((isReady) => isReady === true)
      .flatMap(() => {
        return this.retailhubApi.post('/rail/journeys/search', searchParams.toRetailhubJSON())
          .catch((error: Response) => {
            this.isSearchInProgress$.next(false);
            if (error.status === 500) {
              let result = error.json();

              if (result.errors && result.errors.length > 0 && result.errors[0].indexOf('20003') > -1) {
                this.searchResults$.next(new JourneySearchResult());
              }

              this.searchResults$.next(new JourneySearchResult());
            }

            this.populateSearchCriteria(searchParams);

            return Observable.throw(error);
          });
      })
      .map((data: any) => {
        return new JourneySearchResult(data.data);
      })
      .do((data) => {
        this.searchCriteria$.next(data.searchCriteria);
        this.searchResults$.next(data);
        this.isSearchInProgress$.next(false);
      })
      // Since we have searchResult$ class property, we want to perform the search even if nothing subscribes to the
      // returned observable from his method.
      .publishReplay().refCount();

    return searchObservable;
  }

  public extendSearch(url: string): Observable<JourneySearchResult> {
    this.isSearchInProgress$.next(true);

    let searchObservable = this.retailhubApi.get(url, null).catch((error: Response) => {
        return Observable.throw(error.json());
      })
      .map((data: any) => {
        return new JourneySearchResult(data.data);
      }).do((data) => {

        this.searchCriteria$.next(data.searchCriteria);
        this.searchResults$.next(data);
        this.isSearchInProgress$.next(false);
      }).publishReplay().refCount();

    // Since we have searchResult$ class property, we want to perform the search even if nothing subscribes to the
    // returned observable from his method. By publishing and connecting, we ensure that the request will always be
    // carried out. Consumers of this can optionally subscribe to the returned observable or the searchResult$ results
    // searchObservable.publish().connect();

    return searchObservable;
  }

  public getRouteDetails(journeydetailsuri: string, legFacilities?: any): Observable<RouteDetails> {
    // use the same BehaviorSubject as the search as they will never be in use at the same time
    this.isSearchInProgress$.next(true);

    let serviceDetailsObservable = this.retailhubApi.get(journeydetailsuri)
      .map((data: any) => {
        return new RouteDetails(data.data, legFacilities);
      }).do((data) => {
        this.isSearchInProgress$.next(false);
      });

    return serviceDetailsObservable;
  }

  public getLowestLatestAvailability(): Observable<LatestAvailability> {
    if (!this.latestAvailability$.getValue() && !this._isLatestAvailabilityInProgress) {
      this._isLatestAvailabilityInProgress = true;
      this.retailhubApi.get('/booking/lowestlatestavailability')
        .subscribe((data: any) => {
          this.latestAvailability$.next(new LatestAvailability(data.data));
          this._isLatestAvailabilityInProgress = false;
        }, (err) => {
          this._isLatestAvailabilityInProgress = false;
        });
    }

    return this.latestAvailability$.first((la) => la !== null);
  }

  public getDisruptions(data): Observable<any> {
    return this.http.post(this.config.defaultSitecoreApiUrl + '/api/affectingJourney/check', data)
      .map((data) => {
        return data.json();
      });
  }

  public sendDisruptionMessage(message: string): void {
    this.disrutpionsMessage.next(message);
  }

  public sendSearchQueryOptions(data: any): void {
    this.disruptionSearchQuery.next(data);
  }

  private populateSearchCriteria(searchParams: JourneySearchCriteria): void {
    this.locationService.stations$.subscribe((locations: Location[]) => {
        searchParams.originName = locations.find((it) => it.id === searchParams.origin).name;
        searchParams.destinationName = locations.find((it) => it.id === searchParams.destination).name;

        this.searchCriteria$.next(searchParams);
    });
  }
}
