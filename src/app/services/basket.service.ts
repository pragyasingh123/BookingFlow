import { Injectable } from '@angular/core';
import { Inject } from '@angular/core';
import { RequestOptionsArgs, Response as httpResponse, URLSearchParams } from '@angular/http';
import { CookieService } from 'angular2-cookie/core';
import { BehaviorSubject, Observable, Subject, ConnectableObservable } from 'rxjs/Rx';
import { Basket } from '../models/basket';
import { DeliveryOption, IDeliveryOptionApiResponse, IItsoLocations } from '../models/delivery-option';
import { Device } from 'ng2-device-detector/src/index';
import { ISleeperSupplementGetRequest, ISleeperSupplementGetResponse, SleeperSupplementGetResponse } from '../models/sleeper-supplement-get';
import { Trip } from '../models/trip';
import { IExtraGetRequest, ExtraGetResponse, IExtraGetResponse } from '../models/trip/extra-get';
import { IExtraPutApiRequest, IExtraPutResponse, ExtraPutResponse, IAdditionalOptionItemSelections, ExtraPutRequest } from '../models/trip/extra-put';
import { IReservationPostApiRequest, ReservationPostResponse, IReservationPostResponse } from '../models/trip/reservation-post';
import { RetailhubApiService } from './retailhub-api.service';
import { UserService } from './user.service';
import { JourneySelectionService } from './journey-selection-service';
import { CONFIG_TOKEN } from '../constants';
import * as _ from 'lodash';
import 'whatwg-fetch';
import { InitiatePaymentCriteria } from '../models/initiate-payment-criteria';
import { NreHelper } from './nre-helper/nre-helper';

@Injectable()
export class BasketService {
  public isBasketReady$: Observable<boolean>;
  public isBasketRefreshing$: BehaviorSubject<boolean>;
  public basket$: ConnectableObservable<Basket>;
  public basketSubject$: Subject<Basket>;
  public _refreshDeliveryOptions$: Subject<any>;
  public deliveryOptions$: Observable<DeliveryOption[]>;
  public isDeliveryOptionsLoading$: BehaviorSubject<boolean>;
  private _refreshBasketSubject: Subject<number>;
  private _isBasketReady$: BehaviorSubject<boolean>;
  private _onBasketReady$: Observable<boolean>;
  private basket: Basket;
  private itsoLocations: IItsoLocations[];

  constructor(
    private _retailhubApi: RetailhubApiService,
    private userService: UserService,
    private cookieService: CookieService,
    private journeySelectionService: JourneySelectionService,
    private device: Device,
    @Inject(CONFIG_TOKEN) private config: any
  ) {
    // Tell the app when the basket is ready.
    // Private for us to push changes into.
    this._isBasketReady$ = new BehaviorSubject<boolean>(false);

    this._refreshBasketSubject = new Subject<number>();

    // We expose a readonly Observable that only emits distinct changes (ie changing from false -> true)
    this.isBasketReady$ = Observable.from<boolean>(this._isBasketReady$).distinctUntilChanged();

    // Observable to know if basket is being refreshed (wired into the refresh stream)
    this.isBasketRefreshing$ = new BehaviorSubject<boolean>(true);
    this._refreshBasketSubject.subscribe(() => this.isBasketRefreshing$.next(true));

    // Have a refresh delivery options that we can trigger manually, but also runs everytime the basket is refreshed
    this._refreshDeliveryOptions$ = new BehaviorSubject<any>(1);

    // For convenience on delivery options page
    this.isDeliveryOptionsLoading$ = new BehaviorSubject(true);

    // Convenience observable for requests that simply need to fire when the config/basket is ready
    this._onBasketReady$ = this.isBasketReady$.first((ready) => ready === true);

    // Fetch the delivery options based on whenever the basket details are refreshed or manual trigger
    this.deliveryOptions$ = this._refreshDeliveryOptions$
      .merge(this._refreshBasketSubject)
      .flatMap(() => this._onBasketReady$)
      .flatMap(() => {
        this.isDeliveryOptionsLoading$.next(true);
        return this._retailhubApi.get('/customer/basket/deliveryoptions')
          .map((response: any) => {
            return _.map(response.data.deliveryoptions, (item: IDeliveryOptionApiResponse) => new DeliveryOption(item));
          }).do(() => {
            this.isDeliveryOptionsLoading$.next(false);
          });
      });

      this.basketSubject$ = new Subject<Basket>();
      // Basket is observable with an initial value (to fetch immediately on subscribe)
      this.basket$ = Observable.of<number>(1)
      .merge(this._refreshBasketSubject)
      .flatMap(() => this._retailhubApi.get('/customer/basket'))
      .map((response: any) => new Basket(this.config, response.data))
      .do((basket) => {
        this.basket = basket;
        this.basketSubject$.next(basket);
        this._isBasketReady$.next(true);
        this.isBasketRefreshing$.next(false);
        this.isAmendMode();
      })
      .publishReplay(1);

    this.basket$.connect();
  }

