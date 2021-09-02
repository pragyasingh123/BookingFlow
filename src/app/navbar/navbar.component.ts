import { Component, OnInit } from '@angular/core';
import { ReplaySubject } from 'rxjs/Rx';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { BasketService } from '../services/basket.service';
import { Basket } from '../models/basket';
import { User } from '../models/user';
import { BasketContinueButtonService } from './../services/basket-continue-button.service';
import { NreHelper } from '../services/nre-helper/nre-helper';

@Component({
  selector:   'app-navbar',
  styleUrls:  ['navbar.component.scss'],
  templateUrl: 'navbar.component.html'
})
export class NavbarComponent implements OnInit {
  public user$: ReplaySubject<User>;
  public showBasket: boolean = true;
  public continueBtnText: string = '';
  public showDeliveryBtn: boolean = false;
  public showOnReviewOrder: boolean = true;
  private basketDropdownOpen: boolean = false;
  private basket: Basket;
  private production: boolean = false;
  private shortUrl: string = '';

  constructor(
    private router: Router,
    private basketService: BasketService,
    private userService: UserService,
    private basketContinueButtonService: BasketContinueButtonService
  ) {
    this.basketService.basket$.subscribe((basket: Basket) => {
      this.basket = basket;
    });

    this.user$ = this.userService.user$;

    if (this.userService.userAuthenticated()) {
      this.userService.isLoggedIn$.next(true);
      this.user$.next(this.userService.getUserDetails());
    }

    this.router.events.subscribe((event) => {
      if (event.url) {
        var urlRoute = event.url.split(/[ ;]+/, 1);
        this.shortUrl = event.url.split(/[;\/]/)[1].toLowerCase();
        this.nextStepCTA(this.shortUrl);
        this.shortUrl === 'login' ? this.showDeliveryBtn = true : this.showDeliveryBtn = false;
        this.shortUrl === 'review-order' ? this.showOnReviewOrder = false : this.showOnReviewOrder = true;
        this.showBasket = !(urlRoute.toString().substr(1) === this.router.config[10].path);
      }
    });
  }

  public ngOnInit(): void {}

  public continueToNextStep(): void {
    this.basketDropdownOpen = false;
    this.basketContinueButtonService.continue();
  }

  public gotoDelivery(): void {
    this.basketDropdownOpen = false;
    this.router.navigate(['./delivery']);
  }

  public editExtras(e): void {
    this.basketDropdownOpen = false;
  }

  private nextStepCTA(step): void {
    switch (step) {
      case 'selections':
        this.continueBtnText = 'Continue to seats & extras';
        break;
      case 'seats-and-extras':
        this.continueBtnText = 'Continue to delivery details';
        break;
      case 'delivery':
        this.continueBtnText = 'Continue to review your order';
        break;
      case 'login':
        this.continueBtnText = 'Return to delivery details';
        break;
      case 'review-order':
        this.continueBtnText = 'Continue to payment';
        break;
      default:
        this.continueBtnText = 'Continue';
    }
  }

  private clearNreFlag(): void {
    NreHelper.removeNreVisualFLag();
  }
}
