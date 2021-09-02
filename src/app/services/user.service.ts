import { Inject, Injectable } from '@angular/core';
import { ReplaySubject, BehaviorSubject, Observable, Subject } from 'rxjs/Rx';
import { URLSearchParams, RequestOptionsArgs } from '@angular/http';
import * as _ from 'lodash';
import { RetailhubApiService, IApiStandardFormat } from './retailhub-api.service';
import { UiService } from './ui.service';
import { User, IUserApiResponse } from '../models/user';
import { CookieService, CookieOptionsArgs } from 'angular2-cookie/core';
import { CONFIG_TOKEN } from '../constants';
import * as moment from 'moment';

@Injectable()
export class UserService {
  public isLoggedIn$: BehaviorSubject<boolean>;
  public user$: ReplaySubject<User>;
  public templateId: string;
  public widgetUrl: string;
  constructor(
    private retailHubApi: RetailhubApiService,
    private uiService: UiService,
    private cookieService: CookieService,
    @Inject(CONFIG_TOKEN) private config: any
  ) {
    this.isLoggedIn$ = new BehaviorSubject<boolean>(false);
    this.user$ = new ReplaySubject<User>(1);
    this.templateId = config.templateId;
    this.widgetUrl = config.widgetUrl;
  }

  public profile(): Observable<IApiStandardFormat> {
    return this.retailHubApi.get('/customer/profile');
  }

  public login(loginPostRequest: ILoginPostRequest): Observable<IUserApiResponse> {
    return this.retailHubApi.post('/login', loginPostRequest).catch((error: any) => {
      let errorMessage: string = "We're sorry, something went wrong, please try again.";

      if (error.errors != undefined) {
        if (error.successful == false || error.errors.length > 0) {
          let loginError: string = error.errors[0];
          let loginErrorLowercase: string = loginError.toLowerCase();

          switch (loginErrorLowercase) {
            case 'email is invalid.':
              errorMessage = 'The email address is invalid';
              break;
            case 'password may not be empty.':
              errorMessage = 'Password may not be empty.';
              break;
            case '50003: there has been an internal webtis service error.':
              errorMessage = 'Please select ‘forgotten password’ to reset your password';
              break;
            case '10058: this account has been locked. please try again later.':
              errorMessage = loginError.split(':')[1];
              break;
            default:
              errorMessage = 'Your username and/or password combination is not correct - please check and try again';
              break;
          }
        }
      }

      return Observable.throw(errorMessage);
    }).map((response: any) => {
      let user = new User(response.data);
      this.user$.next(user);
      this.setUserCookie(user);
      return response.data;
    });
  }

  public getAddressPreferences(): Observable<any> {
    return this.retailHubApi.get('/customer/address')
      .map((response: any) => {
        return response.data;
      });
  }

  public register(registerPostRequest: IRegisterPostRequest): Observable<IUserApiResponse> {
    return this.retailHubApi.post('/register', registerPostRequest)
      .map((response: any) => {
        return response.data;
      });
  }

  public addVoucher(voucher: string): Observable<any> {
    return this.retailHubApi.put('/customer/vouchers', { vouchercode: voucher })
      .map((response: any) => {
        return response;
      })
      .catch((error) => {
        if (error.status == 500) { this.uiService.error('Error: ' + error.message); }
        return Observable.throw(error);
      });
  }

  public getSeatPreferences(tripId: any): Observable<any> {
    let options: RequestOptionsArgs;
    options = options || {};
    let params = (options.search as URLSearchParams) || new URLSearchParams();
    params.set('tripno', tripId);
    options.search = params;

    return this.retailHubApi.get('/customer/basket/journey/seatattributes', options)
      .map((response: any) => {
        return response;
      });
  }

  public postSeatPreference(data: any): Observable<any> {
    return this.retailHubApi.post('/customer/preferences/seatpreferences', data)
      .map((response: any) => {
        return response;
      });
  }

  public getLoyaltycard(): Observable<ILoyaltycardGetResponse> {
    return this.retailHubApi.get('/customer/loyaltycard')
      .map((response: any) => {
        return response.data;
      });
  }
  public postLoyaltycard(data: ILoyaltycardPostRequest): Observable<ILoyaltycardPostResponse> {
    return this.retailHubApi.post('/customer/loyaltycard', data)
      .map((res: any) => {
        if (res) {
          if (res.successful === false && res.errors[0]) {
            let errorMessage: string = res.errors[0].split(':').pop().trim();

            throw new Error(errorMessage);
          } else { return res.data; }
        }
      })
      .catch((error: any) => {
        return Observable.throw(error.__zone_symbol__error.message);
      });
  }

