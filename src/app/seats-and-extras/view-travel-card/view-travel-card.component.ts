import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ITravelcard } from '../../models/trip';
import { UiService } from '../../services/ui.service';
import { Analytics } from '../../services/analytics.service';
import { BasketService } from '../../services/basket.service';
import { ButtonComponent } from '../../shared/button/button.component';
import { AdultChildrenPluralService } from '../../services/adult-children-plural.service';

@Component({
  selector: 'app-view-travel-card',
  styleUrls: ['view-travel-card.component.scss'],
  templateUrl: 'view-travel-card.component.html'
})
export class ViewTravelCardComponent implements OnInit {
  @Input() public travelcard = null as ITravelcard;
  @Output() public onRemoveClicked = new EventEmitter<boolean>();
  private isSendingRequest: boolean = false;

  constructor(private uiService: UiService, private analytics: Analytics, private adultChildrenService: AdultChildrenPluralService) { }

  public ngOnInit(): void {}

  public remove(option: any): void {
    this.isSendingRequest = true;
    this.onRemoveClicked.emit(option);
  }

  public edit(option: any): void {
    this.analytics.gtmTrackEvent({
      event: 'formSubmit',
      form: 'edit-london-travelcard',
      options: ''
    });
  }

  public showInfo(): void {
    this.uiService.modal(`<p>With a Travelcard you can travel as often as you like on bus, Tube, tram, DLR, London Overground and National Rail services within the London travel zones.</p>`, true);
  }

  private getPassengersInfo(): string {
    return this.adultChildrenService.styleAdultChildDisplay(this.travelcard.adults, this.travelcard.children, true);
  }
}
