import * as _ from 'lodash';
import { Inject } from '@angular/core';
import { ISmartcardsListItem } from '../services/user.service';

export class DeliveryOption {
  public id: number;
  public name: string;
  public description: string;
  public instructions: string;
  public pricePence: number;
  public price: number;
  public selfPrint: boolean;
  public postageFeesApply: boolean;
  public isTod: boolean;
  public isPost: boolean;
  public isMobile: boolean;
  public isETicket: boolean;
  public nectarPoints: number;
  public isItso: boolean;
  private _apiResponse: IDeliveryOptionApiResponse;
  private _isAvailableForFree: boolean;
  private _generalUserType: string = 'GeneralUser';

  constructor(apiResponse?: IDeliveryOptionApiResponse) {
    this._apiResponse = apiResponse;
    this.init();
  }

  private init(): void {
    this.id = this._apiResponse.id;
    this.name = this.mapDisplayName(this._apiResponse.displayname);
    this.description = this._apiResponse.description;
    this.instructions = this._apiResponse.deliveryinstruction;
    this.selfPrint = this._apiResponse.selfprint === 'SelfPrint';
    this.postageFeesApply = this._apiResponse.postagefeesapply === 'true';
    this.isTod = this._apiResponse.tod === 'TOD';
    this.isPost = this._apiResponse.post === 'POST';
    this.isMobile = this._apiResponse.mobile === 'MobileTicket';
    this.isETicket = this._apiResponse.name.toLowerCase().replace(/\s+/g, '') === 'eticket';
    this.isItso = this._apiResponse.name.toLowerCase().replace(/\s+/g, '') === 'itso';
    this.nectarPoints = this._apiResponse.nectarloyaltypointsfordeliveryoption;
    this._isAvailableForFree = this._apiResponse.isavailableforfree;
    this.parsePrice();
  }

  private parsePrice(): void {
    let currentUserTypeOption: IDeliveryOptionUserTypeApiResponse = _.find(this._apiResponse.usertypes, { usermembershiptype: this._generalUserType });

    this.pricePence = this._isAvailableForFree ? 0 : currentUserTypeOption.lowlevelprice;
    this.price = this.pricePence / 100;
  }

  private mapDisplayName(apiDisplayName: string): string {
    switch (apiDisplayName) {
      case 'First Class Post':
        return 'First Class post';
        case 'Next Day Delivery':
          return 'Next day delivery';
      default:
        return apiDisplayName;
    }
  }
}

export interface IDeliveryOptionUserTypeApiResponse {
  'defaultdeliveryoption': boolean;
  'deliveryoptionid': number;
  'isenabled': boolean;
  'lowlevelboundary': number;
  'lowlevelprice': number;
  'midlevelboundary': number;
  'midlevelprice': number;
  'upperlevelboundary': number;
  'upperlevelprice': number;
  'usermembershiptype': string;
  'usertypedeliverydetailsid': number;
}

export interface IDeliveryOptionApiResponse {
  'id': number;
  'tod': string;
  'mobile': string;
  'deliveryinstruction': string;
  'description': string;
  'displayname': string;
  'zerocost': string;
  'internationaladdressvalid': string;
  'postagefeesapply': string;
  'deliveryoptionid': number;
  'extendedbookingsortorder': number;
  'fulfilmenttypename': string;
  'includeallroversrangers': boolean;
  'includealltickets': boolean;
  'isallowedforextendedbooking': boolean;
  'isallowedfornormalticket': boolean;
  'isallowedforseasonticket': boolean;
  'isavailableforfree': boolean;
  'ischecked': boolean;
  'isdefault': boolean;
  'isdiscountinued': boolean;
  'isforzeroPayment': boolean;
  'isinternationaladdressallowed': boolean;
  'isnectarmaximumLimitisrechedfordeliveryoption': boolean;
  'ispostagefeesapplied': boolean;
  'isseasontodapplicable': boolean;
  'isstationrelatedchargesapplied': boolean;
  'latestavailability': {
    'fulfilmentwindowdays': number,
    'hour': number,
    'isfixedtimerule': boolean,
    'latestavailabilityrulesid': number,
    'minute': number,
    'numberofdays': number,
    'numberofhours': number
  };
  'name': string;
  'nectarloyaltypointsfordeliveryoption': number;
  'nectorloyaltydeliveryoptionruleid': number;
  'postmarkid': number;
  'post': string;
  'printpostindicia': boolean;
  'roversrangersapplicability': any[];
  'selfprint': string;
  'selfprinttype': string;
  'separatorname': string;
  'sortorder': number;
  'sundrycode': string;
  'ticketapplicability': any[];
  'ticketapplicabilityid': number;
  'toduserlevelid': number;
  'usertypes': IDeliveryOptionUserTypeApiResponse[];
  'vendorid': number;
  'witheffectivefromdate': string;
  'witheffectiveuntildate': string;
}

export interface IItsoLocations extends IItsoTranslateToRegularLocationHelper {
  crs: string;
  description: string;
  displayname: string;
  nlc: string;
  todavailability: string;
  todcontactinfo: string;
  todlocationinfo: string;
  vendorservedflag: string;
  isavailable: boolean;
}

interface IItsoTranslateToRegularLocationHelper {
  tod?: boolean;
}

export interface IBasketDeliveryApiResponse {
  deliverycost: string;
  isset?: boolean;
  itsocardisrn?: string;
  itsosmartcarddetails: ISmartcardsListItem;
  mobilephonenumber: string;
  storedeliveryaddress: boolean;
  todlocationnlc: string;
  itsosmartcardpassengerdetails: IItsoSmartcardPassengerDetails[];
  selecteddeliveryoption: IDeliveryOptionApiResponse;
  options: IDeliveryOptionApiResponse;
}

interface IItsoSmartcardPassengerDetails {
  adultchild: string;
  itsotripno: number;
  smartcardid: string;
}
