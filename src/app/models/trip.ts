import { Journey, IJourneyApiResponse, JourneyDirection } from './journey';
import * as _ from 'lodash';
import * as moment from 'moment';
import { ILegolandAndWestgateBus } from './legoland-westgate';
import { CarbonFootprintCalculation } from './carbon-footprint-calculation';
import { dateManipulationUtils } from '../services/date-manipulation-utils.service';

export class Trip {
  public id: number;
  public outwardJourneys: Journey[] = [];
  public returnJourneys: Journey[] = [];
  public totalCost: number;
  public totalCostPence: number;
  public ticketTypes: any[] = [];
  public isPlusBusAllowed: boolean = false;
  public isOxfordWestgateBusAllowed: boolean = false;
  public isTravelcardAllowed: boolean = false;
  public isLegolandBusAllowed: boolean = false;
  public outwardDepartureTime: moment.Moment;
  public outwardArrivalTime: moment.Moment;
  public returnDepartureTime: moment.Moment;
  public returnArrivalTime: moment.Moment;
  public numAdult: number;
  public numChild: number;
  public outwardSleeper: boolean;
  public returnSleeper: boolean;
  public hasSleepers: boolean;
  public seatPreferences: string[];
  public travelcard: ITravelcard;
  public plusBuses: IPlusBus[];
  public legolandBus: ILegolandAndWestgateBus;
  public oxfordWestgate: ILegolandAndWestgateBus;
  public bike: IBike;
  public numRailcard: number = 0;
  public railcardCode: string;
  public routeCode: string;
  public inwardseatmapavailable: boolean;
  public outwardseatmapavailable: boolean;
  public carbonFootPrintCalculation: CarbonFootprintCalculation;
  public seatReservationStillNeededOnSomeJourneys: boolean;

  constructor(private _apiResponse: ITripApiResponse) {
    this.init();
  }

  private parseOtherTicketOptions(journey): void {
    this.ticketTypes = journey.tickettypes;
  }

  private init(): void {
    this.id = this._apiResponse.tripno;

    this.outwardSleeper = this._apiResponse.isoutwardoptionalsleeper || this._apiResponse.isoutwardsleeper;
    this.returnSleeper = this._apiResponse.isreturnoptionalsleeper || this._apiResponse.isreturnsleeper;
    this.hasSleepers = this.outwardSleeper || this.returnSleeper;

    this.parseOptionalExtras();
    this.parseJourneys();
    this.parsePrices();
    this.parseBike();
    this.parsePlusBus();
    this.parseTravelcard();
    this.parseRailcards();
    this.parseLegolandOrOxfordWestgateBus('legoland');
    this.parseLegolandOrOxfordWestgateBus('westgate');

    this.seatReservationStillNeededOnSomeJourneys = this.outwardJourneys[0].seatReservationStillNeeded ||
                    (this.returnJourneys.length > 0 && this.returnJourneys[0].seatReservationStillNeeded);

    this.outwardDepartureTime = _.first<Journey>(this.outwardJourneys).departureTime.clone();
    this.outwardArrivalTime = _.last<Journey>(this.outwardJourneys).arrivalTime.clone();
    if (this.returnJourneys.length > 0) {
      this.returnDepartureTime = _.first<Journey>(this.returnJourneys).departureTime.clone();
      this.returnArrivalTime = _.last<Journey>(this.returnJourneys).arrivalTime.clone();
    }

    this.numAdult = this._apiResponse.trip.journeys[ 0 ].passengers.reduce((previousValue, currentValue) => {
      return previousValue + currentValue.adults;
    }, 0);

    this.numChild = this._apiResponse.trip.journeys[ 0 ].passengers.reduce((previousValue, currentValue) => {
      return previousValue + currentValue.children;
    }, 0);

    this.routeCode = this._apiResponse.trip.journeys[ 0 ].routes[ 0 ].code;

    this.inwardseatmapavailable = this._apiResponse.inwardseatmapavailable;
    this.outwardseatmapavailable = this._apiResponse.outwardseatmapavailable;

    this.carbonFootPrintCalculation = new CarbonFootprintCalculation(this._apiResponse.trip.journeys[ 0 ].carbonfootprintcalculation);
  }

  private parsePrices(): void {
    this.totalCostPence = this._apiResponse.totalcostpence;
    this.totalCost = this.totalCostPence / 100;
  }

