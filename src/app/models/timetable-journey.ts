import { ILocationApiResponse, Location } from './location';
import { IAccommodationSupplement } from './journey';
import { SeatReservation } from './seat-reservation';

import * as _ from 'lodash';
import * as moment from 'moment';

export class TimetableJourney {
  public id: number;
  public origin: Location;
  public origindeparture: moment.Moment;
  public destination: Location;
  public destinationarrival: moment.Moment;
  public legs: ITimetableLeg[];

  constructor(
    private _apiResponse: ITimetableJourneyApiResponse,
    locations: ILocationApiResponse[],
    reservations: SeatReservation[]) {
      this.id = _apiResponse.id;
      this.parseLocations(locations);
      this.parseLegs(locations, reservations);
      this.parseTimes();
  }

  private parseLocations(locations: ILocationApiResponse[]) {
    this.origin = new Location(_.find(locations, { nlc: this._apiResponse.origin }));
    this.destination = new Location(_.find(locations, { nlc: this._apiResponse.destination }));
  }

  private parseTimes() {
    this.origindeparture = moment(this._apiResponse.origindeparture);
    this.destinationarrival = moment(this._apiResponse.destinationarrival);
  }

  private parseLegs(locations: ILocationApiResponse[], reservations: SeatReservation[]) {
    this.legs = this._apiResponse.timetablelegs.map((x) => {
      let seatReservation = [];
      let bikeReservation = [];

      reservations.forEach((element, index) => {
        if (element.timetableJourneyId === this.id && element.timetableLegId === x.id) {
          if (element.type.toLowerCase() == 'c') {
            bikeReservation.push(reservations[index]);
          } else {
            seatReservation.push(reservations[index]);
          }
          return;
        }
      });

      let allowsReservation = x.reservable !== '_' && seatReservation.length === 0;
      let isOptionalReservation = x.reservable === 'R' || x.reservable === 'S';
      let isMandatoryReservation = x.reservable === 'A';

      return {
        allowsReservation,
        arrival: new Location(_.find(locations, { nlc: x.arrivalstation })),
        bikeReservation,
        departure: new Location(_.find(locations, { nlc: x.departurestation })),
        id: x.id,
        mode: x.mode,
        reservable: x.reservable,
        reservationIsMandatory: isMandatoryReservation,
        reservationIsOptional: isOptionalReservation,
        seatReservation
      };
    });
  }
}

export interface ITimetableJourneyApiResponse {
  destination: string;
  destinationarrival: string;
  direction: string;
  id: number;
  ignore: string;
  journeyposition: string;
  offpeakstatus: string;
  origin: string;
  origindeparture: string;
  timetablelegs: Array<{
    arrivalstation: string,
    arrivalstoptype: string,
    arrivaltime: string,
    countedplaces: string,
    departurestation: string,
    departurestoptype: string,
    departuretime: string,
    id: number,
    mileage: number,
    mode: string,
    reservable: string,
    retailtrainid: string,
    seatclass: string,
    sleeperclass: string,
    toc: string,
    timetablesource: string,
    trainarrivaltime: string,
    traindestination: string,
    trainid: string,
    trainorigin: string,
    trainstarttime: string,
    uid: string,
    disruptiondata: {}
  }>;
}

export interface ITimetableLeg {
  id: number;
  departure: Location;
  arrival: Location;
  seatReservation: SeatReservation[];
  bikeReservation: SeatReservation[];
  reservable: string;
  mode: string;
  allowsReservation: boolean;
  reservationIsOptional: boolean;
  reservationIsMandatory: boolean;
}
