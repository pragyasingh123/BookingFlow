import { Component, OnInit, OnDestroy, AfterContentInit, Inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, Observable } from 'rxjs/Rx';
import { BasketService } from '../services/basket.service';
import { ISmartcardsListItem, UserService } from '../services/user.service';
import { Basket } from '../models/basket';
import { Trip } from '../models/trip';
import { DeliveryOption } from '../models/delivery-option';
import { ConfirmationGA, IWindow } from '../models/confirmation-ga';
import { Title } from '@angular/platform-browser';
import { JourneySelectionService } from '../services/journey-selection-service';
import { Analytics } from '../services/analytics.service';
import { CONFIG_TOKEN } from '../constants';
import * as _ from 'lodash';

declare var window: IWindow;

@Component({
  selector: 'app-confirmation',
  styleUrls: [ 'confirmation.component.scss' ],
  templateUrl: 'confirmation.component.html'
})
export class ConfirmationComponent implements OnInit, OnDestroy {
  public trips: Trip[] = [];
  public selectedDeliveryOption: DeliveryOption;
  public nectarPts: number;
  public amendSuccessMessage: string = `
    <p>Your changes have been updated successfully.</p> <p>Your original tickets have been cancelled (and your seat reservations are no longer valid).
    Your amendment has been processed successfully. Please bring both your old and new tickets when you travel as this change is not valid otherwise.</p>
  `;
  private bookingRef: string;
  private orderId: string;
  private firstName: string;
  private basket: Basket;
  private showAltEmail: boolean = false;
  private changeOfJourney: boolean = false;
  private paymentFailed: boolean = false;
  private altEmail: string;
  private hasEmailValidationError: boolean;
  private storageKey: string;
  private loading: boolean = true;
  private emailPostInProgress: boolean = false;
  private amendJourneySuccess: boolean = true;
  private subscription$: Subscription;
  private basketComplete: boolean = false;
  private itsoInfo: ISmartcardsListItem;
  private window: Window;

  constructor(private basketService: BasketService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private userService: UserService,
    private titleService: Title,
    private analytics: Analytics,
    private journeySelectionService: JourneySelectionService,
    @Inject(CONFIG_TOKEN) private config: any) {
  }

  public ngOnInit(): void {
    this.titleService.setTitle('Order Confirmation');
    this.analytics.trackPage(this.titleService.getTitle());

    this.userService.user$.subscribe((user) => {
      this.altEmail = user.userprofile.email;
      this.firstName = user.userprofile.firstname;
    });

    this.router.routerState.root.queryParams.subscribe((url) => {

      if (url['sk'] !== undefined) {
        this.storageKey = url['sk'];
        this.completeCheckout(this.storageKey);
      }
    });
  }

  public viewInAccount(bookingRef): void {
    let bookingDetails = '';
    if (bookingRef && bookingRef !== 'undefined') {
      bookingDetails = '/Details/' + bookingRef + '/1';
    }

    window.location.href = this.config.myAccount + '/MyAccount/Bookings' + bookingDetails;
  }

  public cancelAmend(): void {
    this.basketService.cancelAmendBooking().subscribe((response) => {

    }, (err) => {});
  }

  public sendAltEmail(): void {
    this.hasEmailValidationError = false;
    this.emailPostInProgress = true;
    this.userService.sendConfirmationEmail({ email: this.altEmail, orderid: this.orderId }).subscribe((res: any) => {
      this.showAltEmail = !this.showAltEmail;
    }, (error: any) => {
      this.hasEmailValidationError = true;
    }, () => this.emailPostInProgress = true);
  }

  public ngOnDestroy(): void {
    if (this.subscription$ !== undefined) {
      this.subscription$.unsubscribe();
    }
  }

