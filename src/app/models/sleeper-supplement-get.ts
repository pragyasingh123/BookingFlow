export class SleeperSupplementGetRequest implements ISleeperSupplementGetRequest {
  constructor(public tripId: number) {
  }
}

export interface ISleeperSupplementGetRequest {
  tripId: number;
}

export class SleeperSupplementGetResponse implements ISleeperSupplementGetResponse {
  public sleeperSupplements: ISleeperSupplementDetailGetApiResponse[];

  constructor(apiResponse: ISleeperSupplementGetApiResponse) {
    this.sleeperSupplements = apiResponse.sleepersupplements;
  }
}

export interface ISleeperSupplementGetResponse {
  sleeperSupplements: ISleeperSupplementDetailGetApiResponse[];
}

interface ISleeperSupplementGetApiResponse {
  sleepersupplements: ISleeperSupplementDetailGetApiResponse[];
}

export interface ISleeperSupplementDetailGetApiResponse {
  code: string;
  cost: number;
  description: string;
  direction: string;
  isavailable: boolean;
  requirescustomerdetails: boolean;
  requirespreferences: boolean;
}
