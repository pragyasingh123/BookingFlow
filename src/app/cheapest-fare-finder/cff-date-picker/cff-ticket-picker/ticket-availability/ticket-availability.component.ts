import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ticket-availability',
  styleUrls: ['./ticket-availability.component.scss'],
  templateUrl: './ticket-availability.component.html'
})
export class TicketAvailabilityComponent {
  @Input() public isAvailable: boolean;
  @Input() public isSelected: boolean;
  @Input() public isSoldOut: boolean;
}