  private completeCheckout(storageKey): void {
    /*
    * The confirmation page is called after SUCCESSFUL payment.
    * Therefore any errors experienced during retrieving the booking reference number
    * should be treated differently and should clearly communicate to the user that the payment went through fine,
    * and he can get his booking reference number from the email confirmation or MyAccount
    *
    * This also means that we should NOT redirect the user to the failure url as that would incorrectly suggest that the payment failed
    */
    this.subscription$ = this.basketService.isBasketReady$
      .filter((basketReady) => !!basketReady)
      .switchMap(() => this.basketService.basket$).first()
      .do((basket) => {
        if (!this.basketComplete) {
          this.basket = basket;
          this.trips = this.basket.trips;
          this.selectedDeliveryOption = this.basket.selectedDeliveryOption;
          this.nectarPts = this.basket.loyaltyPoints;
          this.changeOfJourney = this.basket.ischangeofjourney;
          if (this.basket.itsoInfo) {
            this.itsoInfo = this.basket.itsoInfo;
          }
        }
      })
      .switchMap(() => this.basketService.getPaymentResult(storageKey))
      .map((paymentResult) => {
        this.bookingRef = paymentResult.data.bookingreference;
        this.orderId = paymentResult.data.orderid;
        this.titleService.setTitle('Order Confirmation - ' + this.bookingRef);

        return this.bookingRef;
      })
      .catch<any>((err) => {
        this.handlePaymentResultError(err);
        err.handled = true;
        return Observable.throw(err);
      })
      .switchMap((bookingRef) => {
        return this.basketService.purchaseBooking({ BookingReference: bookingRef });
      })
      .do((purchaseDetails) => {
        if (this.basket && purchaseDetails.data) {
          this.basket.totalEVoucherCost = this.calculateTotalPoundValue(purchaseDetails.data.altmoppayments);
          this.basket.totalCardPaymentCost = this.calculateTotalPoundValue(purchaseDetails.data.cardpayments);
          this.basket.totalOnlinePaymentCost = this.calculateTotalPoundValue(purchaseDetails.data.onlinepayments);
          this.basket.paymentSourceType = this.getPaymentSourceType(purchaseDetails.data);
        }
      })
      .catch<any>((err) => {
        if (!err.handled) {
          this.analytics.gtmTrackEvent({
            errorMessage: 'Error: Retrieving order details failed',
            errorType: 'Error after CreditCall handoff',
            event: 'error'
          });
        }
        return Observable.throw(err);
      })
      .subscribe((response) => {
        // add data to window.
        window.dataLayer.push(new ConfirmationGA(this.basket, this.orderId, this.bookingRef, 'transactionDataPushed'));

        this.basketComplete = true;
        this.finishLoading();
        this.analytics.trackGoal('Transaction');
        this.analytics.trackGoalOutcomes('Transaction', {
          monetaryValue: this.basket.totalCostPence
        });

        if (this.changeOfJourney) {
          this.cancelAmend();
        }
      }, (error: any) => {
        this.finishLoading();
      });
  }

  private getPaymentSourceType(data): string {
    if (data && data.cardpayments && data.cardpayments.length > 0) {
      return data.cardpayments[0].paymentsourcetype;
    } else if (data && data.onlinepayments && data.onlinepayments.length > 0) {
      return data.onlinepayments[0].onlinepaymenttype;
    } else {
      return 'Unknown';
    }
  }

  private handlePaymentResultError(error: any): void {
    var errorMessage = '';

    switch (error.statusCode) {
      case 400:
        errorMessage = 'Error: Storage key invalid';
        break;
      case 404:
        errorMessage = 'Error: Payment not found';
        break;
      case 401:
        errorMessage = 'Error: Payment started in different session';
        break;
      default:
        errorMessage = 'Error: Retrieving booking reference failed';
        break;
    }

    this.analytics.gtmTrackEvent({
      errorMessage,
      errorType: 'Error after CreditCall handoff',
      event: 'error'
    });
  }

  private finishLoading(): void {
    this.loading = false;
    this.clearBasket(this.basket.trips);
  }

  private clearBasket(trips): void {
    this.basketService.removeBasketTrips(trips).subscribe((response) => {
      this.basketService.refresh();
      this.journeySelectionService.clearTrips();
    });
  }

  private calculateTotalPoundValue(pencePrices): number {
    return pencePrices ? _.sumBy(pencePrices, (it: any) => it.amount) / 100 : 0;
  }
}
