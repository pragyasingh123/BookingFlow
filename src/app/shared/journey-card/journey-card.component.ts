import { Component, OnInit, Input, Output, EventEmitter, Inject } from '@angular/core';
import { JourneySearchResultService } from '../../models/journey-search-result-service';
import { LatestAvailability } from '../../models/latest-availability';
import { IRouteDetailParams } from '../../models/route-detail-params';
import { JourneyService } from '../../services/journey.service';
import * as moment from 'moment';
import * as _ from 'lodash';

@Component({
  selector: 'app-journey-card',
  styleUrls: [ 'journey-card.component.scss' ],
  templateUrl: 'journey-card.component.html'
})
export class JourneyCardComponent implements OnInit {
  @Input() public service: JourneySearchResultService;
  @Input() public hasGroupedStation: boolean = false;
  @Input() public showLoadingState: boolean = false;
  @Input() public isSingleReturn: boolean = false;
  @Input() public isJourneyAmend: boolean = false;
  @Input() public direction: string = '';
  @Input() public seletedOutwardService: JourneySearchResultService;
  @Output() public onSelect: EventEmitter<JourneySearchResultService> = new EventEmitter<JourneySearchResultService>();

  private serviceId: number;
  private timeDepart: string;
  private timeArrive: string;
  private isSlowTrain: boolean = false;
  private numChanges: number = 0;
  private issues: boolean;
  private duration: string;
  private cheapestFareLabel: string;
  private modifier: number;
  private limitedInventory: boolean;
  private labels: string[] = [];
  private price: number;
  private deliveryAvailable: boolean = false;
  private hasChildSleeper: boolean = false;
  private isSleeper: boolean = false;
  private serviceDisabled: boolean = false;
  private deliveryTime: moment.Moment;
  private limitedInventoryAmount: number;
  private autoSelect: boolean = false;
  private services: any = [];
  private routeDetailsParams: IRouteDetailParams;
  private serviceNotAvailable: boolean = false;
  private isSmartcardAvailable: boolean = false;

  constructor(private journeyService?: JourneyService) { }

  public ngOnInit(): void {
    this.timeDepart = this.service.departureDateTime.format('HH:mm');
    this.timeArrive = this.service.arrivalDateTime.format('HH:mm');
    this.isSlowTrain = this.service.isSlowTrain;
    this.price = this.service.cheapestFareCost;
    this.issues = this.service.hasIssues;
    this.duration = this.service.durationLabel;
    this.numChanges = this.service.changes;
    this.cheapestFareLabel = this.service.cheapestFareLabel;
    this.labels = this.service.flags;
    this.serviceDisabled = this.service.serviceDisabled;

    this.journeyService.getLowestLatestAvailability().subscribe((la: LatestAvailability) => {
      let latestAvailabilityTotalMinutes = la.totalNumberOfMinutes();
      this.deliveryTime = moment(this.service.departureDateTime).subtract(latestAvailabilityTotalMinutes, 'minutes');
      if (this.deliveryTime.diff(moment(), 'minutes') > latestAvailabilityTotalMinutes) {
        this.deliveryAvailable = true;
      }
    });

    if (this.seletedOutwardService !== undefined) {
      if (this.service.departureDateTime.isBefore(this.seletedOutwardService.arrivalDateTime)) {
        this.serviceDisabled = true;
      }

      if (!this.isSingleReturn && this.seletedOutwardService.cheapestReturnFareGroup) {
        let fareGroupIds = [];
        _.forEach(this.service.otherfaregroups, function(value) {
          fareGroupIds.push(value.faregroupid);
        });
        this.serviceNotAvailable = !(fareGroupIds.indexOf(this.seletedOutwardService.cheapestReturnFareGroup) > -1);
      }

      if (this.seletedOutwardService.cheapestSingleFareCost && this.isSingleReturn && this.service.cheapeastSingleReturn) {
        let priceDiff = this.seletedOutwardService.cheapeastSingleReturn.returnfarecost - this.seletedOutwardService.cheapeastSingleReturn.singlefarecost;
        this.price = (this.service.cheapeastSingleReturn.singlefarecost - priceDiff) / 100;
        let ticketTypeSR = this.findTicketType(this.service.cheapeastSingleReturn.singlefarecost, this.service.cheapeastSingleReturn.singlefaregroupid);

        if (ticketTypeSR && this.price != 0) {
          this.cheapestFareLabel = ticketTypeSR + ' from';
        } else {
          this.cheapestFareLabel = 'Single from';
        }
      } else {
        this.price = 0;
        let ticketType;
        if (this.service.cheapeastSingleReturn) {
          ticketType = this.findTicketType(this.service.cheapeastSingleReturn.singlefarecost, this.service.cheapeastSingleReturn.singlefaregroupid);
        } else {
          ticketType = null;
        }

        if (ticketType && this.price != 0) {
          this.cheapestFareLabel = ticketType + ' from';
        } else {
          this.cheapestFareLabel = 'Return from';
        }
      }
    }

    if (this.service.isHighlightPromotion) {
      this.modifier = 1;
    } else if (this.service.hasRailcard) {
      this.modifier = 2;
    } else if (this.service.isHighlightPromotion) {
      this.modifier = 3;
    }
    this.hasChildSleeper = this.service.hasChildSleeper;
    this.isSleeper = this.service.isSleeper;
    this.limitedInventoryAmount = this.service.limitedInventoryAmount;

    if (this.limitedInventoryAmount > 0) {
      this.limitedInventory = true;
    }

    // the information a route details dialog needs from the journey
    this.routeDetailsParams = {
      direction: this.direction,
      serviceId: this.service.id
    };

    this.isSmartcardAvailable = this.service.isSmartcardService;
  }

