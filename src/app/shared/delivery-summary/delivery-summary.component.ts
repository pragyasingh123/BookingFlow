import { Component, OnInit, Input } from '@angular/core';
import { DeliveryOption } from '../../models/delivery-option';
import { ActivatedRoute, Router} from '@angular/router';
import { ISmartcardsListItem } from '../../services/user.service';

@Component({
  selector: 'app-delivery-summary',
  styleUrls: ['delivery-summary.component.scss'],
  templateUrl: 'delivery-summary.component.html'
})

export class DeliverySummaryComponent implements OnInit {
  public price: number;
  public name: string;

  @Input() public editable: boolean;
  @Input() public selectedDeliveryOption: DeliveryOption;
  @Input() public itsoInfo = null as ISmartcardsListItem;

  constructor(private router?: Router) {}

  public ngOnInit(): void {
    this.price = parseFloat(Number(this.selectedDeliveryOption.price).toFixed(2));
    this.name = this.selectedDeliveryOption.name;
  }

  public editDelivery(): void {
    this.router.navigate(['./delivery']);
  }

  public roundPrice(data: DeliveryOption): number {
    let price: number;
    if (data !== null && data !== undefined) {
      price = parseFloat(Number(data.price).toFixed(2));
    }
    return price;
  }
}
