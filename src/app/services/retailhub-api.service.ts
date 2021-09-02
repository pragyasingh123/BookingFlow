import { Inject, Injectable } from '@angular/core';
import { Http, RequestOptionsArgs, Request, Response, Headers, URLSearchParams } from '@angular/http';
import { RetailHubHttpInterceptor } from './retailhub-http-interceptor.service';
import { Observable, BehaviorSubject } from 'rxjs/Rx';
import * as _ from 'lodash';
import { CONFIG_TOKEN } from '../constants';
import { ConfigService } from './config.service';
import { UiService } from './ui.service';
import { CookieService, CookieOptionsArgs } from 'angular2-cookie/core';
import * as moment from 'moment';
import { Subject } from 'rxjs/Subject';
import uuidv4 from 'uuid/v4';

@Injectable()
export class RetailhubApiService {
  public retryAfterAmountOfSeconds$: Observable<any>;
  public otherErrorsGuard$: Observable<any>;
  public sessionTimer: any;
  public _isSessionInvalid$: BehaviorSubject<boolean>;
  private cookieSessionTokenName: string = 'access_token';
  private conversationTokenName: string = 'Conversation-Token';
  private defaultApiBaseUrl: string;
  private myAccountApiUrl: string;

  private retryAfterAmountOfSecondsSubject = new Subject<any>();
  private otherErrorsGuardSubject = new Subject<any>();
  private cookieDomain: string;

  constructor(
    private http: RetailHubHttpInterceptor,
    private configService: ConfigService,
    private uiService: UiService,
    private _cookieService: CookieService,
    @Inject(CONFIG_TOKEN) private config: any
  ) {
    this._isSessionInvalid$ = new BehaviorSubject<boolean>(false);

    if (window.location.host.startsWith('localhost')) {
      this.cookieDomain = 'localhost';
    } else {
      this.cookieDomain = (config.cookieDomain !== 'auto') ? config.cookieDomain : '.' + window.location.host.split('.').slice(-2).join('.');
    }
    this.defaultApiBaseUrl = config.defaultApiBaseUrl;
    this.myAccountApiUrl = config.myAccount;
    this.retryAfterAmountOfSeconds$ = this.retryAfterAmountOfSecondsSubject.asObservable();
    this.otherErrorsGuard$ = this.otherErrorsGuardSubject.asObservable();

    if (this.configService.localStorageAvailable()) { this.configService.set('apiEndpoint', this.defaultApiBaseUrl); }
  }

  public request(url: string | Request, options?: RequestOptionsArgs): Observable<Response> {
    return this.http.request(url, options);
  }

  public buildRequestHeaders(options: any): any {
    let sessionToken = this.getSessionToken();
    let conversationToken = this.getConversationToken();
    if (!conversationToken) {
      conversationToken = uuidv4();
      this.setConversationToken(conversationToken);
    }

    let headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Session-Token', sessionToken);
    if (conversationToken) { headers.append(this.conversationTokenName, conversationToken); }
    options.headers = headers;
    return options.headers;
  }

  public updateRetryAfterAmountOfSeconds(amountOfSeconds: string): void {
    this.retryAfterAmountOfSecondsSubject.next(amountOfSeconds);
  }

  public updateOtherErrorsGuard(blockOtherErrors: boolean): void {
    this.otherErrorsGuardSubject.next(blockOtherErrors);
  }

  public extractConversationTokenFromHeader(response: any): void {
    var conversationTokenHeader = response.headers.get(this.conversationTokenName);
    if (conversationTokenHeader) {
      this.setConversationToken(conversationTokenHeader);
    }
  }

  public extractRetryAfterAmountOfSecondsFromHeader(response: any): void {
    var retryAfterAmountOfSeconds = response.headers.get('Retry-After');
    if (retryAfterAmountOfSeconds) {
      this.updateRetryAfterAmountOfSeconds(retryAfterAmountOfSeconds);
    }
  }

