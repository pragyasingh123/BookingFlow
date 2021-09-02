import * as _ from 'lodash';
import * as moment from 'moment';

export class JourneySearchCriteria {
  public static from(config ?: IJourneySearchCriteriaConfig) {
    return new JourneySearchCriteria(config);
  }
  public destination: string;
  public destinationName: string;
  public origin: string;
  public originName: string;
  public via: number;
  public avoid: number;
  public firstClass: boolean = false;
  public railcards: IRailcardCriteriaConfig[] = [];
  public adults: number = 1;
  public outwardDepartAfter: boolean = true;
  public timeTableOnly: boolean = false;
  public children: number = 0;
  public isreturn: boolean = false;
  public isopenreturn: boolean = false;
  public directServicesOnly: boolean = false;
  public returnDepartAfter: boolean = true;
  public datetimeReturn: moment.Moment;
  public showServices: boolean = true;
  public standardClass: boolean = true;
  public isSeasonTicket: boolean = false;
  public datetimedepart: moment.Moment;
  public enquiryMethod: string = 'MixingDeck';
  public originalFareId: number = 0;
  public promotion: string;
  public isALink: boolean = false;

  constructor(config?: IJourneySearchCriteriaConfig) {
    if (!config.origin) {
      throw new Error('Journey search `destination` parameter is required');
    }
    if (!config.destination) {
      throw new Error('Journey search `destination` parameter is required');
    }

    this.origin = config.origin;
    this.destination = config.destination;

    _.assign(this, config);

    if (!this.datetimedepart) {
      this.datetimedepart = moment();
    }

    if (!this.datetimeReturn) {
      this.datetimeReturn = moment();
    }
  }

  public toRetailhubJSON() {
    let result = {
      adults: this.adults,
      children: this.children,
      destinationNlc: this.destination,
      directServicesOnly: this.directServicesOnly,
      firstclass: this.firstClass,
      isopenreturn: this.isopenreturn,
      isreturn: this.isreturn,
      originNlc: this.origin,
      outwardDateTime: this.datetimedepart.format('YYYY-MM-DDTHH:mm:ss'),
      outwardDepartAfter: this.outwardDepartAfter,
      railcards: [],
      standardclass: this.standardClass
    };

    if (this.via) {
      result['via'] = this.via;
    } else if (this.avoid) {
      result['avoid'] = this.avoid;
    }

    if (this.isreturn && !this.isopenreturn) {
      result['returnDepartAfter'] = this.returnDepartAfter;
      result['returnDateTime'] = this.datetimeReturn.format('YYYY-MM-DDTHH:mm:ss');
    }

    if (this.promotion) {
      result['promotion'] = this.promotion;
    }

    if (this.railcards.length > 0) {
      result.railcards = this.railcards;
    }

    return result;
  }
}

export interface IJourneySearchCriteriaConfig {
  destination: string;
  destinationName?: string;
  origin: string;
  originName?: string;
  firstClass?: boolean;
  railcards?: IRailcardCriteriaConfig[];
  adults?: number;
  outwardDepartAfter?: boolean;
  timeTableOnly?: boolean;
  children?: number;
  isreturn?: boolean;
  isopenreturn?: boolean;
  directServicesOnly?: boolean;
  returnDepartAfter?: boolean;
  datetimeReturn?: moment.Moment;
  showServices?: boolean;
  standardClass?: boolean;
  isSeasonTicket?: boolean;
  datetimedepart?: moment.Moment;
  EnquiryMethod?: string;
  originalFareId?: number;
  promotion?: string;
  isALink?: boolean;
  via?: string | null;
  avoid?: string | null;
}

interface IRailcardCriteriaConfig {
  adults: number;
  children: number;
  number: number;
  code: string;
}
