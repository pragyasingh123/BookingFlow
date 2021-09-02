import { Component, Input, Inject } from '@angular/core';
import { CONFIG_TOKEN } from '../../constants';

@Component({
  selector: 'app-sleeper-modal',
  styleUrls: ['sleeper-modal.component.scss'],
  templateUrl: 'sleeper-modal.component.html'
})
export class SleeperModalComponent {
  @Input() public addToBasketByModal: () => void;

  private nightRivieraSleeperUrl: string;
  constructor(@Inject(CONFIG_TOKEN) private config: any) {
    this.nightRivieraSleeperUrl = config.data.links.nightRivieraSleeper;
  }
}
