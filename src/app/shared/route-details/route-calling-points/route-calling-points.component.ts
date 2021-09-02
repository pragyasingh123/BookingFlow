import {Component, OnInit, Input} from '@angular/core';
import { JourneyLeg, IRouteDetailsCallPoint } from '../../../models/route-details';
import { LocationService } from '../../../services/locations.service';
import * as moment from 'moment';

@Component({
  selector: 'app-route-calling-points',
  styleUrls: ['route-calling-points.component.scss'],
  templateUrl: 'route-calling-points.component.html'
})
export class RouteCallingPointsComponent implements OnInit {
  @Input() public journeyLeg: JourneyLeg;
  @Input() public isSimplified: boolean = false;
  public expanded: boolean = false;
  public duration: string;
  constructor(private locationService: LocationService) {}

  public ngOnInit(): void {
    this.duration = this.formatDuration(Math.abs(moment(this.journeyLeg.datetimeto).diff(moment(this.journeyLeg.datetimefrom), 'minutes')));
  }

  public toggleCallingPoints(): void {
    this.expanded = !this.expanded;
  }

  public tubeName(stationNo: any): string {
    let stationName = '';
    this.locationService.findOne({ id: stationNo }).subscribe((station: any) => {
      stationName = station.name;
    });

    return stationName;
  }

  public tubeJourneyTime(tubeLeg: any): string {
    return this.formatDuration(Math.abs(moment(tubeLeg.datetimeto).diff(moment(tubeLeg.datetimefrom), 'minutes')));
  }

  public formatDuration(time: any): string {
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

  public displayJourneyTime(position: number, maxPosition: number, callPointItem: IRouteDetailsCallPoint): string {
    return position === (maxPosition - 1) ? callPointItem.arriveTime : callPointItem.departTime;
  }

  public isDelayed(callingPoint: IRouteDetailsCallPoint): boolean {
    return callingPoint.isCPointDelayed;
  }

  public isCancelled(callingPoint: IRouteDetailsCallPoint): boolean {
    return callingPoint.isCPointCancelled;
  }

  public displayDisruptionTime(position: number, maxPosition: number, callPointItem: IRouteDetailsCallPoint): string {
    const isCallingPoints = !(position === 0 || position === (maxPosition - 1));

    if (!isCallingPoints && this.isDelayed(callPointItem)) {
      return callPointItem.expectedDateTime;
    }

    if (isCallingPoints && this.isDelayed(callPointItem)) {
      return `Exp: ${callPointItem.expectedDateTime}`;
    }

    if (this.isCancelled(callPointItem)) {
      return 'Cancelled';
    }
  }

  public showHideCallingPoints(index: number, callingPointLength: number): boolean {
     return !(!this.expanded && index == 0 && callingPointLength > 2);
  }
}
