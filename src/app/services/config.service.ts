import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import {BehaviorSubject, Observable} from 'rxjs/Rx';

@Injectable()
export class ConfigService {
  public config$: BehaviorSubject<IConfig>;
  public _config: IConfig = {};

  constructor() {
    this.config$ = new BehaviorSubject<IConfig>(this._config);
    this.setupStorage();
  }

  public setupStorage(): void {
    if (!this.localStorageAvailable()) { return; }

    this._config = JSON.parse(window.localStorage.getItem('config') || '{}');

    if (window.localStorage.getItem('fares') == null) {
      window.localStorage.setItem('fares',  JSON.stringify([]));
    }
  }

  public has(key: string): any {
    return _.has(this._config, key);
  }

  public get(key: string): any {
    return _.get(this._config, key);
  }

  public set(key: string, value: string|number|boolean|object): void {
    if (!this.localStorageAvailable()) { return; }

    _.set(this._config, key, value);
    window.localStorage.setItem('config', JSON.stringify(this._config));
    this.config$.next(this._config);
  }

  public localStorageAvailable(): boolean {
    let test = 'test';

    try {
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
  }

  public sessionStorageAvailable(): boolean {
    let test = 'test';

    try {
        sessionStorage.setItem(test, test);
        sessionStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
  }
}

export interface IConfig {
  [key: string]: string|number|boolean|object;
}
