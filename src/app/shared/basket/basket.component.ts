import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';
import { BasketService } from '../../services/basket.service';
import { Basket } from '../../models/basket';
import { Trip } from '../../models/trip';

@Component({
  selector:   'app-basket',
  styleUrls:  ['basket.component.scss'],
  templateUrl: 'basket.component.html'
})
export class BasketComponent implements OnInit {
  public nectarPts: number;

  @Input() public basket: Basket;
  @Output() public onEdit: EventEmitter<Trip> = new EventEmitter<Trip>();

  constructor(private basketService: BasketService) {}

  public ngOnInit(): void {}

  public editTrip(e: any): void {
    this.onEdit.emit(e);
  }
}
