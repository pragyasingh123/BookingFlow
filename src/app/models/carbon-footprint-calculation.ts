export class CarbonFootprintCalculation {
  public trainCo2Usage: number = 0;
  public carCo2Usage: number = 0;
  public percentOfEmmissionSaving: number = 0;

  constructor(apiResponse: ICarbonFootprintCalculationApiResponse) {
    this.trainCo2Usage = apiResponse.trainco2usage;
    this.carCo2Usage = apiResponse.carco2usage;
    this.percentOfEmmissionSaving = apiResponse.percentofemissionsaving;
  }
}

export interface ICarbonFootprintCalculationApiResponse {
  trainco2usage: number;
  carco2usage: number;
  percentofemissionsaving: number;
}