  public sendConfirmationEmail(data: ISendConfirmationEmailPostRequest): Observable<ISendConfirmationEmailPostResponse> {
    return this.retailHubApi.post('/customer/purchase/email', data)
      .map((response: any) => {
        return response.data;
      });
  }

  public sendResetPasswordEmail(data: ISendResetPasswordEmailPostRequest): Observable<ISendResetPasswordEmailPostResponse> {
    return this.retailHubApi.post('/sendpasswordrecoveryemail', data)
      .map((response: any) => {
        return response.data;
      });
  }

  public getUserDetails(): any {
    return JSON.parse((this.cookieService.get('user')));
  }

  public userAuthenticated(): boolean {
    if (this.cookieService.get('user') && this.cookieService.get('access_token')) {
      let user: User = JSON.parse(this.cookieService.get('user'));
      let token: string = this.cookieService.get('access_token');

      return user.authenticatedsessionid == token ? true : false;
    } else {
      return false;
    }
  }

  public removeUserCookie(): void {
    this.isLoggedIn$.next(false);
    this.cookieService.remove('user');
  }

  public getITSOSmartcards(): Observable<ISmartcardsListItem[]> {
    return this.retailHubApi.get('/customer/itso/smartcards')
      .catch((error: any) => {
        return Observable.throw(error);
      })
      .map((response: ISmartcardAPI) => {
        return response.data.itsosmartcards;
      });
  }
  private setUserCookie(user: User): void {
    let args: CookieOptionsArgs = {
      expires: moment().add(45, 'minute').format(),
      path: '/',
      secure: this.config.secureCookies
    };

    this.cookieService.put('user', JSON.stringify(user), args);
  }

  public getWidgetToken(userId: string): Observable<any> {
    return this.retailHubApi.getWidgetToken(`/consentric/GetExtToken`, userId).catch((err: any) =>{
      return Observable.throw(err)
    }).map((response: any)=>{
      return response;
    })
  }
}

export interface ILoginPostRequest {
  username: string;
  password: string;
  captchaToken: string;
}

export interface IRegisterPostRequest {
  customerProfile: {
    title: string;
    firstname: string;
    lastname: string;
    email: string;
  };
  mobilenumber: string;
  nectarcardnumber: string;
  password: string;
  captchaToken: string;
  canwecontactyou: {
    post: boolean,
    app: boolean,
    email: boolean,
    im16YearsOld: boolean,
    noThanks: boolean,
    sms: boolean
  };
}

export interface IRegisterPostResponse {
  successful: boolean;
  errors: string[];
}

interface ILoyaltycardGetResponse {
  scheme: string;
  isblacklisted: boolean;
  isoptedin: boolean;
  cardnumber: string;
  isflyingclubmembership: boolean;
}

interface ILoyaltycardPostRequest {
  schematypy: string;
  eventcontext: string;
  cardnumber: string;
}
interface ILoyaltycardPostResponse {
  offerid: string;
  points: number;
  scheme: string;
}

interface ISendConfirmationEmailPostRequest {
  email: string;
  orderid: string;
}
interface ISendConfirmationEmailPostResponse {
  clienttransactionid: string;
  statuscode: string;
  errors: string[];
}
interface ISendResetPasswordEmailPostRequest {
  email: string;
  captchaToken: string;
}
interface ISendResetPasswordEmailPostResponse {
  successful: boolean;
  errors: string[];
}
interface ISmartcardAPI {
  data: ISmartcardsListAPI;
}
interface ISmartcardsListAPI {
  itsosmartcards: ISmartcardsListItem[];
}
interface ISmartcardDiscounentitlement {
  discountidentifier: number;
  entitlementcode: string;
  discountconcessionaryclasscode: string;
  expirydate: string;
  operatorid: number;
  isrn: string;
  railcardcode: string;
  userid: number;
}
export interface ISmartcardsListItem {
  locationnlc: string;
  userid: number;
  windowstartdate: string;
  windowperiod: number;
  discountentitlement: ISmartcardDiscounentitlement[];
  remainingspace: 0;
  entitlement: string;
  entitlementexpiry: string;
  cardexpiry: string;
  carddescription: string;
  nameoncard: string;
  status: string;
  concessionaryclass: string;
  isphotocardenabled: boolean;
  isrn: string;
  photocardid: null;
  isdefault: boolean;
}

export interface ISmartcardDropdownItem {
  index: number;
  isrn: string;
  label: string;
  status: string;
}

export interface IDeliveryItsoOption {
  deliveryoptionid: number;
  todlocationnlc: string;
  itsoisrn: string;
  itsocollectiondate: string;
  othercard: boolean;
}
