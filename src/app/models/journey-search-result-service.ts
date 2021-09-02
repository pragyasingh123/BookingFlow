import * as moment from 'moment';
import * as _ from 'lodash';
import { IJourneyLegApiResponse } from './route-details';

export class JourneySearchResultService {
  public id: number;
  public originNlc: string;
  public originName: string;
  public destinationNlc: string;
  public destinationName: string;
  public durationMinutes: number;
  public durationLabel: string;
  public arrivalDateTime: moment.Moment;
  public departureDateTime: moment.Moment;
  public journeydetailsuri: string;
  public hasCheapestSingleFareCost: boolean = false;
  public cheapestSingleFareGroup: string;
  public cheapestSingleFareCost: number;
  public cheapestSingleFareCostPence: number;
  public hasCheapestReturnFareCost: boolean = false;
  public cheapestReturnFareGroup: string;
  public cheapestReturnFareCost: number;
  public cheapestReturnFareCostPence: number;
  public cheapestFareLabel: string;
  public cheapestFareCost: number;
  public cheapestFareCostPence: number;
  public flags: string[] = [];
  public warnings: any[] = [];
  public hasIssues: boolean = false;
  public changes: number = 0;
  public otherfaregroups: any[] = [];
  public carbonfootprintcalculation: any;
  public isPromoService: boolean = false;
  public isHighlightPromotion: boolean = false;
  public hasRailcard: boolean;
  public railcardDescription: string;
  public hasChildSleeper: boolean = false;
  public isSleeper: boolean = false;
  public limitedInventoryAmount: number;
  public isservicedisrupted: boolean;
  public isSlowTrain: boolean;
  public isCancelled: boolean = false;
  public isPartCancelled: boolean = false;
  public hasLegBus: boolean = false;
  public isLegCancelled: boolean = false;
  public isDepLegCancelled: boolean = false;
  public isArrLegCancelled: boolean = false;
  public expectedDepartureTime: string;
  public expectedArrivalTime: string;
  public isSmartcardService: boolean = false;
  public nrePresent: boolean = false;
  public cheapeastSingleReturn: any;
  public serviceDisabled: boolean = false;
  public legFacilities: any[] = [];
  private _apiResponse: IJourneySearchServiceApiResponse;
  constructor(apiResponse?: IJourneySearchServiceApiResponse) {
    if (apiResponse) {
      this._apiResponse = apiResponse;
    }

    this.init();
  }

  public init(): void {
    this.id = this._apiResponse.serviceid;
    this.originNlc = this._apiResponse.originnlc;
    this.originName = this._apiResponse.originname;
    this.destinationNlc = this._apiResponse.destinationnlc;
    this.destinationName = this._apiResponse.destinationname;
    this.durationMinutes = this._apiResponse.duration;
    this.journeydetailsuri = this._apiResponse.journeydetailsuri;
    this.isservicedisrupted = this._apiResponse.isservicedisrupted;
    this.isSlowTrain = false;
    if (this._apiResponse.otherfaregroups.length > 0) {
      this.limitedInventoryAmount = this._apiResponse.otherfaregroups['0'].availablespaces;
    }

    this.parseJourneyDateTime();
    this.parseCancelledJourney(this._apiResponse.servicelegs);
    this.nrePresent = this.checkIfNrePresent(this._apiResponse.servicelegs);

    if (this._apiResponse.cheapestfareselection) {

      this.hasCheapestSingleFareCost = !!this._apiResponse.cheapestfareselection.cheapest.singlefarecost || this._apiResponse.cheapestfareselection.cheapest.singlefarecost == 0;
      this.cheapeastSingleReturn = this._apiResponse.cheapestfareselection.single;

      if (this.hasCheapestSingleFareCost) {
        this.cheapestSingleFareCostPence = Number(this._apiResponse.cheapestfareselection.cheapest.returnfarecost ||
          this._apiResponse.cheapestfareselection.cheapest.singlefarecost || 0);
        this.cheapestSingleFareCost = this.cheapestSingleFareCostPence / 100;
        this.cheapestSingleFareGroup = String(this._apiResponse.cheapestfareselection.cheapest.singlefaregroupid);

        this.cheapestFareCost = this.cheapestSingleFareCost;
        this.cheapestFareCostPence = this.cheapestSingleFareCostPence;
        this.cheapestFareLabel = 'Single from';

        this.isSmartcardService = this._apiResponse.cheapestfareselection.cheapest.issmartcardfare;
      }

      this.hasCheapestReturnFareCost = !!this._apiResponse.cheapestfareselection.cheapest.returnfarecost;

      if (this.hasCheapestReturnFareCost) {
        this.cheapestReturnFareCostPence = Number(this._apiResponse.cheapestfareselection.cheapest.returnfarecost || 0);
        this.cheapestReturnFareCost = this.cheapestReturnFareCostPence / 100;
        this.cheapestReturnFareGroup = String(this._apiResponse.cheapestfareselection.cheapest.returnfaregroup);
        this.isSmartcardService = this._apiResponse.cheapestfareselection.cheapest.issmartcardfare;

        if (!this.hasCheapestSingleFareCost || this.cheapestReturnFareCost < this.cheapestSingleFareCost) {
          this.cheapestFareCost = this.cheapestReturnFareCost;
          this.cheapestFareCostPence = this.cheapestReturnFareCostPence;
          this.cheapestFareLabel = 'Return from';
        }
      }
    } else {
      this.serviceDisabled = true;
    }

    // filter first two flags
    this.flags = _.take(this._apiResponse.flags, 2);

    this.warnings = this._apiResponse.warnings;
    this.hasIssues = this.warnings.length > 0;
    this.changes = this._apiResponse.changes;

    this.otherfaregroups = this._apiResponse.otherfaregroups;
    for (var i = 0, iLen = this.otherfaregroups.length; i < iLen; i++) {
      if (this.otherfaregroups[i].faregroupid == (this.cheapeastSingleReturn === null ? this.cheapestSingleFareGroup : this.cheapeastSingleReturn.singlefaregroupid)) {
        this.isHighlightPromotion = this.otherfaregroups[i].ishighlightpromotion;
      }
    }

    // Calculate the duration label
    var minutes = this.arrivalDateTime.diff(this.departureDateTime, 'minutes');
    var hours = Math.floor(minutes / 60);
    this.durationLabel = '';
    if (hours >= 1 ) {
      this.durationLabel += hours + 'h ';
      minutes = minutes - (hours * 60);
    }
    this.durationLabel += minutes + 'm';
    this.carbonfootprintcalculation = this._apiResponse.carbonfootprintcalculation;

    for (let serviceLeg of this._apiResponse.servicelegs) {
      this.legFacilities.push(this.parseLegFacilities(serviceLeg));
    }
  }