  public getChangesMsg(num: any): string {
    var s = num > 1 ? 's' : ''; // pluralise
    return num === 0 ? 'Direct' : num + ' change' + s;
  }

  public getLimitedInventoryMsg(num: any): string {
    return num + ' left at this price';
  }

  public addJourney(e: any): void {
    e.preventDefault();
    this.onSelect.emit(this.service);

    if (localStorage.getItem('CheapestNotification') !== null) {
      localStorage.removeItem('CheapestNotification');
    }
  }

  public get statusIcon() {
    let icon = {
      name: '',
      type: ''
    };

    if (!this.issues && !this.isSlowTrain) {
      icon.name = icon.type = 'info';
    }

    if (!this.issues && this.isSlowTrain) {
      icon.name = icon.type = 'overtaking';
    }

    if (!this.issues && this.service.nrePresent) {
      icon.name = icon.type = 'warning_black_yellow';
    }

    if (this.issues) {
      icon.name = 'alert';
      icon.type = 'warning_black_yellow';
    }

    if (this.service.expectedDepartureTime || this.service.expectedArrivalTime) {
      icon.name = 'warning';
      icon.type = 'warning_major';
    }

    if (this.isPartCancelled) {
      icon.name = 'alert';
      icon.type = 'warning_black_yellow';
    }

    return icon;
  }

  public get isServiceAvailable(): boolean {
    return !this.service.departureDateTime.isBefore() && this.deliveryAvailable;
  }

  public get isServiceEnabled(): boolean {
    return !this.serviceDisabled && !this.serviceNotAvailable;
  }

  public get isPartCancelled(): boolean {
    return this.service.isPartCancelled;
  }

  public get hasLegBus(): boolean {
    return this.service.hasLegBus;
  }

  public get canAddJourney(): boolean {
    let isNextStepAllowed = true;

    if (this.isPartCancelled || this.service.isCancelled) {
      isNextStepAllowed = false;
    }

    if (this.isPartCancelled && this.hasLegBus) {
      isNextStepAllowed = true;
    }

    return this.isServiceAvailable && isNextStepAllowed;
  }

  public findTicketType(compareCost: number, compareFareId: string) {
    let ticketType = _.result(_.find(this.service.otherfaregroups, function(ticket) {
      return ticket.faregroupid === compareFareId && ticket.cost.totalfare === compareCost;
    }), 'faregroupname');

    return ticketType;
  }
}
