export class EVoucher {
  private _apiResponse: IEVoucherApiResponse;
  private value: number;
  private description: string;

  constructor(apiResponse?: IEVoucherApiResponse) {
    this._apiResponse = apiResponse;
    this.value = this._apiResponse.value;
    this.description = this._apiResponse.description;
  }
}

export interface IEVoucherApiResponse {
  'balance': string;
  'claimdate': string;
  'createddate': string;
  'description': string;
  'giftvouchercode': string;
  'id': string;
  'issingleuse': string;
  'isvouchercancelled': string;
  'purchasedate': string;
  'validfortoccode': string;
  'value': number;
}
