export class ExtraGetRequest implements IExtraGetRequest {
  constructor(public tripId: number) {
  }
}

export interface IExtraGetRequest {
  tripId: number;
}

export class ExtraGetResponse implements IExtraGetResponse {
  public basketWatchdog: string;
  public additionalOptionItems: IAdditionalOptionItem[];

  constructor(apiResponse: IExtraGetApiResponse) {
    this.basketWatchdog = apiResponse.basketwatchdog;
    this.additionalOptionItems = apiResponse.additionaloptionitems;
  }
}

export interface IExtraGetResponse {
  basketWatchdog: string;
  additionalOptionItems: IAdditionalOptionItem[];
}

interface IExtraGetApiResponse {
  basketwatchdog: string;
  additionaloptionitems: IAdditionalOptionItem[];
}

export interface IAdditionalOptionItem {
  additionaloption: {
    code: string,
    name: string,
    description: string,
    id: number,
    nlc: string,
    additionaloptionid: number,
    additionaloptiontype: string,
    adultcost: any[],
    childcost: any[],
    costperadult: number,
    costperchild: number,
    costtotaladults: number,
    costtotalchildren: number,
    directiontype: string,
    requiresadult: string,
    requireschildren: string,
    requirescoupons: string,
    requiresnumbero: string,
    requiresreadonly: string,
    restrictedtopassengernumbers: string,
    ispurchaselimit: string,
    pscode: string,
    purchaselimit: number,
    requiretermsconditions: string,
    totalcostallpassengersinpence: number,
    zonename: string,
    zonedetailitem: Array<{
      description: string,
      offpeakrestrictedcostpence: string,
      offpeakrestrictedfareid: string,
      offpeakunrestrictedcostpence: string,
      offpeakunrestrictedfareid: string,
      peakfarecostpence: string,
      peakfareid: string,
      zonecode: string
    }>
  };
  id: number;
  ismandatory: string;
  numberof: number;
  numberofadults: number;
  numberofchildren: number;
  priceinpence: number;
  state: string;
  link: string;
}
