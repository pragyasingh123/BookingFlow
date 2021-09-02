import { Component, Input } from '@angular/core';
import { Journey } from '../../models';

@Component({
  selector:   'app-bike-card',
  styleUrls:  ['bike-card.component.scss'],
  templateUrl: 'bike-card.component.html'
})

export class BikeCardComponent {
  @Input() public journey: Journey;
  @Input('heading') public directionHeading: string;

  constructor() {}
}
