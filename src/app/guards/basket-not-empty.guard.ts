import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { BasketService } from '../services/basket.service';
import { Basket } from '../models/basket';
import { RoutingService } from '../services/routing.service';
import { Observable, Subscriber } from 'rxjs/Rx';

@Injectable()
export class BasketNotEmptyGuard implements CanActivate, CanActivateChild {
  constructor(private basketService: BasketService, private routingService: RoutingService) { }

  public canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): any {
    return Observable.create((observer: Subscriber<any>) => {
      this.basketService.basket$.first().subscribe((basket: Basket) => {
        if (this.basketService.isBasketEmpty() === false) {
          observer.next(true);
        } else {
          observer.next(false);
          this.routingService.redirectToTicketSelection();
        }
        observer.complete();
      });
    });
  }

  public canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.canActivate(route, state);
  }
}
