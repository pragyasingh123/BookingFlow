export class Location {
  public id: string;
  public code: string;
  public name: string;
  public label: string;
  public tod: boolean;

  constructor(apiResponse: any) {
    this.id = apiResponse.nlc;
    this.code = apiResponse.crs || apiResponse.code;
    this.name = apiResponse.description || apiResponse.name;
    this.label = this.name + (this.code ? ' (' + this.code + ')' : '');
    this.tod = apiResponse.tod;
  }
}

export interface ILocationApiResponseBase {
  nlc: string;
  crs: string;
  description: string;
}

export interface ILocationApiResponse extends ILocationApiResponseBase {
  alias: string;
  aliasdescription: string;
  grouplocation: string;
  shortdescription: string;
}

export interface ILocationSearchApiResponse extends ILocationApiResponseBase {
  isalias: boolean;
  isfgw: boolean;
  isgroup: boolean;
  name: string;
  code: string;
}
