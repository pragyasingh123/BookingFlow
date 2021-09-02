import {Component, Inject} from '@angular/core';
import {CONFIG_TOKEN} from '../../constants';

@Component({
  selector: 'app-first-class-passenger-assisted-travel',
  styleUrls: ['first-class-passenger-assisted-travel.component.scss'],
  templateUrl: 'first-class-passenger-assisted-travel.component.html'
})
export class FirstClassPassengerAssistedTravel {
  private assistedTravelLink: string;

  constructor(@Inject(CONFIG_TOKEN) private config?: any) {
    this.assistedTravelLink = this.config.data.links.assistedTravel;
  }
}
