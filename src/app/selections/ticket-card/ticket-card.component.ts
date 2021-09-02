import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { IRouteDetailParams } from '../../models/route-detail-params';

@Component({
  selector: 'app-ticket-card',
  styleUrls: [ '../selections.component.scss', './ticket-card.component.scss' ],
  templateUrl: './ticket-card.component.html'
})
export class TicketCardComponent implements OnInit {

  @Input() public tickets: any;
  @Input() public selectedService: any;
  @Input() public tripNumber: number;
  @Output() public onSelect: EventEmitter<any> = new EventEmitter();

  public headerTicketType: boolean;

  constructor() { }

  public ngOnInit(): void {
    for (let ticket of this.tickets) {
      this.headerTicketType = ticket.isreturn;
    }
  }

  public getRouteParams(ticket: any): IRouteDetailParams {
    return {
      direction: ticket.isreturn ? 'inbound' : 'outbound',
      fareGroupId: ticket.faregroupid,
      serviceId: ticket.isreturn ? this.selectedService.returnServiceId : this.selectedService.outwardserviceid,
      tripNumber: this.tripNumber
    };
  }

  public checkIfSleeper(flags: any): boolean {
    let hasSleeper: boolean = false;
    if (flags) {
      const allFlags: string = flags.toString().toLowerCase();
      if (allFlags.indexOf('sleeper') > -1 || allFlags.indexOf('sleeperoptional') > -1) {
        hasSleeper = true;
      }
    }
    return hasSleeper;
  }

  public selectOtherTicket(ticket: any): void {
    this.onSelect.emit(ticket);
  }
}
