import { Component, OnInit, Inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Observable } from 'rxjs/Rx';
import * as _ from 'lodash';
import { Router} from '@angular/router';
import { BasketService } from '../services/basket.service';
import { UserService } from '../services/user.service';
import { UiService } from '../services/ui.service';
import { Basket } from '../models/basket';
import { Trip } from '../models/trip';
import { Analytics } from '../services/analytics.service';
import { InitiatePaymentCriteria } from '../models/initiate-payment-criteria';
import { CONFIG_TOKEN } from '../constants';

@Component({
  selector: 'app-review-order',
  styleUrls: ['review-order.component.scss'],
  templateUrl: 'review-order.component.html'
})
export class ReviewOrderComponent implements OnInit {
  public trips: Trip[] = [];
  public voucherErrorResponse: any;
  public showLoadingState: boolean = false;
  public processBasket: boolean = false;
  public apiErrorMessage: string = "Sorry, there's a problem with our system. Please try booking your journey again.";
  private voucherCode: string;
  private hasVCvalidationError: boolean;
  private hasVCSubmitSuccess: boolean;
  private hasVCSubmitError: boolean;
  private basket: Basket;

  private voucherCodeValidationMessages: object[] = [
    { value: 'InvalidCode', msg: 'The eVoucher code is not valid, Please try again' },
    { value: 'VoucherExpired', msg: 'The eVoucher code is expired. Please try again' },
    { value: 'VoucherAlreadyClaimed', msg: 'The eVoucher code is already claimed. Please try again' },
    { value: 'VoucherCancelled', msg: 'The eVoucher code is cancelled. Please try again' },
    { value: 'Failed', msg: 'A failure has occurred. Please try again' }
  ];

  constructor(
    private userService: UserService,
    private basketService: BasketService,
    private uiService: UiService,
    private titleService: Title,
    private router: Router,
    private analytics: Analytics,
    @Inject(CONFIG_TOKEN) private config: any) {}

  public ngOnInit(): void {
    const that = this;
    this.processBasket = true;
    this.basketService.refresh().subscribe(() => {
      that.processBasket = false;
    });
    this.titleService.setTitle('Review your order');
    this.analytics.trackPage(this.titleService.getTitle());
    this.basketService.basket$.subscribe((basket: Basket) => this.basket = basket );

    this.router.routerState.root.queryParams.subscribe((url) => {
      if (url[ 'sk' ]) {
        this.analytics.gtmTrackEvent({
          errorMessage: 'Error 3: Payment processing failed in AUP.',
          errorType: 'Error after CreditCall handoff',
          event: 'error'
        });

        this.uiService.error('Payment declined, please try again later');
      }
    });
  }

  public hyphenateVoucherCode(e: any): void {
    // for single-char alphanumeric keypresses
    if (e.key.length === 1 && e.key.search(/\w/) !== -1) {
      // insert hyphen after every 5th alphanum char typed, as they are typed
      let vcLen = e.target.value.replace(/-|\s/g, '').length;
      if (vcLen !== 0 && vcLen % 5 === 0) {
        this.voucherCode += '-';
      }
      this.voucherCode.toUpperCase();
    }
  }

  public cancelAmend(): void {
    this.basketService.cancelAmendBooking().subscribe((response) => {
      this.basketService.routeToMyAccount();
    }, (err) => {
      throw(err);
    });
  }

  public addVoucherCode(v: any): void {
    this.hasVCSubmitError = false;
    if (v == undefined) { return; }
    // validate if 25 character A-Z, 0-9 string without hyphens
    let cleanVoucherCode = v.substring(0, 30).replace(/-|_|\s/g, '').toUpperCase();

    if (cleanVoucherCode.search(/^[A-Za-z0-9]{25}$/) !== -1) {
      this.hasVCvalidationError = false;
      this.showLoadingState = true;
      this.userService.addVoucher(cleanVoucherCode).subscribe((response) => {
        this.hasVCSubmitSuccess = true;
        this.voucherCode = '';

        this.analytics.gtmTrackEvent({
          event: 'formSubmit',
          form: 'evoucher-added',
          options: ''
        });
      }, (error) => {
        this.voucherErrorResponse = error.errors[0];
        this.hasVCSubmitError = true;
        this.showLoadingState = false;
      }, () => {
        this.showLoadingState = false;
      });
    } else {
      this.hasVCvalidationError = true;
    }
  }

