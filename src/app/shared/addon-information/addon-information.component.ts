import { Component, OnInit, Input } from '@angular/core';
import { ITravelcard, IPlusBus} from '../../models/trip';
import { ILegolandAndWestgateBus } from '../../models/legoland-westgate';
import { UiService } from '../../services/ui.service';
import { AdultChildrenPluralService } from '../../services/adult-children-plural.service';

@Component({
  selector:   'app-addon-information',
  styleUrls:  ['addon-information.component.scss'],
  templateUrl: 'addon-information.component.html'
})
export class AddonInformationComponent implements OnInit {
  @Input() public travelcard = null as ITravelcard;
  @Input() public plusBuses: IPlusBus[];
  @Input() public legolandBus: ILegolandAndWestgateBus;
  @Input() public oxfordWestgate: ILegolandAndWestgateBus;

  constructor(private uiService: UiService, private adultChildrenService: AdultChildrenPluralService) { }

  public ngOnInit(): void {}

  public showInfo(): void {
    this.uiService.modal(`<p>With a Travelcard you can travel as often as you like on bus, Tube, tram, DLR, London Overground and National Rail services within the London travel zones.</p>`, true);
  }

  private getPassengersInfo(): string {
    return this.adultChildrenService.styleAdultChildDisplay(this.travelcard.adults, this.travelcard.children, true);
  }

  private pluralAdults(adults: number): string {
    return this.adultChildrenService.styleAdult(adults);
  }

  private pluralChildren(children: number): string {
    return this.adultChildrenService.styleChildren(children);
  }
}