  public extractSessionTokenFromHeader(response: any): void {
    var sessionTokenHeader = response.headers.get('Session-Token');
    if (sessionTokenHeader) {
      this.setSessionToken(sessionTokenHeader);
    }
  }

  public get(url: string, options?: RequestOptionsArgs): Observable<IApiStandardFormat> {
    let fullUrl = this.defaultApiBaseUrl + url;
    options = options || {};
    this.buildRequestHeaders(options);

    return this.http.get(fullUrl, options, url)
      .do((res) => this.extractSessionTokenFromHeader(res))
      .do((res) => this.extractConversationTokenFromHeader(res))
      .map((res) => res.json())
      .timeout(59000)
      .catch<any>(this.catchError.bind(this));
  }

  public post(url: string, body: any, options?: RequestOptionsArgs): Observable<IApiStandardFormat> {
    let fullUrl = this.defaultApiBaseUrl + url;
    let completeBody = {
      data: body,
    };

    options = options || {};
    this.buildRequestHeaders(options);

    return this.http.post(fullUrl, completeBody, options, url)
      .do((res) => this.extractSessionTokenFromHeader(res))
      .do((res) => this.extractConversationTokenFromHeader(res))
      .map((res) => res.json())
      .timeout(59000)
      .catch<any>(this.catchError.bind(this));
  }

  public put(url: string, body: any, options?: RequestOptionsArgs): Observable<Response> {
    let fullUrl = this.defaultApiBaseUrl + url;
    let completeBody = {
      data: body,
    };

    options = options || {};
    this.buildRequestHeaders(options);

    return this.http.put(fullUrl, completeBody, options, url)
      .do((res) => this.extractSessionTokenFromHeader(res))
      .do((res) => this.extractConversationTokenFromHeader(res))
      .map((res) => res.json())
      .timeout(59000)
      .catch<any>(this.catchError.bind(this));
  }

  public delete(url: string, options?: RequestOptionsArgs): Observable<Response> {
    let fullUrl = this.defaultApiBaseUrl + url;
    options = options || {};
    options.body = options.body || {};

    this.buildRequestHeaders(options);

    return this.http.delete(fullUrl, options, url)
      .do((res) => this.extractSessionTokenFromHeader(res))
      .do((res) => this.extractConversationTokenFromHeader(res))
      .map((res) => res.json())
      .timeout(59000)
      .catch<any>(this.catchError.bind(this));
  }

  public patch(url: string, body: any, options?: RequestOptionsArgs): Observable<Response> {
    return this.http.patch(url, body, options);
  }

  public head(url: string, options?: RequestOptionsArgs): Observable<Response> {
    return this.http.head(url, options);
  }

  public getWidgetToken(url: string, body: any, options?: RequestOptionsArgs): Observable<IApiStandardFormat> {
    let fullUrl = this.myAccountApiUrl + url;
    options = options || {};
    this.buildRequestHeaders(options);
    let completeBody = {
      userId: body,
    };

    return this.http.post(fullUrl, completeBody, options, url)
      .do((res) => this.extractSessionTokenFromHeader(res))
      .do((res) => this.extractConversationTokenFromHeader(res))
      .map((res) => res.json())
      .timeout(59000)
      .catch<any>(this.catchError.bind(this));
  }

  public setConversationToken(token: string): void {
    if (this.configService.sessionStorageAvailable()) {
      window.sessionStorage.setItem(this.conversationTokenName, token);
    } else {
      let args: CookieOptionsArgs = {
        domain: this.cookieDomain,
        expires: '0',
        path: '/',
        secure: this.config.secureCookies
      };
      this._cookieService.put(this.conversationTokenName, token, args);
    }
  }

  public getConversationToken(): any {
    var conversationToken;
    if (this.configService.sessionStorageAvailable()) {
      conversationToken = window.sessionStorage.getItem(this.conversationTokenName);
    } else {
      conversationToken = this._cookieService.get(this.conversationTokenName);
    }
    return conversationToken;
  }

