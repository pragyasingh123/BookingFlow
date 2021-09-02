import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ILegolandAndWestgateBus } from '../../models/legoland-westgate';
import { AdultChildrenPluralService } from '../../services/adult-children-plural.service';

@Component({
  selector: 'app-view-legoland-westgate-bus',
  styleUrls: ['view-legoland-westgate-bus.component.scss'],
  templateUrl: 'view-legoland-westgate-bus.component.html'
})
export class ViewLegolandWestgateBusComponent implements OnInit {

  @Input() public legolandWestgateBus: ILegolandAndWestgateBus;
  @Input() public legolandOption: boolean;
  @Output() public onRemoveClicked = new EventEmitter<boolean>();
  private isSendingRequest: boolean = false;
  private header: string;
  private bottomText: string;
  private bodyText: string;

  constructor(private adultChildrenService: AdultChildrenPluralService) {}

  public ngOnInit(): void {
    this.setupTheComponentForLegoOrOxfrodWestgateBus();
  }

  public setupTheComponentForLegoOrOxfrodWestgateBus(): void {
    if (this.legolandOption)  {
      this.header = 'Legoland Bus';
      this.bodyText = 'Travel between Windsor & Eton Central and Legoland.';
      this.bottomText = 'Add a Legoland bus ticket to your journey';
    } else {
      this.header = 'Oxford Westgate Bus Return';
      this.bodyText = 'Travel between Oxford and Oxford Westgate.';
      this.bottomText = 'Add Oxford Westgate bus ticket to your journey';
    }
  }

  public remove(option: any): void {
    this.isSendingRequest = true;
    this.onRemoveClicked.emit(option);
  }

  private pluralAdults(adults: number): string {
    return this.adultChildrenService.styleAdult(adults);
  }

  private pluralChildren(children: number): string {
    return this.adultChildrenService.styleChildren(children);
  }
}
