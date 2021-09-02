import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector:   'app-bike-reservation-desc',
  styleUrls:  ['bike-reservation-desc.component.scss'],
  templateUrl: 'bike-reservation-desc.component.html'
})

export class BikeReservationDescComponent {
  @Input() public bikeReservation: any;
  @Input() public direction: string;

  constructor() {}
}
