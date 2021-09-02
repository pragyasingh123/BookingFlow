import { Component, OnInit, Inject } from '@angular/core';
import { CONFIG_TOKEN } from '../../constants';

@Component({
  selector: 'app-disruption-alert',
  styleUrls: [ 'disruption-alert.component.scss'],
  templateUrl: 'disruption-alert.component.html'
})
export class DisruptionAlertComponent implements OnInit {
  private checkYourJourneyUrl: string;

  constructor( @Inject(CONFIG_TOKEN) private config?: any) {
    this.checkYourJourneyUrl = config.data.links.checkYourJourney;
  }

  public ngOnInit(): void {}
}
