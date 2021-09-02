export class Discount {
    public code: string;
    public description: string;
    private _apiResponse: IDiscountApiResponse;

  constructor(apiResponse?: IDiscountApiResponse) {
    this._apiResponse = apiResponse;
    this.code = this._apiResponse.code;
    this.description = this._apiResponse.description;

    this.init();
  }

  private init(): void {}
}

export interface IDiscountApiResponse {
  'code': string;
  'description': string;
}
