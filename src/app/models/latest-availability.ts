export class LatestAvailability {
  public fulfilmentwindowdays: number;
  public hour: number;
  public isfixedtimerule: boolean;
  public latestavailabilityrulesid: number;
  public minute: number;
  public numberofdays: number;
  public numberofhours: number;

  constructor(apiResponse: any) {
    this.fulfilmentwindowdays = apiResponse.fulfilmentwindowdays;
    this.hour = apiResponse.hour;
    this.minute = apiResponse.minute;
    this.isfixedtimerule = apiResponse.isfixedtimerule;
    this.latestavailabilityrulesid = apiResponse.latestavailabilityrulesid;
    this.numberofdays = apiResponse.numberofdays;
    this.numberofhours = apiResponse.numberofhours;
  }

  public totalNumberOfHours(): number {
    return this.numberofhours + (this.numberofdays * 24);
  }

  public totalNumberOfMinutes(): number {
    return this.minute + (this.totalNumberOfHours() * 60);
  }
}
