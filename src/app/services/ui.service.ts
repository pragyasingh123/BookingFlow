import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Subject, ReplaySubject, Observable } from 'rxjs/Rx';

@Injectable()
export class UiService {
  public count: number = 0;
  public notifications$: ReplaySubject<IUiServiceNotification>;

  constructor() {
    this.notifications$ = new ReplaySubject<IUiServiceNotification>();
  }

  public error(msg: string): Subject<UiServiceEventTypes> {
    return this.emit(msg, UiServiceNotificationTypes.Error);
  }

  public errorWithButton(msg: string): Subject<UiServiceEventTypes> {
    return this.emit(msg, UiServiceNotificationTypes.ErrorWithButton);
  }

  public alert(msg: string): Subject<UiServiceEventTypes> {
    return this.emit(msg, UiServiceNotificationTypes.Alert);
  }

  public alertLong(msg: string): Subject<UiServiceEventTypes> {
    return this.emit(msg, UiServiceNotificationTypes.AlertLong);
  }

  public alertWithButton(msg: string): Subject<UiServiceEventTypes> {
    return this.emit(msg, UiServiceNotificationTypes.AlertWithButton);
  }

  public alertVeryLong(msg: string): Subject<UiServiceEventTypes> {
    return this.emit(msg, UiServiceNotificationTypes.AlertVeryLong);
  }

  public info(msg: string): Subject<UiServiceEventTypes> {
    return this.emit(msg, UiServiceNotificationTypes.Info);
  }

  public infoLong(msg: string, isHtml: boolean = false, type = UiServiceNotificationTypes.InfoLong): Subject<UiServiceEventTypes> {
    return this.emit(msg, type, true, isHtml);
  }

  public modal(msg: string, isHtml: boolean = false, type = UiServiceNotificationTypes.Info): Subject<UiServiceEventTypes> {
    return this.emit(msg, type, true, isHtml);
  }

  public confirm(title: string, msg: string): Observable<any> {
    return this.prompt(title, msg, [
      {label: 'OK', value: true},
      {label: 'Cancel', value: true}
    ]);
  }

  public prompt(title: string, msg: string, options: IUiServicePromptOptions[]): Observable<any> {
    return this.emit(msg, UiServiceNotificationTypes.Prompt, false, false, title, options);
  }

  public smoothScroll(eID: string, offset: number = 0): boolean {
    var startY = this.currentYPosition();
    var stopY = this.elmYPosition(eID, offset);
    var distance = stopY > startY ? stopY - startY : startY - stopY;
    if (distance < 100) {
        scrollTo(0, stopY); return;
    }
    var speed = Math.round(distance / 100);
    if (speed >= 20) { speed = 20; }
    var step = Math.round(distance / 25);
    var leapY = stopY > startY ? startY + step : startY - step;
    var timer = 0;
    if (stopY > startY) {
        for ( var i = startY; i < stopY; i += step ) {
            setTimeout('window.scrollTo(0, ' + leapY + ')', timer * speed);
            leapY += step; if (leapY > stopY) { leapY = stopY; } timer++;
        } return;
    }
    for ( var i = startY; i > stopY; i -= step ) {
        setTimeout('window.scrollTo(0, ' + leapY + ')', timer * speed);
        leapY -= step; if (leapY < stopY) { leapY = stopY; } timer++;
    }
    return false;
  }

  private currentYPosition(): number {
    // Firefox, Chrome, Opera, Safari
    if (self.pageYOffset) {
      return self.pageYOffset;
    }
    // Internet Explorer 6 - standards mode
    if (document.documentElement && document.documentElement.scrollTop) {
      return document.documentElement.scrollTop;
    }
    // Internet Explorer 6, 7 and 8
    if (document.body.scrollTop) {
      return document.body.scrollTop;
    }
    return 0;
  }

  private elmYPosition(eID: string, offset: number = 0): number {
    var elm = document.getElementById(eID);
    var y = elm.offsetTop - offset;
    var node = elm;
    while (node.offsetParent && node.offsetParent != document.body) {
        node = node.offsetParent as HTMLElement;
        y += node.offsetTop;
    } return y;
  }

  private emit(msg: string, type: UiServiceNotificationTypes, modal = false, isHtml = false, title?: string, options?: IUiServicePromptOptions[]): Subject<UiServiceEventTypes> {
    this.count++;

    let typeString;
    switch (type) {
      case UiServiceNotificationTypes.Error:
        typeString = 'error';
        break;
      case UiServiceNotificationTypes.ErrorWithButton:
        typeString = 'errorWithButton';
        break;
      case UiServiceNotificationTypes.Alert:
        typeString = 'alert';
        break;
      case UiServiceNotificationTypes.AlertWithButton:
        typeString = 'alertWithButton';
        break;
      case UiServiceNotificationTypes.Info:
        typeString = 'info';
        break;
      case UiServiceNotificationTypes.Dialogue:
        typeString = 'dialogue';
        break;
      case UiServiceNotificationTypes.Prompt:
        typeString = 'prompt';
        break;
      case UiServiceNotificationTypes.ExtendedInfo:
        typeString = 'extendedInfo';
      case UiServiceNotificationTypes.DeliveryInfo:
        typeString = 'deliveryInfo';
        break;
      case UiServiceNotificationTypes.InfoLong:
        typeString = 'infoLong';
        break;
    }

    let notificationEvents = new Subject<UiServiceEventTypes>();

    this.notifications$.next({
      dismissed: false,
      events: notificationEvents,
      id: this.count,
      isHtml,
      isModal: modal,
      msg,
      options,
      time: moment(),
      title,
      type,
      typeString
    });

    return notificationEvents;
  }
}

export enum UiServiceNotificationTypes {
  Error,
  ErrorWithButton,
  Alert,
  AlertLong,
  AlertWithButton,
  AlertVeryLong,
  Info,
  Dialogue,
  Prompt,
  ExtendedInfo,
  DeliveryInfo,
  InfoLong
}

export enum UiServiceEventTypes {
  Shown,
  Dismissed
}

export interface IUiServiceNotification {
  id: number;
  title?: string;
  msg: string;
  options?: IUiServicePromptOptions[];
  isHtml: boolean;
  type: UiServiceNotificationTypes;
  typeString: string;
  time: moment.Moment;
  dismissed: boolean;
  isModal: boolean;
  events: Subject<any>;
}

export interface IUiServicePromptOptions {
  label: string;
  value?: any;
}
