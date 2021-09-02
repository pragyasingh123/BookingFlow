import { Injectable } from '@angular/core';
import { Http, ConnectionBackend, RequestOptions, RequestOptionsArgs, Response, Headers, XHRBackend } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Analytics } from './analytics.service';
import 'rxjs/Rx';

@Injectable()
export class RetailHubHttpInterceptor extends Http {
    constructor(backend: ConnectionBackend, defaultOptions: RequestOptions, private analyticsService: Analytics) {
       super(backend, defaultOptions);
    }

    public get(url: string, options?: RequestOptionsArgs, apiPath?: string): Observable<any> {
        // If apiPath is empty use absolute path
        apiPath = apiPath ? apiPath : url;
        return super.get(url, this.requestOptions(options))
            .catch(this.onCatch)
            .do((res: Response) => {
                this.onSubscribe(apiPath, 'GET', res);
            }, (error: Response) => {
                this.onSubscribe(apiPath, 'GET', error);
            });
    }

    public post(url: string, body: any, options?: RequestOptionsArgs, apiPath?: string): Observable<any> {
        apiPath = apiPath ? apiPath : url;
        return super.post(url, body, this.requestOptions(options))
            .catch(this.onCatch)
            .do((res: Response) => {
                this.onSubscribe(apiPath, 'POST', res);
            },
            (error: Response) => {
                this.onSubscribe(apiPath, 'POST', error);
            });
    }

    public put(url: string, body: any, options?: RequestOptionsArgs, apiPath?: string): Observable<any> {
        apiPath = apiPath ? apiPath : url;
        return super.put(url, body, this.requestOptions(options))
            .catch(this.onCatch)
            .do((res: Response) => {
                this.onSubscribe(apiPath, 'PUT', res);
            }, (error: Response) => {
                this.onSubscribe(apiPath, 'PUT', error);
            });
    }

    public delete(url: string, options?: RequestOptionsArgs, apiPath?: string): Observable<any> {
        apiPath = apiPath ? apiPath : url;
        return super.delete(url, options)
            .catch(this.onCatch)
            .do((res: Response) => {
                this.onSubscribe(apiPath, 'DELETE', res);
            }, (error: Response) => {
                this.onSubscribe(apiPath, 'DELETE', error);
            });
    }

    private requestOptions(options?: RequestOptionsArgs): RequestOptionsArgs {
        if (options == null) {
            options = new RequestOptions();
        }
        if (options.headers == null) {
            options.headers = new Headers();
        }

        options.headers.set('Cache-Control', 'no-cache');
        options.headers.set('Pragma', 'no-cache');
        options.headers.set('Expires', 'Sat, 01 Jan 2000 00:00:00 GMT');
        options.headers.set('If-Modified-Since', '0');

        return options;
    }

    private onCatch(error: any, caught: Observable<any>): Observable<any> {
        return Observable.throw(error);
    }

    private onSubscribe(url: string, apiType: string, res: Response): void {
        let gmtTrackData = {
            apiPath: url,
            apiStatusCode: res.status,
            apiStatusText: res.statusText,
            apiType,
            event: 'ajaxComplete'
        };

        let body = res.json();

        if (body.errors !== undefined) {
            gmtTrackData['apiServicesFailed'] = body.errors.toString();
        }

        this.analyticsService.gtmTrackEvent(gmtTrackData);
    }
}

export function httpFactory(xhrBackend: XHRBackend, requestOptions: RequestOptions, analyticsService: Analytics) {
    return new RetailHubHttpInterceptor(xhrBackend, requestOptions, analyticsService);
}
