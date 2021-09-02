export class User {
  public userprofile: any;
  public authenticatedsessionid: string;

  constructor(private _apiResponse: IUserApiResponse) {
    this.userprofile = {};
    this.userprofile.id = this._apiResponse.userprofile.id;
    this.userprofile.title = this._apiResponse.userprofile.title;
    this.userprofile.firstname = this._apiResponse.userprofile.firstname;
    this.userprofile.lastname = this._apiResponse.userprofile.lastname;
    this.userprofile.fullName = this.userprofile.firstname + ' ' + this.userprofile.lastname;
    this.userprofile.email = this._apiResponse.userprofile.email;
    this.userprofile.mobilenumber = this._apiResponse.userprofile.mobilenumber;
    this.userprofile.favouritestationnlc = this._apiResponse.userprofile.favouritestationnlc;
    this.userprofile.favouriterailcard = this._apiResponse.userprofile.favouriterailcard;
    this.userprofile.birthdate = this._apiResponse.userprofile.birthdate;
    this.authenticatedsessionid = this._apiResponse.authenticatedsessionid;
  }
}

export interface IUserApiResponse {
  userprofile: IUserProfile;
  authenticatedsessionid: string;
}

export interface IUserProfile {
  'id': string;
  'title': string;
  'firstname': string;
  'lastname': string;
  'email': string;
  'mobilenumber': string;
  'favouritestationnlc': string;
  'favouriterailcard': string;
  'birthdate': string;
  'fullName': string;
}
