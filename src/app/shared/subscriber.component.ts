import { Subscription } from 'rxjs/Subscription';
import { OnDestroy } from '@angular/core';

export class SubscriberComponent implements OnDestroy {
  protected subscriptions: Subscription[] = [];

  public ngOnDestroy() {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }
}