  private parseOptionalExtras(): void {
    _.each(this._apiResponse.basketoptionalitems, (option: ITripApiBasketOptionalItemResponse) => {
      if (option.name.toLowerCase().indexOf('travelcard') > -1) {
        this.isTravelcardAllowed = true;
      } else if (option.name.toLowerCase().indexOf('plusbus') > -1) {
        this.isPlusBusAllowed = true;
      } else if (option.name.toLowerCase().indexOf('legoland') > -1) {
        this.isLegolandBusAllowed = true;
      } else if (option.name.toLocaleLowerCase().indexOf('oxford westgate') > -1) {
        this.isOxfordWestgateBusAllowed = true;
      }
    });
  }

  private parseRailcards(): void {
    this.numRailcard = this._apiResponse.searchpassengergroups.reduce((previousValue, currentValue) => {
      return previousValue + currentValue.numberofrailcards;
    }, 0);

    this.railcardCode =
      (this._apiResponse.searchpassengergroups && this._apiResponse.searchpassengergroups.length > 0) ? this._apiResponse.searchpassengergroups[ 0 ].railcardcode : '';
  }

  private parseJourneys(): void {
    if (!this._apiResponse.trip.journeys || this._apiResponse.trip.journeys.length === 0) {
      // No journeys
      return;
    }

    // let journeyResponse = this._apiResponse.trip.journeys;
    let alljourneys = [];

    let journeyOutgoingOptions = {
      sleeper: this.outwardSleeper
    };

    let journeyReturnOptions = {
      outward: false,
      return: true,
      sleeper: this.returnSleeper
    };

    for (var i = 0; i < this._apiResponse.trip.journeys.length; i++) {
      // look at the first journey only in the list. The others can be PlusBus and Travelcard.
      alljourneys.push(new Journey(_.merge(journeyOutgoingOptions, this._apiResponse.trip.journeys[ i ])));

      if (this._apiResponse.trip.journeys[ i ].returntimetablejourneys.length) {
        alljourneys.push(new Journey(_.merge(journeyReturnOptions, this._apiResponse.trip.journeys[ i ])));
      }

      this.parseOtherTicketOptions(this._apiResponse.trip.journeys[ i ]);
      break;
    }

    this.outwardJourneys = _.filter(alljourneys, { direction: JourneyDirection.Outward });
    this.returnJourneys = _.filter(alljourneys, { direction: JourneyDirection.Return });
  }

  private parseBike(): void {
    this.bike = {
      numberOfAllowedBikeReservation: 0,
      numberOfBikes: 0,
      numberOfReservedLegs: 0
    };

    this._apiResponse.trip.journeys[0].accommodationsupplements
      .filter((x) => x.code === 'BIK' && x.reservationstatus === 'R')
      .forEach((x) => {
        this.bike.numberOfReservedLegs++;

        if (x.passengers > this.bike.numberOfBikes) {
          this.bike.numberOfBikes = x.passengers;
        }
    });

    this._apiResponse.trip.journeys[0].accommodationsupplements
      .filter((x) => x.code === 'BIK' && x.reservationstatus === '_')
      .forEach((x) => {
        this.bike.numberOfAllowedBikeReservation++;
    });
  }

  private parsePlusBus(): void {
    if (this._apiResponse.basketoptionalitems) {
      this.plusBuses = this._apiResponse.basketoptionalitems
        .filter((x) => x.name.toLowerCase().indexOf('plusbus') > -1 && x.state !== 'None')
        .map((x) => {
          let tmpName: string = x.name.replace('PlusBus for ', '');
          let station: string = tmpName.substring(0, tmpName.lastIndexOf(' on '));
          let date: string = dateManipulationUtils.getShortUkDateForBus(tmpName);
          let cost: number = Number(x.cost) * (Number(x.numberofadults) + Number(x.numberofchildren)) / 100;

          return {
            adults: Number(x.numberofadults),
            children: Number(x.numberofchildren),
            date,
            directiontype: (x.additionaloption && x.additionaloption.directiontype ? x.additionaloption.directiontype : ''),
            id: x.id,
            name: station,
            totalcost: Number(x.cost) / 100
          };
        });
    } else {
      this.plusBuses = [];
    }
  }

