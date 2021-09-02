import { IFareApiResponse, Fare } from './fare';
import { Discount } from './discount';
import { ILocationApiResponse, Location } from './location';
import { SeatReservation, IReservationApiResponse } from './seat-reservation';
import { TimetableJourney, ITimetableJourneyApiResponse, ITimetableLeg } from './timetable-journey';
import { ICarbonFootprintCalculationApiResponse } from './carbon-footprint-calculation';
import * as _ from 'lodash';
import * as moment from 'moment';

export class Journey {
  public id: number;
  public origin: Location;
  public destination: Location;
  public direction: JourneyDirection;
  public directionLabel: string;
  public reservations: SeatReservation[] = [];
  public departureTime: moment.Moment;
  public arrivalTime: moment.Moment;
  public duration: number;
  public cost: number;
  public costPence: number;
  public routeDescription: string;
  public ticketTypeReturnDescription: string;
  public ticketTypeDescription: string;
  public ticketTypeCode: string;
  public label: string;
  public fares: Fare[] = [];
  public discounts: Discount[] = [];
  public timetableJourneys: TimetableJourney[] = [];
  public sleeperReservation: any;
  public seatReservationStillNeeded: boolean;
  public seatReservationRequiredAtServiceLevel: boolean;

  public get hasSeatReservation(): boolean {
    return this.timetableJourneys.some((ttJourney) => ttJourney.legs.some((l) => l.seatReservation && l.seatReservation.length > 0));
  }

  constructor(private _apiResponse?: IJourneyApiResponse) {
    this.parseLocations();
    this.parseDirection();
    this.parseFares();
    this.parseDiscount();
    this.parseReservations();
    this.parseTimes();
    this.parseCost();
    this.parseRoutes();
    this.parseTicketTypes();
    this.praseJourneId();

    this.setSeatReservationStatus();
  }

  private praseJourneId(): void {
    this.id = this._apiResponse.return ?
      this._apiResponse.returntimetablejourneys[ 0 ].id :
      this._apiResponse.outwardtimetablejourneys[ 0 ].id;
  }

  private parseLocations(): void {
    let locationOrigin = this._apiResponse.return ? this._apiResponse.destination : this._apiResponse.outwardtimetablejourneys[ 0 ].origin;
    let locationReturn = this._apiResponse.return ? this._apiResponse.origin : this._apiResponse.outwardtimetablejourneys[ 0 ].destination;

    // Find the locations (a locations array is included in the API reponse)
    this.origin = new Location(_.find(this._apiResponse.locations, { nlc: locationOrigin }));
    this.destination = new Location(_.find(this._apiResponse.locations, { nlc: locationReturn }));

    if (this._apiResponse.sleeper) { this.label = 'sleeper'; }
    this.sleeperReservation = this._apiResponse.accommodationsupplements.filter((supp) => {
      return supp.type == 'B' && supp.reservationstatus == 'R';
    });
  }

  private parseReservations(): void {
    _.each(this._apiResponse.reservations, (reservationResponse) => {
      var reservation;
      try {
        reservation = new SeatReservation(reservationResponse);
      } catch (e) {
        return;
      }

      if ((this._apiResponse.return && reservation.direction === 'R') || (!this._apiResponse.return && reservation.direction === 'O')) {
        this.reservations.push(reservation);
      }
    });
  }

  private parseRoutes(): void {
    let routeIndex = this._apiResponse.return && this._apiResponse.routes.length > 1 ? 1 : 0;
    this.routeDescription = _.get(this._apiResponse, 'routes[' + routeIndex + '].description', '');
  }

  private parseTicketTypes(): void {
    if (this._apiResponse.return && this._apiResponse.tickettypes.length > 1) {
      this.ticketTypeDescription = _.get(this._apiResponse, 'tickettypes[1].description', '');
      this.ticketTypeCode = _.get(this._apiResponse, 'tickettypes[1].code', '');
    } else {
      this.ticketTypeDescription = _.get(this._apiResponse, 'tickettypes[0].description', '');
      this.ticketTypeCode = _.get(this._apiResponse, 'tickettypes[0].code', '');
    }
  }

  private parseCost(): void {
    if (this._apiResponse.return && this._apiResponse.fares.length > 1) {
      this.costPence = this._apiResponse.fares.reduce((previousValue, currentValue) => {
        return previousValue + currentValue.totalfare;
      }, 0);

      this.cost = this.costPence / 100;
    } else {
      this.costPence = this._apiResponse.fares.reduce((previousValue, currentValue) => {
        return previousValue + currentValue.totalfare;
      }, 0);

      this.cost = this.costPence / 100;
    }
  }

  private parseDirection(): void {
    if (this._apiResponse.outward) {
      this.direction = JourneyDirection.Outward;
      this.directionLabel = 'out';
    }
    if (this._apiResponse.return) {
      this.direction = JourneyDirection.Return;
      this.directionLabel = 'return';
    }
  }

  private parseTimes(): void {
    if (this._apiResponse.outwardtimetablejourneys.length == 0) { return; }

    this.timetableJourneys = (this._apiResponse.return)
      ? this._apiResponse.returntimetablejourneys.map((x) => new TimetableJourney(x, this._apiResponse.locations, this.reservations))
      : this._apiResponse.outwardtimetablejourneys.map((x) => new TimetableJourney(x, this._apiResponse.locations, this.reservations));

    this.departureTime = moment(this.timetableJourneys[ 0 ].origindeparture);
    this.arrivalTime = moment(this.timetableJourneys[ this.timetableJourneys.length - 1 ].destinationarrival);
    this.duration = this.arrivalTime.diff(this.departureTime, 'minute');
  }

