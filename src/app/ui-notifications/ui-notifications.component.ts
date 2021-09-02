import {Component, OnInit, ElementRef, Renderer, HostListener, Inject} from '@angular/core';
import { UiService, IUiServiceNotification, UiServiceNotificationTypes, UiServiceEventTypes } from '../services/ui.service';
import * as _ from 'lodash';
import {Observable, Subscription, Subject, ReplaySubject} from 'rxjs/Rx';
import {ButtonComponent} from '../shared/button/button.component';
import { Analytics } from '../services/analytics.service';
import { Router } from '@angular/router';
import { BasketService } from '../services/basket.service';
import { JourneySelectionService } from '../services/journey-selection-service';
import { CookieService } from 'angular2-cookie/core';
import { Device } from 'ng2-device-detector/src/services/ng2-device.service';
import { RoutingService } from '../services/routing.service';
import { DomSanitizer } from '@angular/platform-browser';
import {CONFIG_TOKEN} from '../constants';

@Component({
  selector: 'app-ui-notifications',
  styleUrls: ['ui-notifications.component.scss'],
  templateUrl: 'ui-notifications.component.html'
})
export class UiNotificationsComponent implements OnInit {
  public errors: IUiServiceNotification[] = [];
  public alerts: IUiServiceNotification[] = [];
  public infos: IUiServiceNotification[] = [];
  public dialogues: IUiServiceNotification[] = [];
  public currentModalTitle: string;
  public currentModal: IUiServiceNotification | void;
  public currentPrompt: IUiServiceNotification;
  public modalSubject: ReplaySubject<IUiServiceNotification> = new ReplaySubject<IUiServiceNotification>(1);
  public promptSubject: ReplaySubject<IUiServiceNotification> = new ReplaySubject<IUiServiceNotification>(1);
  public defaultDismissTime: number = 5000;
  public extendDismissTime: number = 15000;
  public minuteDismisstime: number = 60000;
  public autoDismissTimeout: number;
  public uiSubscription: Subscription;
  private alertTopValue: number;
  private tripNo: number;

  constructor(
    private sanitizer: DomSanitizer,
    private basketService: BasketService,
    private journeySelectionService: JourneySelectionService,
    private cookieService: CookieService,
    private device: Device,
    private routingService: RoutingService,
    private router: Router,
    private uiService: UiService,
    private el: ElementRef,
    private renderer: Renderer,
    private analytics: Analytics,
    @Inject(CONFIG_TOKEN) private config: any) {
    this.uiSubscription = router.events.subscribe((route) => {
      this.setTripId(route.url);
      setTimeout(() => {
        this.calculateYellowBannerTopPosition();
      }, 250);
    });
    this.autoDismissTimeout = this.defaultDismissTime;
    // Parse the toast subscriptions
    this.uiSubscription = this.uiService.notifications$
      .filter((notification: IUiServiceNotification) => notification.isModal === false)
      .subscribe((notification: IUiServiceNotification) => {

      // reset errors stop multiple error banners showing if timeout has not passed.
      this.errors = [];
      this.handleTracking(notification);
      let avoidTimer: boolean = false;

      switch (notification.type) {
        case UiServiceNotificationTypes.Error:
          this.errors.push(notification);
          break;
        case UiServiceNotificationTypes.ErrorWithButton:
          avoidTimer = true;
          this.errors.push(notification);
          break;
        case UiServiceNotificationTypes.Alert:
          this.alerts.push(notification);
          break;
        case UiServiceNotificationTypes.AlertLong:
          this.autoDismissTimeout = this.extendDismissTime;
          this.alerts.push(notification);
          break;
        case UiServiceNotificationTypes.AlertWithButton:
          avoidTimer = true;
          this.alerts.push(notification);
          break;
        case UiServiceNotificationTypes.AlertVeryLong:
          this.autoDismissTimeout = this.minuteDismisstime;
          this.alerts.push(notification);
          break;
        case UiServiceNotificationTypes.Info:
          this.infos.push(notification);
          break;
        case UiServiceNotificationTypes.Dialogue:
          this.dialogues.push(notification);
          break;
      }

      if (!avoidTimer) {
        setTimeout(() => {
          this.dismissToast(notification);
          this.autoDismissTimeout = this.defaultDismissTime;
        }, this.autoDismissTimeout);
      }
    });

    this.uiService.notifications$
      .filter((notification: IUiServiceNotification) => notification.isModal === true)
      .subscribe((notification: IUiServiceNotification) => {
      this.modalSubject.next(notification);
    });
    this.uiService.notifications$
      .filter((notification: IUiServiceNotification) => notification.type === UiServiceNotificationTypes.Prompt)
      .subscribe((notification: IUiServiceNotification) => {
      this.promptSubject.next(notification);
    });

    this.modalSubject.subscribe((notification: IUiServiceNotification) => {
      this.currentModal = notification;

      switch (notification.type) {
        case UiServiceNotificationTypes.Error:
          this.currentModalTitle = 'Error';
          break;
        case UiServiceNotificationTypes.ErrorWithButton:
          this.currentModalTitle = 'Error';
          break;
        case UiServiceNotificationTypes.Alert:
          this.currentModalTitle = 'Alert';
          break;
        case UiServiceNotificationTypes.AlertLong:
          this.currentModalTitle = 'Alert';
          break;
        case UiServiceNotificationTypes.AlertWithButton:
          this.currentModalTitle = 'Alert';
          break;
        case UiServiceNotificationTypes.AlertVeryLong:
          this.currentModalTitle = 'Alert';
          break;
        case UiServiceNotificationTypes.ExtendedInfo:
          this.currentModalTitle = notification.title || 'Info';
          break;
        case UiServiceNotificationTypes.DeliveryInfo:
          this.currentModalTitle = 'Delivery information';
          break;
        default:
          this.currentModalTitle = 'Info';
      }

      if (notification && notification.isHtml) {
        setTimeout(() => {
          const modalDomElement = this.el.nativeElement.getElementsByClassName('modal-content-html');
          if (modalDomElement && modalDomElement.length > 0) {
            this.renderer.setElementProperty(modalDomElement[0], 'innerHTML', notification.msg );
          }
        }, 100);
      }
    });

    this.promptSubject.subscribe((notification: IUiServiceNotification) => {
      this.currentPrompt = notification;

      // In case a value has not been specified per option
      for (let i = 0; i < this.currentPrompt.options.length; i++) {
        if (this.currentPrompt.options[i].value === undefined) {
          this.currentPrompt.options[i].value = this.currentPrompt.options[i].label;
        }
      }

    });
  }
  public ngOnInit(): void {

  }
  @HostListener('window:scroll', [])
  @HostListener('window:resize', [])
  public onWindowScroll(): void {
    this.calculateYellowBannerTopPosition();
  }
  public onResize() {
    this.calculateYellowBannerTopPosition();
  }

