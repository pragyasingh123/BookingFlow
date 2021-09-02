import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Journey, JourneyDirection, } from '../../models/journey';
import { ITimetableLeg } from '../../models/timetable-journey';

@Component({
  selector: 'app-view-seat-card',
  styleUrls: ['view-seat-card.component.scss'],
  templateUrl: 'view-seat-card.component.html'
})
export class ViewSeatCardComponent {
  @Input() public journey: Journey;
  @Input('heading') public directionHeading: string;
  @Output() public onRemoveClicked = new EventEmitter<boolean>();
  private pendingRemoval: boolean = false;

  constructor() {}

  public remove(): void {
    this.pendingRemoval = true;
    this.onRemoveClicked.emit(this.journey.direction === JourneyDirection.Outward);
  }

  public formatAttributes(str: any): void {
    return str.replace(', , ', '').trim();
  }
}
