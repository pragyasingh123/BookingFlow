import { Trip } from './../../models/trip';
import { Component, Input, Output, EventEmitter, Inject, OnInit, OnChanges } from '@angular/core';
import { IBike } from '../../models/trip';
import { UiService } from '../../services/ui.service';
import { CONFIG_TOKEN } from '../../constants';
import * as _ from 'lodash';
import { ITimetableLeg } from '../../models/timetable-journey';

@Component({
  selector: 'app-view-bike',
  styleUrls: [ 'view-bike.component.scss' ],
  templateUrl: 'view-bike.component.html'
})
export class ViewBikeComponent implements OnChanges {
  @Input() public trip: Trip;
  @Input() public bike = null as IBike;
  @Output() public onRemoveClicked = new EventEmitter<boolean>();
  private displayButtons: boolean = true;
  private isPendingRemoval: boolean = false;
  private modalMessage: any;

  constructor(private uiService: UiService, @Inject(CONFIG_TOKEN) private config: any) { }

  public ngOnChanges(changes): void {
    this.hideReservationButtons(changes.trip.currentValue);
  }

  public remove(): void {
    this.isPendingRemoval = true;
    this.onRemoveClicked.emit(true);
  }

  public showInfo(): void {
    this.modalMessage = `<p>Please note it is only possible to reserve a bike space if you also have a seat reservation.
        <a href='` + this.config.data.links.travellingWithBike + `' target='_blank'>Find out more about travelling with your bike.</a>
      </p>
      <p class='text-warning'>Bike reservation is not possible for some legs of your journey</p>`;
    this.uiService.modal(this.modalMessage, true);
  }

  private isBikeReservationExist(array: ITimetableLeg[]): boolean {
    let countOfBikeReservations: number = 0;

    _.forEach(array, function(leg) {
      countOfBikeReservations += leg.bikeReservation.length;
    });

    return countOfBikeReservations > 0 ? true : false;
  }

  private hideReservationButtons(trip: Trip): void {
    if (trip.outwardJourneys[0].timetableJourneys[0].legs.length === 1 && trip.outwardJourneys[0].timetableJourneys[0].legs[0].reservable === '_') {
      this.displayButtons = false;
    }
  }
}