  public dismissToast(toast: IUiServiceNotification): void {
    toast.dismissed = true;

    setTimeout(() => {
      toast.events.next(UiServiceEventTypes.Dismissed);

      switch (toast.type) {
        case UiServiceNotificationTypes.Error:
          _.remove(this.errors, {id: toast.id});
          break;
        case UiServiceNotificationTypes.ErrorWithButton:
          _.remove(this.errors, {id: toast.id});
          break;
        case UiServiceNotificationTypes.Alert:
          _.remove(this.alerts, {id: toast.id});
          break;
        case UiServiceNotificationTypes.AlertLong:
          _.remove(this.alerts, {id: toast.id});
          break;
        case UiServiceNotificationTypes.AlertWithButton:
          _.remove(this.alerts, {id: toast.id});
          break;
        case UiServiceNotificationTypes.AlertVeryLong:
          _.remove(this.alerts, {id: toast.id});
          break;
        case UiServiceNotificationTypes.Info:
          _.remove(this.infos, {id: toast.id});
          break;
        case UiServiceNotificationTypes.Dialogue:
          _.remove(this.dialogues, {id: toast.id});
          break;
      }
    }, 300);
  }

  public closeModal(notification: IUiServiceNotification): void {
    notification.events.next(UiServiceEventTypes.Dismissed);
    this.currentModal = null;
  }

  public onPromptOptionClick(option: any): void {
    this.currentPrompt.events.next(option.value);
    this.currentPrompt = null;
  }

  public ngOnDestroy(): void {
    this.uiSubscription.unsubscribe();
  }

  private isReservationAmendButtonCase(alertTypeMessage: string): boolean {
    return alertTypeMessage === 'alertWithButton' || alertTypeMessage === 'errorWithButton' ? true : false;
  }

  private setTripId(url: string): void {
    const urlData = this.sanitizer.bypassSecurityTrustUrl(url);
    if (urlData['changingThisBreaksApplicationSecurity'] && urlData['changingThisBreaksApplicationSecurity'].indexOf('/seats-and-extras') !== -1) {
      const orgUrl = /seats-and-extras\/([0-9]+)/;
      const match = orgUrl.exec(urlData['changingThisBreaksApplicationSecurity']);
      if (match !== null && match[1] && !isNaN(parseInt(match[1]))) {
        this.tripNo = parseInt(match[1]);
      }
    }
  }
  private removeTrip(toast: IUiServiceNotification): void {
    this.dismissToast(toast);
    this.basketService.removeTrip(this.tripNo).subscribe((response) => {
      this.analytics.gtmTrackEvent({
        event: 'remove-item'
      });
      this.journeySelectionService.removeTrip(this.tripNo);
    });
    this.basketService.basket$.subscribe((res) => {
      if (res.isEmpty) {
        let qttFirstStage = this.cookieService.get('qttFirstStage');
        if (qttFirstStage == 'mixingDeck' && !this.device.isMobile()) {
          this.routingService.redirectDesktop();
        } else {
          this.routingService.redirectMobile();
        }
      }
    });
  }

  private calculateYellowBannerTopPosition(): void {
    const offset: number = window.pageYOffset || 0;
    const redAlertBanner = this.el.nativeElement.parentElement.getElementsByClassName('alert-message-content');
    this.alertTopValue = 0;
    if (redAlertBanner.length > 0) {
      const calculationFromTheTop: number = redAlertBanner[0].clientHeight - offset;
      if (calculationFromTheTop > 0) {
        this.alertTopValue = calculationFromTheTop;
      }
    }
  }

  private handleTracking(notification: any): void {
    let type: string;
    const redAlertBanner = this.el.nativeElement.parentElement.getElementsByClassName('alert-message-content');
    if (redAlertBanner.length > 0) {
      this.calculateYellowBannerTopPosition();
    } else {
      this.alertTopValue = undefined;
    }

    switch (notification.type) {
      case UiServiceNotificationTypes.Error:
        type = 'Full-width-pop-down:red';

        break;
      case UiServiceNotificationTypes.Alert:
        type = 'Full-width-pop-down:yellow';
        break;
    }

    this.analytics.gtmTrackEvent({
      event: 'Impression',
      options: `${type}:${notification.msg}`
    });
  }
}
