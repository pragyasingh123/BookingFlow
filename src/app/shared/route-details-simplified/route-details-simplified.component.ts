import {Component, Input} from '@angular/core';
import {Location} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import {JourneyService} from '../../services/journey.service';
import {RouteDetails, JourneyLeg} from '../../models/route-details';
import {Observable, BehaviorSubject} from 'rxjs/Rx';
import * as moment from 'moment';
import {dateManipulationUtils} from '../../services/date-manipulation-utils.service';
import {SubscriberComponent} from '../subscriber.component';
import {IJourneyLeg} from '../route-details';

@Component({
  selector: 'app-route-details-simplified',
  styleUrls: ['route-details-simplified.component.scss'],
  templateUrl: 'route-details-simplified.component.html'
})

export class RouteDetailsSimplifiedComponent extends SubscriberComponent {
  public routeDetails: any;
  private isSearchInProgress$: BehaviorSubject<boolean>;
  private sub: any;
  private routeDuration: string;
  private routeChanges: number = 0;
  private routeDetailsUri: string;
  private isSleeper: boolean = false;
  private legTimes: ILegDuration[] = [];

  constructor(private activeRoute: ActivatedRoute, private _location: Location, private journeyService: JourneyService) {
    super();
    this.isSearchInProgress$ = this.journeyService.isSearchInProgress$;

    this.subscriptions.push(this.activeRoute.params.subscribe((data) => {
      const outwardReturnRoute: string = data['service'];
      const uri: string = JSON.parse(sessionStorage.getItem(outwardReturnRoute));
      this.getRouteDetails(uri['routeDetailsUri']);
    }));
  }

  public getRouteDetails(uri: string): void {
    this.subscriptions.push(this.journeyService.getRouteDetails(uri).subscribe((data: RouteDetails) => {
      this.setRouteDetails(data);
    }));
  }

  public setRouteDetails(data: RouteDetails): void {
    this.isSleeper = false;
    this.routeDetails = data;
    this.countLegsDurationTimes(this.routeDetails.journeyLegs);
  }

  public getNumberOfRouteChanges(): number {
    return this.routeDetails.journeyLegs.length - 1;
  }

  public getJourneyDuration(): string {
    const departureTime = this.routeDetails.journeyLegs[0].datetimefrom;
    const arrivalTime = this.routeDetails.journeyLegs[this.routeDetails.journeyLegs.length - 1].datetimeto;
    return dateManipulationUtils.getDuration(departureTime, arrivalTime);
  }

  public countLegsDurationTimes(journeyLegs: IJourneyLeg[]): void {
    journeyLegs.forEach((leg, i) => {
      if (journeyLegs[i + 1] !== undefined) {
        this.legTimes.push({
          duration: this.formatDuration(Math.abs(moment(journeyLegs[i].datetimeto).diff(moment(journeyLegs[i + 1].datetimefrom), 'minutes')))
        });
      }
    });
  }

  public backToJourneys(): void {
    this._location.back();
  }

  public formatDuration(time: number): string {
    if (time !== null) {
      let m = time % 60;
      let h = (time - m) / 60;

      if (h > 0) {
        return (h.toString() + 'h' + ' ' + (m < 10 ? '0' : '') + m.toString() + 'm');
      } else {
        return ((m < 10 ? '0' : '') + m.toString() + 'm');
      }
    }
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
  }>;
  facilities: Array<{
    icon: string;
    label: string;
  }>;
  mode: Array<{
    id: string;
    icon: string;
    name: string;
    isStandard: boolean;
    isConnection: boolean;
  }>;
  toc: string;
  finalDestination: string;
}

export interface ILegDuration {
  duration: string;
}
