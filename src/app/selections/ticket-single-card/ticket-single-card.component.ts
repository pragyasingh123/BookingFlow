import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { UiService } from '../../services/ui.service';
import * as _ from 'lodash';
import { IRouteDetailParams } from '../../models/route-detail-params';

@Component({
  selector: 'app-ticket-single-card',
  styleUrls: ['../selections.component.scss', './ticket-single-card.component.scss'],
  templateUrl: './ticket-single-card.component.html'
})
export class TicketSingleCardComponent implements OnInit {
  @Input() public tickets: any;
  @Input() public selectedService: any;
  @Input() public tripNumber: number;
  @Output() public onSelect: EventEmitter<any> = new EventEmitter();

  public ticketsCheapest: any;
  public singleTickets: any;

  constructor(private uiService?: UiService) { }

  public ngOnInit(): void {
    this.ticketsCheapest = _.take(this.tickets, 3);
    this.singleTickets = _.takeRight(this.tickets, (this.tickets.length - 3));
  }

  public getRouteParams(ticket: any, returnDirection: any): IRouteDetailParams {
    return {
      direction: returnDirection ? 'inbound' : 'outbound',
      fareGroupId: ticket.faregroupid,
      serviceId: returnDirection ? this.selectedService.returnServiceId : this.selectedService.outwardserviceid,
      tripNumber: this.tripNumber
    };
  }

  public selectOtherTicket(ticket: any): void {
    this.onSelect.emit(ticket);
  }

  public showMoreInformationReturn(): void {
    this.uiService.modal(`<p>Show more info about return tickets types</p>`, true);
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
}
