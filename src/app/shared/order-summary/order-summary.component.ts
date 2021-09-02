import {Component, Input} from '@angular/core';
import {ISmartcardsListItem} from '../../services/user.service';
import {ItsoHelper} from '../../delivery-details/itso-helper';

@Component({
  selector: 'app-order-summary',
  styleUrls: ['order-summary.component.scss'],
  templateUrl: 'order-summary.component.html'
})

export class OrderSummaryComponent {
  @Input() public orders;
  @Input() public review: boolean;

  constructor() {}
}