  public getItsoLocations(): IItsoLocations[] {
    return this.itsoLocations;
  }

  public myAccountUrl(): any {
    return this.config.myAccount;
  }

  public refresh(): Observable<Basket> {
    this._refreshBasketSubject.next(1);
    return this.basket$;
  }

  public routeToMyAccount(): void {
    window.location.href = this.myAccountUrl();
  }

  public isBasketEmpty(): boolean {
    if (!this.basket) {
      return true;
    }

    return this.basket.trips.length === 0;
  }

  public isAmendMode(): void {
    if (this.basket.ischangeofjourney && this.basket) {
      let additionalOptionItemSelections: IAdditionalOptionItemSelections = {
        additionaloptionitemselection: [{
          directiontype: 'O',
          id: this.basket.adminFeePrice.id,
          numberof: 0,
          numberofadults: 0,
          numberofchildren: 0,
          state: 'Selected'
        }]
      };

      let extraPutRequest = new ExtraPutRequest(1, additionalOptionItemSelections);
      this.putExtra(extraPutRequest).subscribe((res) => { });
    }
  }

  public totalTrips(): number {
    if (this.basket) { return this.basket.trips.length; } else { return -1; }
  }

  public findTrip(tripId): Observable<Trip> {
    return this.basket$
      .map((basket) => _.find(basket.trips, { id: Number(tripId) }))
      .filter((trip) => !!trip);
  }

  public removeTrip(tripId: any): Observable<Trip> {
    let options = {} as RequestOptionsArgs;

    options.body = {
      data: {
        tripnumber: tripId
      }
    };

    return this._onBasketReady$
      .flatMap(() => this._retailhubApi.delete('/customer/basket', options))
      .map((response: any) => {
        return response;
      })
      .do(() => {
        NreHelper.removeNreVisualFLag();
        // Refresh the basket after a successful addition
        this.refresh();
      });
  }

  public updateTrip(tripId: any, data: any): Observable<number> {
    let options = {} as RequestOptionsArgs;

    options.body = {
      data: {
        tripnumber: tripId
      }
    };

    return this._onBasketReady$
      .flatMap(() => this._retailhubApi.delete('/customer/basket', options))
      .flatMap(() => this._retailhubApi.post('/customer/basket', data))
      .map((response: any) => {
        return response.data;
      })
      .do(() => {
        // Refresh the basket after a successful addition
        this.refresh();
      });
  }

  public removeBasketTrips(trips: any): Observable<any> {
    let options = {} as RequestOptionsArgs;

    let observableBatch = [];
    // create a obserable for each request
    trips.forEach((trip, key) => {
      options.body = {
        data: {
          tripnumber: 1
        }
      };

      observableBatch.push(this._retailhubApi.delete('/customer/basket', options));
      return Observable.forkJoin(observableBatch);
    });

    // return obserable when all request complete
    return Observable.forkJoin(observableBatch);
  }

  public fetchExtras(extraGet: IExtraGetRequest): Observable<IExtraGetResponse> {
    let options = {} as RequestOptionsArgs;
    let params = new URLSearchParams();
    params.set('tripno', String(extraGet.tripId));
    options.search = params;

    return this._onBasketReady$
      .flatMap(() => this._retailhubApi.get('/customer/basket/journey/addons', options))
      .map((response: any) => {
        return new ExtraGetResponse(this.extractData(response));
      })
      .share();
  }

  public fetchSleeperSupplements(sleeperSupplementGet: ISleeperSupplementGetRequest): Observable<ISleeperSupplementGetResponse> {
    let options = {} as RequestOptionsArgs;
    let params = new URLSearchParams();
    params.set('tripno', String(sleeperSupplementGet.tripId));
    options.search = params;

    return this._onBasketReady$
      .flatMap(() => this._retailhubApi.get('/customer/basket/journey/sleepersupplements', options))
      .map((response: any) => {
        return new SleeperSupplementGetResponse(this.extractData(response));
      });
  }

  public addReservation(reservationPost: IReservationPostApiRequest): Observable<IReservationPostResponse> {
    return this._onBasketReady$
      .flatMap(() => this._retailhubApi.post('/customer/basket/journey/reservation', reservationPost))
      .map((response: any) => {
        return new ReservationPostResponse(response.data);
      })
      .do(() => {
        // Refresh the basket after a successful addition
        this.refresh();
      });
  }

  public putExtra(extraPut: IExtraPutApiRequest): Observable<IExtraPutResponse> {
    return this._onBasketReady$
      .flatMap(() => this._retailhubApi.put('/customer/basket/journey/addons', extraPut))
      .map((response: any) => {
        return new ExtraPutResponse(response.data);
      })
      .do(() => {
        // Refresh the basket after a successful addition
        this.refresh();
      });
  }

