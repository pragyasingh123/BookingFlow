import { Injectable, Output, EventEmitter } from '@angular/core';

@Injectable()
export class BasketContinueButtonService {
  @Output() public change: EventEmitter<any> = new EventEmitter();

  public continue() {
    this.change.emit(true);
  }
}
