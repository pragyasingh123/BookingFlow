import { Component, Input } from '@angular/core';

@Component({
  selector:   'app-bike-reservation-desc-card',
  styleUrls:  ['bike-reservation-desc-card.component.scss'],
  templateUrl: 'bike-reservation-desc-card.component.html'
})

export class BikeReservationDescCardComponent {
  @Input() public reservation: any;

  constructor() {}
}