  public fetchTicketFullTerms(ticketCode?): Observable<any> {
    return this._retailhubApi.get('/rail/tickettype/fullterms/' + ticketCode)
      .map((data: any) => {
        return data;
      });
  }

  public refreshDeliveryOptions(): Observable<DeliveryOption[]> {
    this._refreshDeliveryOptions$.next(1);
    return this.deliveryOptions$;
  }

  public initiatePayment(data: InitiatePaymentCriteria): Observable<any> {
    data.isNreReferrer = NreHelper.checkIfNreSystemFlagIsSet();
    data.device = 'Desktop';

    if (this.device.isTablet()) {
      data.device = 'Tablet';
    } else if (this.device.isMobile()) {
      data.device = 'Mobile';
    }

    // initiate payment
    return this._retailhubApi.post('/payment/initiate', data)
      .map((response: any) => {
        return response;
      });
  }

  public checkBasketJourneysStatus(): Observable<any> {
    return this._retailhubApi.put('/customer/basket/journeys/status', {}).map((response: any) => {
      // do not block ticket purchase if there are issuescheckingjourney status
      return response.data ? response.data.status : 'ok';
    }).catch(() => Observable.of('ok'));
  }

  public getPaymentResult(storageKey: string): Observable<any> {
    let options = {} as RequestOptionsArgs;
    let params = new URLSearchParams();
    params.set('storagekey', String(storageKey));
    options.search = params;

    return this._retailhubApi.get('/payment/result', options)
      .map((response: any) => {
        return response;
      });
  }

  public addServiceToBasket(data: any): Observable<any> {
    return this._retailhubApi.post('/customer/basket', data)
      .map((response: any) => {
        return response.data.tripno;
      })
      .do(() => {
        // Refresh the basket after a successful addition
        this.refresh();
      });
  }

  public setDeliveryOption(data: ISetDeliveryOptionTod | ISetDeliveryOptionPost | ISetDeliveryOptionMobile | ISetDeliveryOptionETicket) {
    return this._retailhubApi.post('/customer/basket/deliveryoptions', data).catch( (err: any) => {
      return Observable.throw(err);
    }).do(() => {
        this.refresh();
      });
  }

  public setDeliverySelfPrint(data: ISetDeliveryOptionSelfPrint[]) {
    let observableBatch = [];
    // create a obserable for each request
    data.forEach((trip, key) => {
      observableBatch.push(this._retailhubApi.put('/customer/basket/journey/selfprintpassengers', trip));
      return Observable.forkJoin(observableBatch);
    });

    // return obserable when all request complete
    return Observable.forkJoin(observableBatch);
  }

  public cancelAmendBooking(): Observable<any> {
    return this._onBasketReady$
      .flatMap(() => this._retailhubApi.delete('/booking/cancelamendjourney', null))
      .map((response: any) => {
        if (this.cookieService.get('amend-session') && response.data.successful) {
          this.cookieService.remove('amend-session');
        }
        return response;
      });
  }

  public purchaseBooking(data: any): Observable<any> {
    let options = {} as RequestOptionsArgs;
    let params = new URLSearchParams();
    params.set('bookingreference', String(data.BookingReference));
    options.search = params;

    return this._retailhubApi.get('/booking/purchase', options)
      .map((response: any) => {
        return response;
      });
  }

  public clearBasketSession(): Observable<Basket> {
    this._retailhubApi.clearSession();
    this.userService.removeUserCookie();
    this.journeySelectionService.clearTrips();

    return this.refresh();
  }

  public seatSelectorUrl(data: any): Observable<any> {
    return this._retailhubApi.post('/customer/purchase/seatmaps', data).map((response: any) => {
      return response;
    });
   }

  private extractData(res: any) {
    return res.data || {};
  }
}

export interface ISetDeliveryOptionTod {
  deliveryoptionid: number;
  todlocationnlc: string;
}

export interface ISetDeliveryOptionMobile {
  deliveryoptionid: number;
  mobiledeviceid: number;
}

export interface ISetDeliveryOptionETicket {
  deliveryoptionid: number;
  todlocationnlc: string;
}

export interface ISetDeliveryOptionSelfPrint {
  tripno?: number;
  selfprintpassengers: {
    'PassengerDetail': Array<{
      'iddetails': string,
      'idname': string,
      'isadult': string,
      'isleadpassenger': string,
      'railcardcode': string,
      'rspidtype': string
    }>
  };
}

export interface ISetDeliveryOptionPost {
  deliveryoptionid: number;
  rememberdeliveryaddress: number;
  deliveryaddress: {
    address: {
      addressee: string,
      addressline1: string,
      addressline2?: string,
      addressline3?: string,
      town: string,
      region?: string,
      postcode: string,
      countrycode: string,
      country?: string,
      isdefault: string,
      addresstype: string
    }
  };
}