  public continueJourney(e: any): void {
    e.preventDefault();
    if (_.some(this.basket.trips, (t: Trip) => t.seatReservationStillNeededOnSomeJourneys)) {
      this.uiService.alert('You have one or more journeys in your basket which require seat reservations. Please add your seat reservations before continuing.');
      this.uiService.smoothScroll('reservationError', 450);
      return;
    }

    this.processBasket = true;
    this.basketService.checkBasketJourneysStatus().subscribe((status: string) => {
      this.handleJourneyStatus(status).subscribe((continueWithPayment: boolean) => {
        if (continueWithPayment) {
          this.initiatePayment();
        } else {
          this.processBasket = false;
        }
      });
    });
  }

  public handleJourneyStatus(status: string): Observable<boolean> {
    if (status == 'Delayed' || status == 'Cancelled') {
      var title = '';
      var message = 'Do you want to proceed?';
      var options = [
        { label: 'Yes', value: true },
        { label: 'No', value: false }
      ];

      // provide choice for delayed service, confirmation only for cancelled
      switch (status) {
        case 'Cancelled':
          title = 'One of the selected services has been cancelled.';
          break;
        case 'Delayed':
          title = 'One of the selected services is delayed.';
          break;
        default: break;
      }

      this.analytics.gtmTrackEvent({
        errorMessage: 'Error 1: One of the selected services has been cancelled or delayed.',
        errorType: 'Error prior to AUP handoff',
        event: 'error',
      });

      this.analytics.gtmTrackEvent({
        event: 'pop-over',
        'pop-over': 'journey-delayed/journey-cancelled'
      });

      return this.uiService.prompt(title, message, options).map((val) => {
        if (val === 1) { return; }

        this.analytics.gtmTrackEvent({
          'engagement-name': 'disrupted-journey-messaging',
          event: 'engagement',
          options: val === true ? 'accept' : 'decline'
        });

        return !!val;
      });
    }

    return Observable.of(true);
  }

  public initiatePayment(): void {
    this.processBasket = true;
    this.basketService.initiatePayment(new InitiatePaymentCriteria()).subscribe((response: IInitiatePaymentResult) => {
      if (!response.data) {
        this.handleCheckoutError(response);
        return;
      }

      this.routeToAUP(response.data.paymenturl);
    }, (err) => {
      this.uiService.error(this.apiErrorMessage);
      this.processBasket = false;
    });
  }

  public handleCheckoutError(response: any): void {
    let errors = response.errors || [];
    let firstError = errors.length > 0 ? errors[0] : '';

    this.analytics.gtmTrackEvent({
      errorMessage: 'Error 2: ' + (firstError || this.apiErrorMessage),
      errorType: 'Error prior to AUP handoff',
      event: 'error'
    });

    if (errors.some((item) => item.indexOf('delivery') > -1)) {
      this.uiService.alert('Please check your delivery options in your basket and try again');
      this.router.navigate([ '/delivery' ]);
    } else if (errors.some((item) => item.indexOf('reservation') > -1)) {
      this.uiService.alert('Please check your delivery options and seat reservations in your basket an try again');
    } else if (errors.length > 0) {
      let fullErrorMessage = errors.filter((item) => item).join('. ');
      this.uiService.alert(fullErrorMessage);
    } else {
      this.uiService.alert(this.apiErrorMessage);
    }

    this.processBasket = false;
  }

  public routeToAUP(URL) {
    window.location.href = URL;

    this.analytics.gtmTrackEvent({
      'engagement-name': 'handoff-to-aup',
      event: 'engagement',
      options: this.basket.totalCostPence
    });
  }
}

export interface IInitiatePaymentResult {
  environment: string;
  version: string;
  rhendpoint: string;
  data?: {
    paymenturl: string;
  };
  success: boolean;
  errors: any[];
}
