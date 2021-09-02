import { Injectable } from '@angular/core';
import {CanActivate} from '@angular/router';
import {BasketService} from '../services/basket.service';
import {Observable, Subscriber} from 'rxjs/Rx';

@Injectable()
export class BasketReadyGuard implements CanActivate {
  constructor(private basketService: BasketService) {}

  public canActivate(): Observable<boolean> {
    return this.basketService.isBasketReady$.first((ready) => ready === true);
  }
}
