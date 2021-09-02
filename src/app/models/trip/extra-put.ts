export class ExtraPutRequest implements IExtraPutApiRequest {
  public tripno: number;
  public additionaloptionitemselections: IAdditionalOptionItemSelections;

  constructor(tripId: number,
              additionaloptionitemselections: IAdditionalOptionItemSelections) {
    this.tripno = tripId;
    this.additionaloptionitemselections = additionaloptionitemselections;
  }
}

export interface IExtraPutApiRequest {
  tripno: number;
  additionaloptionitemselections: IAdditionalOptionItemSelections;
}

export interface IAdditionalOptionItemSelections {
  additionaloptionitemselection: Array<{
    id: number | string,
    state?: string,
    code?: string,
    numberof: number | string,
    numberofadults: number | string,
    numberofchildren: number | string,
    directiontype?: any,
    travelcardselectedfareid?: any
  }>;
}

export interface IAdminOptionItemSelections {
  additionaloptionitemselection: Array<{
    id: number | string,
    state?: string,
    code?: string,
    numberof: number | string,
    numberofadults: number | string,
    numberofchildren: number | string,
    directiontype?: any,
    travelcardselectedfareid?: any
  }>;
}

export class ExtraPutResponse implements IExtraPutResponse {
  public basketMessages: any[];
  public basketWatchdog: string;
  public errorMessages: any[];

  constructor(apiResponse: IExtraPutApiResponse) {
    this.basketMessages = apiResponse.basketmessages;
    this.basketWatchdog = apiResponse.basketwatchdog;
    this.errorMessages = apiResponse.errormessages;
  }
}

export interface IExtraPutResponse {
  basketMessages: any[];
  basketWatchdog: string;
  errorMessages: string[];
}

export interface IExtraPutApiResponse {
  basketmessages: any[];
  basketwatchdog: string;
  errormessages: string[];
}
