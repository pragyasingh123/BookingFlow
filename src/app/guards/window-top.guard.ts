import { Injectable } from '@angular/core';
import {CanActivate} from '@angular/router';

@Injectable()
export class WindowTopGuard implements CanActivate {
  constructor() {}

  public canActivate() {
    window.scroll(0, 0);
    return true;
  }
}
