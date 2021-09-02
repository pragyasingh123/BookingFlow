import { Component, OnInit, Input, Output, EventEmitter, Inject } from '@angular/core';
import * as _ from 'lodash';
import { IRouteDetailParams } from '../../models/route-detail-params';
import { CONFIG_TOKEN } from '../../constants';

@Component({
  selector: 'app-ticket-first-card',
  styleUrls: [ '../selections.component.scss', './ticket-first-card.component.scss' ],
  templateUrl: './ticket-first-card.component.html'
})
export class TicketFirstCardComponent implements OnInit {
  @Input() public tickets: any;
  @Input() public selectedService: any;
  @Input() public tripNumber: number;
  @Input() public singles: boolean;
  @Output() public onSelect: EventEmitter<any> = new EventEmitter();
  public assistedTravelLink: string = '';
  private outboundSingles: any[] = [];
  private returnSingles: any[] = [];
  private returnTickets: any[] = [];

  constructor(@Inject(CONFIG_TOKEN) private config?: any) { }

  public ngOnInit(): void {
    if (this.singles) {
      _.map(this.tickets, (ticket: ITrip) => {
        if (ticket.isreturn) {
          this.returnTickets.push(ticket);
        } else {
          if (ticket.cost.isreturn) {
            this.returnSingles.push(ticket);
          } else {
            this.outboundSingles.push(ticket);
          }
        }
      });
    }
    this.assistedTravelLink = this.config.data.links.assistedTravel;
  }

  public getRouteParams(ticket: any): IRouteDetailParams {
    return {
      direction: ticket.cost.isreturn ? 'inbound' : 'outbound',
      fareGroupId: ticket.faregroupid,
      serviceId: ticket.cost.isreturn ? this.selectedService.returnServiceId : this.selectedService.outwardserviceid,
      tripNumber: this.tripNumber
    };
  }

  public selectOtherTicket(ticket: any): void {
    this.onSelect.emit(ticket);
  }
}

export interface ITrip {
  isreturn: boolean;
  cost: {
    isreturn: boolean;
  };
}
