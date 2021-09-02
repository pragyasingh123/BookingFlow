import { Component, OnChanges, OnInit, Input, EventEmitter, Output, Inject } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { JourneyService } from '../../services/journey.service';
import { RouteDetails } from '../../models/route-details';
import { Observable } from 'rxjs/Rx';
import * as _ from 'lodash';
import * as moment from 'moment';
import { SubscriberComponent } from '../subscriber.component';
import { JourneySearchResult } from '../../models/journey-search-result';
import { IRouteDetailParams } from '../../models/route-detail-params';
import { JourneySearchResultService, IInreInfo } from '../../models/journey-search-result-service';
import { JourneySelectionService } from '../../services/journey-selection-service';
import { CONFIG_TOKEN } from '../../constants';

@Component({
  selector: 'app-route-details',
  styleUrls: [ 'route-details.component.scss' ],
  templateUrl: 'route-details.component.html'
})
export class RouteDetailsComponent extends SubscriberComponent implements OnChanges, OnInit {
  public get isWaitingForParams(): boolean {
    return this.waitForParams && !this.params;
  }

  public get isAnyLegDelayed(): boolean {
    return this.routeDetails.journeyLegs.some((leg) => leg.callingPoints.some((cp) => cp.isCPointDelayed));
  }

  public get isAnyLegCancelled(): boolean {
    return this.routeDetails.journeyLegs.some((leg) => leg.callingPoints.some((cp) => cp.isCPointCancelled));
  }

  @Input() public params: IRouteDetailParams;
  @Input() public closeSubscription: boolean = false;
  @Input() public waitForParams: boolean = false;
  @Output() public closeEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();
  public routeDetails: RouteDetails;
  private isSearchInProgress$: Observable<boolean>;
  private searchResults: JourneySearchResult;
  private routeDuration: string;
  private routeChanges: number;
  private permittedLocations: any;
  private isSleeper: boolean = false;
  private isSlowTrain: boolean = false;
  private direction: string = '';
  private legTimes = [];
  private nreObjectArray: IInreInfo[] = [];
  private showHideNreDetails: boolean = true;
  private tflLinkUrl: string;

  constructor(
    private activeRoute: ActivatedRoute,
    private _location: Location,
    private journeyService: JourneyService,
    private journeySelectionService: JourneySelectionService,
    @Inject(CONFIG_TOKEN) private config: any) {
    super();
    this.isSearchInProgress$ = this.journeyService.isSearchInProgress$.asObservable();

    // Last search
    this.journeyService.searchResults$.subscribe((searchResults: JourneySearchResult) => this.searchResults = searchResults);
    this.tflLinkUrl = config.data.links.metroInfo;
  }

  public JourneyLegChange(journeyLegs: any): void {
    let legTimes = _.map(journeyLegs, (leg: IJourneyLeg) => {
      let departTime = Number(moment(leg.datetimefrom).format('H'));
      let underground = leg.mode.id.toLowerCase() == 'x' && leg.mode.name.toLowerCase() == 'transfer';

      return {
        isUndergroundInNight: underground && departTime >= 0 && departTime < 6,
        timeEnd: leg.datetimeto,
        timeStart: leg.datetimefrom
      };
    });

    this.expandJourneyLegChange(legTimes);
  }

  public expandJourneyLegChange(legTimes: IConnetcionTime[]): void {
    _.each(legTimes, (currentLeg: IConnetcionTime, index: number) => {
      if (legTimes[index + 1] !== undefined) {
        let duration;

        if (index == 0 && currentLeg.isUndergroundInNight) {
          duration = this.setDuration(currentLeg.timeStart, legTimes[index + 1].timeStart);
        } else if (index > 0 && currentLeg.isUndergroundInNight) {
          let lastIndex = this.findIndex(index, legTimes);

          if (lastIndex - 1 >= 0) {
            duration = this.setDuration(legTimes[lastIndex - 1].timeEnd, legTimes[index + 1].timeStart);
          } else {
            duration = this.setDuration(legTimes[lastIndex].timeStart, legTimes[index + 1].timeStart);
          }
        } else {
          duration = this.setDuration(currentLeg.timeEnd, legTimes[index + 1].timeStart);
        }

        this.legTimes.push({
          duration,
          isUndergroundInNight: currentLeg.isUndergroundInNight,
          nextConnectionIsUndergroundInNight: legTimes[index + 1].isUndergroundInNight
        });
      }
    });
  }

  public backToJourneys(): void {
    if (this.closeSubscription) {
      this.closeEmitter.emit(true);
    } else {
      this._location.back();
    }
  }

  public ngOnInit(): void {
    if (this.waitForParams) {
      if (this.params) {
        this.parseQueryParams(this.params);
      }
    } else {
      this.subscriptions.push(this.activeRoute.params.subscribe((params) => this.parseQueryParams(params)));
    }
  }