  public setSessionToken(token: string): void {
    let cookieToken = this.getSessionToken();

    let args: CookieOptionsArgs = {
      domain: this.cookieDomain,
      expires: moment().add(45, 'minute').format(),
      path: '/',
      secure: this.config.secureCookies
    };

    // Make sure the sessionToken value in the cookie is always in sync with the sessionToken we receive from WebTis
    // In case of session expiry, we are updating our expired session token to a new one here, so there is no need to clear this cookie anywhere else
    this._cookieService.put(this.cookieSessionTokenName, token, args);

    // Check if sessionToken returned from API is still the same as the one we have saved in the cookie
    // If they do not match that means that the session has expired at WebTis, so we need to notify the user, and start with an empty basket
    if (token && cookieToken && token !== cookieToken) {
      this._isSessionInvalid$.next(true);
      return;
    }

    clearTimeout(this.sessionTimer);
    this.setSessionTimeouts(String(args.expires));
  }

  public getSessionToken(): string {
    return this._cookieService.get(this.cookieSessionTokenName);
  }

  public clearSession(): void {
    this._cookieService.remove(this.cookieSessionTokenName);
  }

  private hasSessionError(error: Response): boolean {
    let cookieToken = this._cookieService.get(this.cookieSessionTokenName);

    // If we got a 401 access denied from server and sessionToken cookie does not exists, most likely the cookie has expired, so open sessionExpired dialog
    if (error.status === 401 && !cookieToken) {
      this._isSessionInvalid$.next(true);
      return true;
    }

    return false;
  }

  private catchSessionError(error: Response, caught: Observable<Response>): any {
    var errorJson = Object.assign({ statusCode: error.status }, error && error.json ? error.json() : {});

    if (this.hasSessionError(error)) {
      return Observable.throw(errorJson || 'Session expired');
    }

    return Observable.throw(errorJson || 'Server error');
  }

  private catchError(error: Response, caught: Observable<Response>): any {
    var errorJson = Object.assign({ statusCode: error.status }, error && error.json ? error.json() : {});
    if (this.hasSessionError(error)) {
      return Observable.throw(errorJson || 'Session expired');
    }

    // In case of any API error we need to check if the session is still valid at WebTis.
    // We do this by making GET /customer/basket request.
    // In case of expired session the GET basket call is going to return a different session token than the one we have saved into the cookie.
    // The generic session expiry handler in the setSessionToken method is going to take care of showing the session expiry dialog in such case,
    // so the only thing we have to do here is to start the GET customer/basket call

    if (error.status === 429) {
      this.extractRetryAfterAmountOfSecondsFromHeader(error);
    } else {
      this.updateOtherErrorsGuard(false);
    }

    if (error.ok === false) {
      let url = '/customer/basket';
      let fullUrl = this.defaultApiBaseUrl + '/customer/basket';
      var options = {};
      this.buildRequestHeaders(options);

      // Set different error handler to avoid calling /customer/basket in a loop in case of GetBasket error fails
      return this.http.get(fullUrl, options, url)
        .do((res) => this.extractSessionTokenFromHeader(res))
        .do((res) => this.extractConversationTokenFromHeader(res))
        .map((res) => {
          // In case GET basket method succeeds, so session is still valid, make sure we do not swallow the original error
          throw error;
        })
        .timeout(59000)
        .catch<any>(this.catchSessionError.bind(this));
    }

    return Observable.throw(errorJson || 'Server error');
  }

  private setSessionTimeouts(sessionExpiredTime): void {
    let sessionTime = moment(sessionExpiredTime);

    // check session every minute
    this.sessionTimer = setInterval(() => {
      // if session is under 5 minutes alert the user
      if (sessionTime.diff(moment(), 'minutes') === 5) {
        this.uiService.alert("Your session will expire in 5 minutes as you've been inactive for the last 40 minutes.");
      }

      // session expired reset the session.
      if (sessionTime.diff(moment(), 'minutes') === 0) {
        this._isSessionInvalid$.next(true);
      }

    }, 60 * 1000);
  }
}

export interface IApiStandardFormat {
  data: object;
  environment: string;
  version: string;
}
