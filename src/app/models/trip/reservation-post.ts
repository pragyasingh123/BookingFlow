import { IInitiatePaymentResult } from '../../review-order/review-order.component';

export class ReservationPostRequest implements IReservationPostApiRequest {
  public tripno: string;
  public reserveoutward: boolean = false;
  public reserveinward: boolean = false;
  public numberOfBicycles: number = 0;
  public numberOfWheelChairs: number = 0;
  public bicycleReservationsOnly: boolean = false;
  public seatpreferences: string[];
  public keepreservations: boolean = false;
  public phoneNumber: string;
  public forename: string;
  public surname: string;
  public title: string;
  public inwardSupplementCodes: string[];
  public outwardSupplementCodes: string[];
  public sleeperpreferences: {
    sleeperpreferences: Array<{
      gender: string,
      bedtype: string,
      sharewithfellowtraveller: boolean | string
    }>
  };

  constructor(tripId: number) {
    this.tripno = String(tripId);
  }
}

export interface IReservationPostApiRequest {
  tripno: string;
  reserveoutward: boolean;
  reserveinward: boolean;
  numberOfBicycles: number;
  numberOfWheelChairs: number;
  bicycleReservationsOnly: boolean;
  seatpreferences: string[];
  keepreservations: boolean;

  phoneNumber: string;
  forename: string;
  surname: string;
  title: string;
  inwardSupplementCodes: string[];
  outwardSupplementCodes: string[];
  sleeperpreferences?: {
    sleeperpreferences?: Array<{
      gender: string,
      bedtype: string,
      sharewithfellowtraveller: boolean | string
    }>
  };
}

export class ReservationPostResponse implements IReservationPostResponse {
  public basketWatchdog: string;
  public information: ReservationPostInformation;

  constructor(apiResponse: IReservationPostApiResponse) {
    this.basketWatchdog = apiResponse.basketwatchdog;
    this.information = new ReservationPostInformation(apiResponse.information);
  }
}

export interface IReservationPostResponse {
  basketWatchdog: string;
  information: ReservationPostInformation;
}

export interface IReservationPostApiResponse {
  basketwatchdog: string;
  information: IIinformation;
}

export class ReservationPostInformation {
  public success: boolean;
  public warnings: string[];

  constructor(apiResponse: IIinformation) {
    this.success = apiResponse.success === 'Y';
    this.warnings = [];

    for (var key in apiResponse) {
      if (key !== 'success' && apiResponse[key] === 'Y') {
        this.warnings.push(key);
      }
    }
  }

  public hasWarning(warning: string) {
    return this.warnings.indexOf(warning) >= 0;
  }
}

export interface IIinformation {
  success: string;
  nrsnotavailable: string;
  seatnotavailable: string;
  sleepernotavailable: string;
  pricepromisereservationfailed: string;
  bicyclereservationnotavailable: string;
  defaultreservationnotattempted: string;
  seatingpreferencesnotmet: string;
  storeorderfailed: string;
  confirmationemailfailed: string;
  cancelseatreservationsfailed: string;
  cancelbicyclereservationsfailed: string;
  amendreservationsfailed: string;
  makereservationsfailed: string;
  returnbeforeoutward: string;
}
