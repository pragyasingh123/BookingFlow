import { Trip, ITripApiResponse } from './trip';
import { DeliveryOption, IDeliveryOptionApiResponse, IBasketDeliveryApiResponse } from './delivery-option';
import * as _ from 'lodash';
import * as moment from 'moment';
import { EVoucher } from './evoucher';
import { ISmartcardsListItem } from '../services/user.service';

export class Basket {
  public isEmpty: boolean = true;
  public totalCostPence: number = 0;
  public totalCost: number = 0;
  public totalEVoucherCost: number = 0;
  public totalCardPaymentCost: number = 0;
  public totalOnlinePaymentCost: number = 0;
  public paymentSourceType: string;
  public selectedDeliveryOption: DeliveryOption;
  public itsoInfo: ISmartcardsListItem;
  public plusBusAvailableOnSomeTrips = false;
  public travelcardAvailableOnSomeTrips = false;
  public closestTripOutwardMoment: moment.Moment;
  public trips: Trip[] = [];
  public evouchers: EVoucher[] = [];
  public loyaltyPoints: number = 0;
  public basketAddress: any;
  public todLocation: string;
  public state: string;
  public amendPriceAvailble: boolean = false;
  public amendFee: any;
  public ischangeofjourney: boolean = false;
  public basketDiscountAmount: number;
  public adminFeePrice: any;
  private _lastApiResponse: IBasketApiResponse = null;

  constructor(private config: any, apiResponse?: IBasketApiResponse) {
    if (apiResponse && apiResponse.state !== 'Empty') {
      this._lastApiResponse = apiResponse;
      this.isEmpty = false;
    } else {
      return;
    }

    this.ischangeofjourney = apiResponse.ischangeofjourney;
    this.basketDiscountAmount = apiResponse.basketdiscount.basketdiscountamountinpence;
    this.state = apiResponse.state;
    this.init();
  }

  private init() {
    this.parsePrices();
    this.parseTrips();
    this.parseDelivery();
    this.parseLoyaltyPoints();
    this.parseAmendPaymentFee();
    this.parseEVoucher();
    this.parseOnlinePayments();

    this.plusBusAvailableOnSomeTrips = _.some(this.trips, { plusBusAllowed: true });
    this.travelcardAvailableOnSomeTrips = _.some(this.trips, { travelcardAllowed: true });
  }

  private parseDelivery() {
    // Use _.get() because depending on basket state, the selected or delivery objects may not exist
    let selectedDeliveryOption: IBasketDeliveryApiResponse = _.get<IBasketDeliveryApiResponse>(this._lastApiResponse, 'basketdelivery');
    if (selectedDeliveryOption.itsosmartcarddetails) {
      this.itsoInfo = selectedDeliveryOption.itsosmartcarddetails;
    }
    let basketAddress: IDeliveryOptionApiResponse = _.get<IDeliveryOptionApiResponse>(this._lastApiResponse, 'basketdelivery.address');
    if (selectedDeliveryOption.selecteddeliveryoption) {
      this.selectedDeliveryOption = new DeliveryOption(selectedDeliveryOption.selecteddeliveryoption);
      this.basketAddress = basketAddress;
    }

    // Basket pickup location
    this.todLocation = _.get<string>(this._lastApiResponse, 'basketdelivery.todlocationnlc');
  }

  private parseAmendPaymentFee(): void {
    this.adminFeePrice = _.find(this._lastApiResponse.basketdetails[ 0 ].basketoptionalitems, { name: 'AdminFee' });

    if (this.adminFeePrice) {
      this.amendFee = Number(this.adminFeePrice.cost) / 100;
    }
  }

  private parsePrices(): void {
    this.totalCostPence = this._lastApiResponse.totalcostpence;
    this.totalCost = this.totalCostPence / 100;
  }

  private parseTrips(): void {
    if (!this._lastApiResponse.basketdetails || this._lastApiResponse.basketdetails.length === 0) {
      // No trips in basket
      return;
    }

    for (var i = 0; i < this._lastApiResponse.basketdetails.length; i++) {
      this.trips.push(new Trip(this._lastApiResponse.basketdetails[ i ]));
    }

    this.closestTripOutwardMoment = _.minBy<Trip>(this.trips, (trip: Trip) => {
      return trip.outwardDepartureTime.unix();
    }).outwardDepartureTime;
  }