  private parseLegolandOrOxfordWestgateBus(name: string): void {
    if (this._apiResponse.basketoptionalitems) {
      let aBus = this._apiResponse.basketoptionalitems
        .filter((x) => x.name.toLowerCase().indexOf(name) > -1 && x.state !== 'None')
        .map((x) => {
          let cost = Number(x.cost) * (Number(x.numberofadults) + Number(x.numberofchildren)) / 100;

          return {
            adults: Number(x.numberofadults),
            children: Number(x.numberofchildren),
            directiontype: (x.additionaloption && x.additionaloption.directiontype ? x.additionaloption.directiontype : ''),
            id: x.id,
            totalcost: Number(x.cost) / 100
          };
        });
      name === 'westgate' ? this.oxfordWestgate = aBus[ 0 ] : this.legolandBus = aBus[ 0 ];
    }
  }

  private parseTravelcard(): void {
    for (let journey of this._apiResponse.trip.journeys) {
      for (let tickettype of journey.tickettypes) {
        if (tickettype.description.indexOf('Travelcard') >= 0) {
          this.travelcard = {
            adults: journey.passengers[ 0 ].adults,
            children: journey.passengers[ 0 ].children,
            ticketTypeDescription: tickettype.description,
            totalcost: journey.totalcost / 100,
            zoneDescription: journey.locations.filter((x) => x.nlc === journey.destination)[ 0 ].shortdescription
          };
          return;
        }
      }
    }
  }
}

export interface ITripApiResponse {
  tripno: number;
  cost: string;
  ticketcost: string;
  undiscountedcost: string;
  outwardcost: string;
  returncost: string;
  state: string;
  origin: string;
  outwarddatetime: string;
  destination: string;
  returndatetime: string;
  itsotripnumber: string;
  assistancereqeuest: {};
  basketoptionalitems: ITripApiBasketOptionalItemResponse[];
  trip: {
    additionalfulfilmentId: number,
    containssleeperservice: boolean,
    destination: string,
    enquirymethod: string,
    enquiryparameters: string,
    fulfilmentid: number,
    goldcardorderid: number,
    id: number,
    journeys: IJourneyApiResponse[],
    nontravelitems: any[],
    origin: string,
    outwarddatetime: string,
    parentorderid: number,
    returndatetime: string,
    sundries: any[],
    totalcost: number,
    totalsavingsmade: number,
  };
  passengerdetails: any[];
  sleeperprefernces: any[];
  searchpassengergroups: Array<{
    excessablefares: any[],
    numberofadults: number,
    numberofchildren: number,
    numberofrailcards: number,
    originalfareid: number,
    railcardcode: string,
  }>;
  sleeperaccommodationsupplements: any[];
  benefitcatalogticketuseds: any[];
  chargeableseatoutward: boolean;
  chargeableseatreturn: boolean;
  isttsogrouprailcard: boolean;
  isoutwardoptionalsleeper: boolean;
  isoutwardseatforsleepers: boolean;
  isoutwardsleeper: boolean;
  isreturnoptionalsleeper: boolean;
  isreturnseatforsleepers: boolean;
  isreturnsleeper: boolean;
  isvalidjourney: boolean;
  isvalidtrip: boolean;
  loyaltypointsusedbyinwardfare: number;
  loyaltypointsusedbyoutwardfare: number;
  totalcostpence: number;
  totalticketcostpence: number;
  totalundiscountedcostpence: number;
  totalundiscountedoutwardcostpence: number;
  totalundiscountedreturncostpence: number;
  tripindex: number;
  inwardseatmapavailable: boolean;
  outwardseatmapavailable: boolean;
}

export interface ITripApiBasketOptionalItemResponse {
  code: string;
  name: string;
  cost: string;
  id: number;
  numberofadults: string;
  numberofchildren: string;
  state: string;
  additionaloption: {
    directiontype: string
  };
}

export interface ITravelcard {
  zoneDescription: string;
  ticketTypeDescription: string;
  adults: number;
  children: number;
  totalcost: number;
}

export interface IPlusBus {
  id: number;
  name: string;
  adults: number;
  children: number;
  date: string;
  totalcost: number;
  directiontype: string;
}

export interface IBike {
  numberOfBikes: number;
  numberOfReservedLegs: number;
  numberOfAllowedBikeReservation: number;
}

export interface ITripFares {
  otherfaregroups: any[];
  faregroupid: string;
  isreturn: boolean;
  farename: string;
}
