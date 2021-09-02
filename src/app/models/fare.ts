export class Fare {
  private _apiResponse: IFareApiResponse;
  private farePrice: number;
  private adultfare: number;
  private childfare: number;
  private adults: number;
  private adultsmultiplier: number;
  private children: number;
  private childrenmultiplier: number;
  private journeyId: number;
  private discounttype: string;

  constructor(journeyId: number, apiResponse?: IFareApiResponse) {
    this._apiResponse = apiResponse;
    this.journeyId = journeyId;
    this.farePrice = this._apiResponse.totalfare / 100;
    this.adultfare = this._apiResponse.adultfare / 100;
    this.childfare = this._apiResponse.childfare / 100;
    this.adults = this._apiResponse.adults;
    this.adultsmultiplier = this._apiResponse.adultsmultiplier;
    this.children = this._apiResponse.children;
    this.childrenmultiplier = this._apiResponse.childrenmultiplier;
    this.discounttype = this._apiResponse.discounttype;
    this.init();
  }

  private init(): void {}
}

export interface IFareApiResponse {
  'aaafare': number;
  'aaafareincloverride': number;
  'aaa': number;
  'additionalrestriction': string;
  'adultfare': number;
  'adultfareincloverride': number;
  'adults': number;
  'adultsmultiplier': number;
  'aftersales': any[];
  'allowedfulfilment': string[];
  'baseaaafare': number;
  'baseadultfare': number;
  'basechildfare': number;
  'childfare': number;
  'childfareincloverride': number;
  'childpackages': number;
  'children': number;
  'childrenasadults': number;
  'childrenmultiplier': number;
  'constituentfares': any[];
  'crosslondon': string;
  'destination': string;
  'discountamount': number;
  'discountcode': string;
  'discountid': string;
  'discountminimumfare': number;
  'discountminimumfarebeforeoverride': number;
  'discountpercent': number;
  'discountroundingamount': number;
  'discountroundingtype': string;
  'discounttype': string;
  'eticketreference': string;
  'excessflag': string;
  'expireddiscount': string;
  'fareassupplement': string;
  'faremethodmarker': string;
  'faretoccode': string;
  'flatfareruleid': string;
  'flexibility': number;
  'goldcardapplicable': string;
  'groupdiscountschemeid': string;
  'id': number;
  'loyaltypoints': any[];
  'matchingfares': any[];
  'minimumfare': string;
  'minimumfarebeforeoverride': string;
  'origin': string;
  'otherexcessstuff': { };
  'outwarddate': string;
  'overrideflag': string;
  'overrideminimumfarerule': string;
  'packages': number;
  'passengerdetails': any[];
  'promotioncode': string;
  'rcskey': string;
  'rcsproductref': string;
  'replacementflag': string;
  'requestedfulfilments': string[];
  'reservationonly': string;
  'restricted': string;
  'restrictioncode': string;
  'route': string;
  'saledateruleapplied': string;
  'seasondatabase': string;
  'seasonissuetype': string;
  'seasonlostdays': number;
  'singleasareturn': string;
  'smartcardreference': string;
  'termsandconditions': string;
  'ticketnumber': any[];
  'tickettype': string;
  'totalaaafare': number;
  'totaladultfare': number;
  'totalchildfare': number;
  'totalfare': number;
  'validtodate': string;
  'validtodateout': string;
  'validitycode': string;
}