  private parseLoyaltyPoints(): void {
    if (!this._lastApiResponse.nectarpointsearned) {
      return;
    }

    for (var i = 0; i < this._lastApiResponse.nectarpointsearned.length; i++) {
      this.loyaltyPoints += parseInt(this._lastApiResponse.nectarpointsearned[i].bankedpoints);
    }
  }

  private parseEVoucher(): void {
    if (!this._lastApiResponse.basketpaymentdetails
      || !this._lastApiResponse.basketpaymentdetails.evouchers
      || this._lastApiResponse.basketpaymentdetails.evouchers.length === 0) {
      // No evochers in basketpaymentdetails
      return;
    }

    this.totalEVoucherCost = this._lastApiResponse.totalcostpence / 100;
  }

  private parseOnlinePayments(): void {
    if (!this._lastApiResponse.basketpaymentdetails
      || !this._lastApiResponse.basketpaymentdetails.onlinepaymentdetails
      || this._lastApiResponse.basketpaymentdetails.onlinepaymentdetails.length === 0) {
      // No online payments in basketpaymentdetails
      return;
    }

    this.totalOnlinePaymentCost = this._lastApiResponse.totalcostpence / 100;
  }
}

export interface IBasketApiResponse {
  'rhresponse': {
    'clienttransactionid': void,
    'statuscode': string,
    'errors': void
  };
  'appliedbookingfees': {
    'basketbookingfees': number,
    'journeysbookingfees': number,
    'maxnumberofpassenger': number,
    'numberofjourneys': number,
    'passengersbookingfees': number,
    'totalbookingfees': number
  };
  'basketdetails': ITripApiResponse[];
  'basketdelivery': {
    'deliverycost': string,
    'itsosmartcardpassengerdetails': any,
    'isset': boolean,
    'todlocationnlc'?: string
  };
  'state': string;
  'ischangeofjourney': boolean;
  'lastupdated': string;
  'basketdiscount': {
    'basketdiscountamountinpence': number,
    'maximumspendexceeded': boolean,
    'minimumspend': number
  };
  'basketpaymentdetails': {
    'deferfulfilmentuntil': string,
    'evouchers': any[],
    'onlinepaymentdetails': any[],
    'loyaltypointpence': number,
  };
  'nectarpointsearned': Array<{
    '@type': string,
    'allocationtype': string,
    'awardtype': string,
    'bankedpoints': string,
    'nectarruleId': string,
    'tripno': string
  }>;
  'refundandrebookdetails': {};
  'totalcostpence': number;
  'totalcostpencebeforebasketdiscount': number;
  'totalcostpenceexcludingdelivery': number;
  'totalcostpenceincludingfulfilmentchargesundry': number;
  'totalcostpenceminusgiftvouchers': number;
  'totalticketcostpence': number;
  'totalundiscountedcostpenceincludingdelivery': number;
  'totalundiscountedticketcostpence': number;
  'iscontinuousauthoritypermitted': boolean;
  'updatecontinuousauthorityid': number;
  'basketwatchdog': string;
  'paymentfees': any[];
}

export interface IBasketPost {
  'AUPRequest'?: {
    'ChannelId'?: string,
    'ClientTransactionId'?: string,
  };
  'Amount'?: number;
  'BasketDescription'?: string;
  'SuccessURL'?: string;
  'FailURL'?: string;
  'AllowedPaymentMethods'?: string;
  'CustomerData'?: {
    'CustomerId'?: string,
    'FirstName'?: string,
    'LastName'?: string
  };
  'BasketData'?: {
    'BasketItems'?: Array<{
      'Reserved'?: boolean,
      'Id'?: number,
      'ProductCode'?: string,
      'DepartureLocationCode'?: string,
      'ArrivalLocationCode'?: string,
      'Cost'?: string,
      'Passengers'?: number
    }>
  };
}
