import { Component, Inject, OnInit } from '@angular/core';
import { Router, NavigationEnd, NavigationStart, RoutesRecognized } from '@angular/router';
import { BasketService } from './services/basket.service';
import { RetailhubApiService } from './services/retailhub-api.service';
import { Observable } from 'rxjs/Rx';
import { Title } from '@angular/platform-browser';
import { IWindow } from './models/confirmation-ga';
import { Analytics } from './services/analytics.service';
import { CONFIG_TOKEN } from './constants';
import { CheapestFareFinderService } from './services/cheapest-fare-finder.service';
import { Device } from 'ng2-device-detector/src';
import { NreHelper } from './services/nre-helper/nre-helper';

declare var window: Window;

@Component({
  selector: 'app-root',
  styleUrls: ['app.component.scss'],
  templateUrl: 'app.component.html'
})
export class AppComponent implements OnInit {
  public showSessionExpiryDialog: boolean = false;
  public window: Window;
  private ready: Observable<boolean>;
  private basketRefreshing: boolean = false;
  private progressStep: number;
  private isRouteLoaded: boolean = false;

  constructor(
    @Inject(CONFIG_TOKEN) private config: any,
    private basketService: BasketService,
    private retailhubApiService: RetailhubApiService,
    private title: Title,
    private analytics: Analytics,
    public router: Router,
    public cheapestFareFinderService: CheapestFareFinderService,
    public device: Device
  ) {
    // Enable if you want the entire UI to wait until the first basket result is obtained
    // this.ready = this.basketService.ready$;
    this.ready = Observable.of(true);

    // track router changes for GTM analytics
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.isRouteLoaded = false;
      }
      if (event instanceof RoutesRecognized) {
        this.progressStep = event.state.root.firstChild.data.progressStep;
      }
      if (event instanceof NavigationEnd) {
        this.analytics.gtmTrackPage(window.location, event.url);
        this.isRouteLoaded = true;
      }
    });
  }

  public ngOnInit(): void {
    if (this.config.tagManagerContainer && this.config.tagManagerContainer.length) {
      // attach google analytics script with account specific ID
      var ga_code =
        "(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='//www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','" +
        this.config.tagManagerContainer +
        "');";
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.innerHTML = ga_code;
      document.body.appendChild(script);
    }

    if (this.config.beaconScriptUrl && this.config.beaconScriptUrl.length) {
      let beaconScript = document.createElement('script');
      beaconScript.type = 'text/javascript';
      beaconScript.src = this.config.beaconScriptUrl;
      document.body.appendChild(beaconScript);
    }

    this.basketService.isBasketRefreshing$.subscribe((ready) => {
      this.basketRefreshing = ready;
    });

    this.retailhubApiService._isSessionInvalid$.subscribe((response) => {
      if (response === true) {
        this.showSessionExpiryDialog = true;
        NreHelper.removeNreVisualFLag();
      }
    });
  }

  public resetState(): void {
    this.basketService.clearBasketSession();
    this.showSessionExpiryDialog = false;
  }
}
