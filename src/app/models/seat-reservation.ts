import * as moment from 'moment';
import * as _ from 'lodash';

export class SeatReservation {
  public id: number;
  public timetableJourneyId: number;
  public timetableLegId: number;
  public direction: string;
  public coaches: ICoachDescription[] = [];
  public hasAsterisks: boolean = false;
  public attributes: ISeatReservationAttributes = {
    Aisle: false,
    Backwards: false,
    NonSmoking: false,
    Window: false
  };
  public expires: moment.Moment;
  public coach: string;
  public seat: string;
  public type: string;
  public placesoverbooked: number;
  public placesreserved: number;

  constructor(private _apiResponse?: IReservationApiResponse) {
    if (this._apiResponse.type !== 'S' && this._apiResponse.type !== 'B' && this._apiResponse.type !== 'C') {
      throw new Error('Not a reservation');
    }

    this.id = this._apiResponse.id;
    this.timetableJourneyId = this._apiResponse.timetablejourneyid;
    this.timetableLegId = this._apiResponse.timetablelegid;
    this.direction = this._apiResponse.direction;
    this.expires = moment(this._apiResponse.expiry);
    this.type = this._apiResponse.type;
    this.placesoverbooked = this._apiResponse.placesoverbooked;
    this.placesreserved = this._apiResponse.placesreserved;

    this.parseCoaches();
  }

  public parseCoaches(): void {
    this._apiResponse.places.forEach((x) => {
      if (x.place.coach === '*') {
        this.hasAsterisks = true;
        return;
      }

      let coaches = this.coaches.filter((c) => c.name === x.place.coach);

      if (coaches.length > 0) {
        coaches[0].seats.push({
          attributes: this.type.toLowerCase() == 'c' ? null : this.parseAttributes(x.place.attributes),
          description: this.type.toLowerCase() == 'c' ? x.place.placeid.trim() : `Seat: ${x.place.placeid.trim()}: `,
          name: x.place.placeid.trim()
        });
      } else {
        this.coaches.push({
          description: `Coach: ${x.place.coach.trim()} `,
          name: x.place.coach.trim(),
          seats: [{
            attributes: this.type.toLowerCase() == 'c' ? null : this.parseAttributes(x.place.attributes),
            description: this.type.toLowerCase() == 'c' ? `Place(s): ${x.place.placeid.trim()}` : `Seat: ${x.place.placeid.trim()}: `,
            name: x.place.placeid.trim()
          }]
        });
      }
    });
  }

  private parseAttributes(attributes: Array<{
    attribute: {
      code: string,
      description: void | string,
      type: void | string
    }
  }>): string {
    let result: string = '';

    attributes.forEach((x, index) => {
      if (x.attribute.code === 'NSMK') {
        result += 'No smoking, ';
      } else if (x.attribute.code === 'WIND') {
        result += 'Window, ';
      } else if (x.attribute.code === 'AISL') {
        result += 'Aisle, ';
      } else if (x.attribute.code === 'BACK') {
        result += 'Backwards, ';
      } else if (x.attribute.code === 'FACE') {
        result += 'Forwards, ';
      } else if (x.attribute.code === 'TABL') {
        result += 'Table, ';
      } else if (x.attribute.code === 'AIRL') {
        result += 'Airline, ';
      } else if (x.attribute.code === 'QUIE') {
        result += 'Quiet coach, ';
      } else if (x.attribute.code === 'LOWR') {
        result += 'Lower, ';
      } else if (x.attribute.code === 'UPPR') {
        result += 'Upper, ';
      }
    });

    return result.trim().replace(/^[,\s]+|[,\s]+$/g, '');
  }
}

interface ICoachDescription {
  name: string;
  description: string;
  seats: IDescription[];
}
export interface IDescription {
  name: string;
  description: string;
  attributes: null | string;
}

export interface ISeatReservationAttributes {
  NonSmoking: boolean;
  Window: boolean;
  Aisle: boolean;
  Backwards: boolean;
}

export interface IReservationApiResponse {
  aftersales: any[];
  bestfit: string;
  coachsplit: string;
  direction: string;
  expiry: string;
  fareId: number;
  groupId: number;
  id: number;
  nrsreference: string;
  places: Array<{
    place: {
      attributes: Array<{
        attribute: {
          code: string,
          description: void | string,
          type: void | string
        }
      }>,
      coach: string,
      gender: string,
      placeid: string
    }
  }>;
  placesoverbooked: number;
  placesreserved: number;
  timetablejourneyid: number;
  timetablelegid: number;
  type: string;
  customer: {};
}