  private checkIfNrePresent(servicelegs: IJourneyLegApiResponse[]): boolean {
    let containNreInfo: boolean = false;
    servicelegs.forEach((singleLeg) => {
      if (singleLeg.nrenotices !== undefined && singleLeg.nrenotices.length > 0) {
        singleLeg.nrenotices.forEach((element) => {
          if (element.noticeheader !== undefined && element.noticeheader !== '') {
            containNreInfo = true;
          }
          if (element.noticetext !== undefined && element.noticetext !== '') {
            containNreInfo = true;
          }
          if (element.noticeurl !== undefined && element.noticeurl !== '') {
            containNreInfo = true;
          }
        });
      }
    });
    return containNreInfo;
  }

  private parseCancelledJourney(serviceLegs: IJourneyLegApiResponse[]): void {
    if (serviceLegs.length) {
      this.isDepLegCancelled = serviceLegs[0].dnotstopping;
      this.isArrLegCancelled = serviceLegs[serviceLegs.length - 1].enotstopping;
      this.isCancelled = this.isDepLegCancelled && this.isArrLegCancelled;
      this.isPartCancelled = [this.isDepLegCancelled, this.isArrLegCancelled].some((isCancelled) => isCancelled === true);
      this.hasLegBus = serviceLegs.some((leg) => leg.mode === 'Bus');
    }

    if (serviceLegs.length > 2 ) {
      this.isLegCancelled = serviceLegs.slice(1).slice(0, -1).some((leg: IJourneyLegApiResponse) => (leg.legcancelled));
    }
  }

  private parseJourneyDateTime(): void {
    const legs = this._apiResponse.servicelegs;
    const firstLeg = legs[0];
    const lastLeg = legs[legs.length - 1];

    if (this._apiResponse.departuredatetime) {
      this.departureDateTime = moment(this._apiResponse.departuredatetime);
    }

    if (this._apiResponse.arrivaldatetime) {
      this.arrivalDateTime = moment(this._apiResponse.arrivaldatetime);
    }

    if (firstLeg.dexpecteddatetime) {
      this.expectedDepartureTime = moment(firstLeg.dexpecteddatetime).format('HH:mm');
    }

    if (lastLeg.eexpecteddatetime) {
      this.expectedArrivalTime = moment(lastLeg.eexpecteddatetime).format('HH:mm');
    }
  }

  private parseLegFacilities(serviceLeg: any) {
    let legFacilities = {
      facilities: [],
      reservation: '',
      uid: serviceLeg.uid
    };

    let caterOptions = {
      F : 'Restaurant in First',
      H : 'Hot Buffet',
      M : 'Meal included for First Class Passengers',
      R : 'Restaurant and Buffet'
    };

    let reservationOptions = {
      A: 'Reservation compulsory',
      B: 'Reservation for bikes only',
      R: 'Reservation recommended',
      S: 'Reservation available',
      _: null
    };

    for (let element of serviceLeg.cater) {
      if (caterOptions[element]) {
        legFacilities.facilities.push(caterOptions[element]);
      }
    }

    if (reservationOptions[serviceLeg.rsv]) {
      legFacilities.reservation = reservationOptions[serviceLeg.rsv];
    }

    return legFacilities;
  }
}

export interface IJourneySearchServiceApiResponse {
  'serviceid': number;
  'originnlc': string;
  'originname': string;
  'destinationnlc': string;
  'destinationname': string;
  'arrivaldatetime': string;
  'departuredatetime': string;
  'changes': number;
  'duration': number;
  'warnings': any[];
  'cancelledservice': boolean;
  'hasChildSleeper': boolean;
  'isSleeper': boolean;
  'isservicedisrupted': boolean;
  'isSlowTrain': boolean;
  'flags': string[];
  'servicelegs': IJourneyLegApiResponse[];
  'journeydetailsuri': string;
  'cheapestfareselection': {
    'single': {
      'singlefaregroupid': string|string,
      'returnfaregroup': string|void,
      'singlefarecost': number|void,
      'returnfarecost': number|void
    },
    'return': {
      'singlefaregroupid': string|string,
      'returnfaregroup': string|void,
      'singlefarecost': number|void,
      'returnfarecost': number|void
    },
    'cheapest': {
      'issmartcardfare': boolean,
      'singlefaregroupid': string|void,
      'returnfaregroup': string|void,
      'singlefarecost': number|void,
      'returnfarecost': number|void
    }
  };
  'otherfaregroups': any[];
  'carbonfootprintcalculation': {
    'trainco2usage': number,
    'carco2usage': number,
    'percentofemissionsaving': number,
    'mileageinhundredthsofmile': number
  };
}

export interface IInreInfo {
  nreUrl: string | null;
  nreHeader: string | null;
  nreNotice: string | null;
 }
