import { Injectable } from '@angular/core';
import {CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router} from '@angular/router';
import {Observable, Subscriber} from 'rxjs/Rx';
import {UserService} from '../services/user.service';
import {BasketService} from '../services/basket.service';
import * as moment from 'moment';
import { Basket } from '../models/basket';

@Injectable()
export class RequiresLoginGuard implements CanActivate {
  constructor(private userService: UserService, private router: Router, private basketService: BasketService) {
    if (this.userService.userAuthenticated()) {
      this.userService.isLoggedIn$.next(true);
    } else {
      this.userService.isLoggedIn$.next(false);
    }
  }

  public canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Observable<boolean> {
    return Observable.create((observer: Subscriber<any>) => {
      // Determine if user is logged in
      this.userService.isLoggedIn$.subscribe((isLoggedIn: boolean) => {
        if (isLoggedIn) {
          observer.next(true);
        } else {
          observer.next(false);
          // If not logged in, send use to the login with a redirect param. We omit the leading '/' because the Angular
          // router chokes on it when reloading the page and cant match a route
          this.router.navigate(['/login', {redirect: state.url.substr(1) }]);
        }
        observer.complete();
      });
    });
  }
}