  public ngOnChanges(): void {
    if (this.waitForParams) {
      if (this.params) {
        this.parseQueryParams(this.params);
      }
    }
  }

  public checkForNre(service: any): void {
    service._apiResponse.servicelegs.forEach((singleLeg) => {
      if ( singleLeg.nrenotices !== undefined && singleLeg.nrenotices.length > 0 ) {
        singleLeg.nrenotices.forEach((element) => {
          const nreObject: IInreInfo = { nreUrl: null, nreHeader: null, nreNotice: null };
          let pushThisObj = false;

          if (element.noticeheader !== undefined && element.noticeheader !== '') {
            nreObject.nreHeader = element.noticeheader;
            pushThisObj = true;
          }
          if (element.noticetext !== undefined && element.noticetext !== '') {
            nreObject.nreNotice = element.noticetext;
            pushThisObj = true;
          }
          if (element.noticeurl !== undefined && element.noticeurl !== '') {
            nreObject.nreUrl = element.noticeurl;
          }
          if (pushThisObj) {
            this.nreObjectArray.push(nreObject);
          }
        });
      }
    });
  }

  public displayNre(): boolean {
    let displayNreCheck: boolean = false;
    if (this.nreObjectArray.length > 0) {
      displayNreCheck = true;
    }
    return displayNreCheck;
  }

  public toggleNreView(): void {
    this.showHideNreDetails = !this.showHideNreDetails;
  }

  public formatDuration(time: any): string {
    if (time !== null) {
      let m = time % 60;
      let h = (time - m) / 60;

      if (h > 0) {
        return h.toString() + 'h' + ' ' + m.toString() + 'm';
      } else {
        return (m.toString() + 'm');
      }
    }
  }

  private findPermittedLocations(service: JourneySearchResultService, compareFareId: string) {
    let permittedLocations = _.result(_.find(service.otherfaregroups, function(ticket) {
      return ticket.faregroupid === compareFareId;
    }), 'permittedlocations');

    return permittedLocations;
  }

  private parseQueryParams(params: IRouteDetailParams | any): void {
    this.direction = params.direction;
    let searchResults: JourneySearchResult;
    const tripNumber = Number(params.tripNumber);

    if (!isNaN(tripNumber)) {
      searchResults = this.journeySelectionService.getTrip(tripNumber).searchResults;
    } else {
      searchResults = this.searchResults;
    }
    let services: JourneySearchResultService[] = this.direction === 'inbound' ? searchResults.returnServices : searchResults.outwardServices;
    let service = services.find((x) => x.id.toString() === params.serviceId);

    if (service) {
      // extract information from journey labels
      let labels = service.flags.map((label) => {
        return label.toLowerCase().replace(/ /g, '');
      });
      this.isSleeper = labels.indexOf('sleeper') !== -1;
      this.isSlowTrain = service.isSlowTrain;
      this.routeChanges = service.changes;
      this.routeDuration = service.durationLabel;

      this.journeyService.getRouteDetails(service.journeydetailsuri, service.legFacilities).subscribe((data) => {
        this.routeDetails = data;
        this.JourneyLegChange(this.routeDetails.journeyLegs);
      });

      if (params.fareGroupId) {
        this.permittedLocations = this.findPermittedLocations(service, params.fareGroupId);
      } else if (service.hasCheapestReturnFareCost && !service.hasCheapestSingleFareCost) {
        this.permittedLocations = this.findPermittedLocations(service, service.cheapestReturnFareGroup);
      } else {
        this.permittedLocations = this.findPermittedLocations(service, service.cheapestSingleFareGroup);
      }
      this.checkForNre(service);
    }
  }

  private setDuration(timeFrom: string, timeTo: string): string {
    return this.formatDuration(Math.abs(moment(timeFrom).diff(moment(timeTo), 'minutes')));
  }

  private findIndex(inputIndex, legs) {
    let j = 1;
    let lastIndex = inputIndex;

    while (inputIndex - j >= 0 && legs[inputIndex - j].isUndergroundInNight) {
      lastIndex = inputIndex - j;
      j--;
    }

    return lastIndex;
  }
}

export interface IJourneyLeg {
  isDisrupted: boolean;
  datetimefrom: string;
  datetimeto: string;
  callingPoints: Array<{
    label: string;
    arriveTime: string;
    departTime: string;
    expectedDateTime: string;
    isCPointCancelled: boolean;
    isCPointDelayed: boolean;
  }>;
  facilities: Array<{
    icon: string;
    label: string;
  }>;
  mode: {
    id: string;
    icon: string;
    name: string;
    isStandard: boolean;
    isConnection: boolean;
  };
  toc: string;
  finalDestination: string;
}

export interface IConnetcionTime {
  isUndergroundInNight: boolean;
  timeEnd: string;
  timeStart: string;
}