  private parseFares(): void {
    if (!this._apiResponse.fares || this._apiResponse.fares.length === 0) {
      // No journeys
      return;
    }

    for (var i = 0; i < this._apiResponse.fares.length; i++) {
      let fareTimetableAvailability = this._apiResponse.faretimetableavailability.filter((it) => it.fareid === this._apiResponse.fares[ i ].id);

      if (fareTimetableAvailability && fareTimetableAvailability.length > 0) {
        let journeyId = fareTimetableAvailability[ 0 ].timetablejourneyid;

        this.fares.push(new Fare(journeyId, this._apiResponse.fares[ i ]));
      }
    }
  }

  private parseDiscount(): void {
    if (!this._apiResponse.discounttypes || this._apiResponse.discounttypes.length === 0) {
      // No journeys
      return;
    }

    for (let i = 0; i < this._apiResponse.fares.length; i++) {
      // not sure why this is checking against fares / discount types
      if (this._apiResponse.discounttypes[ i ]) {
        this.discounts.push(new Discount(this._apiResponse.discounttypes[ i ]));
      }
    }
  }

  private setSeatReservationStatus() {
    this.seatReservationRequiredAtServiceLevel = this._apiResponse.status === 'MandResReq';

    if (this.seatReservationRequiredAtServiceLevel) {
      this.seatReservationStillNeeded = true;
      return;
    }

    let legsWithMandatoryReservation = _.flatten(this.timetableJourneys.map((ttJourney: TimetableJourney) => {
      return ttJourney.legs.filter((leg: ITimetableLeg) => leg.reservable === 'A');
    }));

    if (legsWithMandatoryReservation.length === 0) {
      this.seatReservationStillNeeded = false;
    } else if (this.reservations.length === 0) {
      this.seatReservationStillNeeded = true;
    } else {
      let allMandatoryLegsReserved = _.every(legsWithMandatoryReservation, (leg: ITimetableLeg) => {
        return _.some(this.reservations, (reservation: SeatReservation) => {
          return reservation.timetableJourneyId === this.id && reservation.timetableLegId === leg.id;
        });
      });

      this.seatReservationStillNeeded = !allMandatoryLegsReserved;
    }
  }
}

export enum JourneyDirection {
  Outward,
  Return
}

export interface IJourneyApiResponse {
  accommodationsupplements: IAccommodationSupplement[];
  addon: string;
  ctrjourneyreferences: any[];
  destination: string;
  discounttypes: Array<{
    code: string,
    description: string,
    expirydate: string,
    propertiesbydate: Array<{
      childrenallowedasadults: string,
      maxadults: number,
      maxchildren: number,
      maxpassengers: number,
      minadults: number,
      minchildren: number,
      minpassengers: number,
      wefdate: string,
      weudate: string
    }>
  }>;
  enquiry: string;
  farecombinations: any[];
  faretimetableavailability: Array<{
    availability: string,
    created: string,
    direction: string,
    fareid: number,
    restricted: string,
    sleeperavailability: string,
    spaces: number,
    timetablejourneyid: number
  }>;
  fares: IFareApiResponse[];
  flatfarerules: any[];
  groupdiscountschemes: any[];
  id: number;
  locations: ILocationApiResponse[];
  nonaccommodationsupplements: any[];
  origin: string;
  outward?: string;
  return?: string;
  outwardtimetablejourneys: ITimetableJourneyApiResponse[];
  parentjourneyid: number;
  passengers: Array<{
    aaas: number,
    adults: number,
    children: number,
    fareids: number[],
    id: number,
    railcards: Array<{
      code: string,
      description: string,
      expirydate: string,
      propertiesbydate: any[]
    }>
  }>;
  receiptissued: string;
  reservations: IReservationApiResponse[];
  returntimetablejourneys: ITimetableJourneyApiResponse[];
  routes: Array<{
    code: string,
    description: string,
    weudate: void,
    wefdate: void
  }>;
  sleeper: boolean;
  status: string;
  tickettypes: ITicketTypeApiResponse[];
  totalcost: number;
  carbonfootprintcalculation: ICarbonFootprintCalculationApiResponse;
}

export interface IAccommodationSupplement {
  aftersales: any[];
  availability: string;
  supplementclass: string;
  fareid: number;
  groupid: number;
  id: number;
  includedinpackage: string;
  passengers: number;
  places: number;
  relatedfare: number;
  reservationstatus: string;
  supplementsList: number;
  ticketnumber: any[];
  timetablejourneyid: number;
  timetablelegid: number;
  type: string;
  upgrade: string;
  code: string;
  cost: number;
  description: string;
  direction: string;
}

interface ITicketTypeApiResponse {
  capricode: string;
  class: string;
  classtype: string;
  code: string;
  description: string;
  directionless: string;
  group: string;
  journeytype: string;
  mandatoryreservation: string;
  maxadults: number;
  maxchildren: number;
  maxpassengers: number;
  minadults: number;
  minchildren: number;
  minpassengers: number;
  package: string;
  producttype: string;
  seasontype: string;
  transferable: string;
  type: string;
  unitfaremultiplier: number;
  wefdate: string;
  weudate: string;
}

interface ICarbonFootPrintCalculation {
  carco2usage: number;
  percentofemissionsaving: number;
  trainco2usage: number;
}
