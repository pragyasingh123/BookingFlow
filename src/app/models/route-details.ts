import * as moment from 'moment';
import * as _ from 'lodash';

export class RouteDetails {
  public journeyLegs: JourneyLeg[];
  public genericSleeperFacilities: RouteFacility[] = [
    new RouteFacility('toc:reservations', 'Reservation available'),
    new RouteFacility('toc:standard_class', 'Standard Class'),
    new RouteFacility('toc:cafe', 'Buffet Service'),
    new RouteFacility('toc:customerhost', 'Customer host'),
    new RouteFacility('toc:toilets', 'Unisex toilets'),
    new RouteFacility('toc:wakeupcall', 'Wake up call'),
    new RouteFacility('toc:breakfast', 'Breakfast'),
    new RouteFacility('toc:cafe', 'Café'),
  ];
  public hasDisruptedLeg: boolean = false;
  public hasBusLeg: boolean = false;
  private _apiResponse: IRouteDetailsApiResponse;
  private legFacilities: any;
  private hasNonStandardMode: boolean = false;
  private transportModes: ITransportMode[] = [
    {id: 'F', icon: 'toc:ferry', name: 'Ferry', isStandard: false, isConnection: true},
    {id: 'M', icon: 'toc:tube', name: 'Metro', isStandard: false, isConnection: true},
    {id: 'X', icon: 'toc:car', name: 'Transfer', isStandard: false, isConnection: true},
    {id: 'U', icon: 'toc:tube', name: 'Tube', isStandard: true, isConnection: false},
    {id: 'W', icon: 'toc:walk', name: 'Walk', isStandard: true, isConnection: true},
    {id: '_', icon: 'toc:rail', name: 'Train', isStandard: true, isConnection: false},
    {id: 'B', icon: 'toc:bus', name: 'Bus', isStandard: false, isConnection: false},
    {id: 'O', icon: 'toc:help', name: 'Other', isStandard: false, isConnection: true},
    {id: 'T', icon: 'toc:train', name: 'Tram', isStandard: false, isConnection: true}
  ];

  constructor(apiResponse?: IRouteDetailsApiResponse, legFacilities?: any) {
    this._apiResponse = apiResponse;
    this.legFacilities = legFacilities;
    this.init();
  }

  public parseCallpoints(apiData): RouteCallingPoint[] {
    return apiData.map((cp) => new RouteCallingPoint(cp.station, cp.datetimearrival, cp.datetimedepart, cp.expecteddatetime, cp.notstopping));
  }

  private parseFacilities(apiData, legFacilities): RouteFacility[] {
    var facilities: RouteFacility[] = [];

    if (legFacilities.reservation) {
      facilities.push(new RouteFacility('toc:reservations', legFacilities.reservation));
    }

    switch (apiData.sclass) {
      case 'F':
        facilities.push(new RouteFacility('toc:first_class', 'First Class'));
        break;
      case 'S':
        facilities.push(new RouteFacility('toc:standard_class', 'Standard Class'));
        break;
      case 'B':
        facilities.push(new RouteFacility('toc:first_class', 'First Class'));
        facilities.push(new RouteFacility('toc:standard_class', 'Standard Class'));
        break;
    }

    if (apiData.trolley) {
      facilities.push(new RouteFacility('toc:trolley_service', 'Trolley service'));
    }

    if (apiData.buffetcar) {
      facilities.push(new RouteFacility('toc:cafe', 'Buffet Service'));
    }

    if (legFacilities.facilities) {
      if (legFacilities.facilities.length > 0) {
        for (let element of legFacilities.facilities) {
          facilities.push(new RouteFacility('toc:buffet', element));
        }
      }
    }

    if (apiData.showwifi) {
      facilities.push(new RouteFacility('toc:wifi', 'WiFi available'));
    }

    return facilities;
  }

  private init(): void {
    this.journeyLegs = this._apiResponse.map((leg) => {
      // filter for the first (single) TransportMode that matches - this could use Array.prototype.find() if the compilation target was ES6
      let legMode: ITransportMode = this.transportModes.filter((mode) => {
        return leg.modetype === mode.id;
      })[0];

      // keep track of global route properties
      if (!this.hasNonStandardMode && !legMode.isStandard) {
        this.hasNonStandardMode = true;
      }
      if (!this.hasDisruptedLeg && leg.isservicedisrupted) {
        this.hasDisruptedLeg = true;
      }
      if (!this.hasBusLeg && legMode.id === 'B') {
        this.hasBusLeg = true;
      }

      let legF = [];
      if (this.legFacilities) {
        let legF = this.parseFacilities(leg.facilities, _.find(this.legFacilities, function(element: any) {
          return element.uid === leg.uid;
        }));
      }

      let callingPointsSet: RouteCallingPoint[];
      let toDesc: string;
      let trainDestination: string;

      if (leg.modetype === 'U') {
        callingPointsSet = this.parseCallpointsForTube(leg);
        toDesc = 'Metro';
      } else {
        callingPointsSet = this.parseCallpoints(leg.callpoints);
        toDesc = leg.tocdesc;
        trainDestination = leg.traindestination;
      }
      return new JourneyLeg(callingPointsSet, legF, legMode, toDesc, leg.traindestination, leg.datetimefrom, leg.datetimeto, leg.isservicedisrupted, leg.disruptioninfo);
    });
  }

  private parseCallpointsForTube(tubeData: IJourneyLegApiResponse): RouteCallingPoint[] {
    const callPoints = [
      {
        datetimearrival: tubeData.datetimefrom,
        datetimedepart: tubeData.datetimefrom,
        notstopping: false,
        station: tubeData.snlc.toString()
      },
      {
        datetimearrival: tubeData.datetimeto,
        datetimedepart: tubeData.datetimeto,
        notstopping: false,
        station: tubeData.enlc.toString()
      }
    ];
    return this.parseCallpoints(callPoints);
  }
}

export class JourneyLeg {
  public callingPoints: RouteCallingPoint[];
  public facilities: RouteFacility[];
  public mode: ITransportMode;
  public toc: string;
  public finalDestination: string;
  public isDisrupted: boolean = false;
  public datetimefrom: string;
  public datetimeto: string;
  public disruptionInfo: IDisruptionInfo | null;

  constructor(cpts, facilities, mode, toc, dest, datetimefrom, datetimeto, disrupted, disruptionInfo) {
    this.callingPoints = cpts;
    this.facilities = facilities;
    this.mode = mode;
    this.toc = toc;
    this.finalDestination = dest;
    this.isDisrupted = disrupted;
    this.datetimefrom = datetimefrom;
    this.datetimeto = datetimeto;
    this.disruptionInfo = disruptionInfo;
  }
}

export class RouteCallingPoint {
  public label: string;
  public arriveTime: string;
  public departTime: string;
  public isPassed: boolean = false;
  public isCurrent: boolean = false;
  public expectedDateTime?: string;
  public isCPointDelayed?: boolean = false;
  public isCPointCancelled?: boolean = false;

  constructor(
    label: string,
    arriveTime: string,
    departTime: string,
    expectedTime?: string,
    isCancelled?: boolean,
    isPassed?: boolean,
    isCurrent?: boolean
  ) {
    this.label = label;
    this.arriveTime = moment(arriveTime).format('HH:mm');
    this.departTime = moment(departTime).format('HH:mm');
    this.isPassed = isPassed;
    this.isCurrent = isCurrent;
    this.expectedDateTime = moment(expectedTime).format('HH:mm');
    this.isCPointCancelled = isCancelled;
    this.isCPointDelayed = !!expectedTime;
  }
}

export class RouteFacility {
  public icon: string;
  public label: string;

  constructor(icon: string, label: string) {
    this.icon = icon;
    this.label = label;
  }
}

export interface ITransportMode {
  id: string;
  icon: string;
  name: string;
  isStandard?: boolean;
  isConnection?: boolean;
}

export interface IRouteDetailsApiResponse extends Array<IJourneyLegApiResponse> {}
export interface IJourneyLegApiResponse {
  'org': string;
  'uid': string;
  'rid': string;
  'mode': string;
  'traindestination': string;
  'facilities': Array<{
    'showwifi': boolean,
    'trolley': boolean,
    'sclass': string,
    'reservation': string,
    'buffetcar': boolean
  }>;
  'callpoints': Array<{
    'leg': number,
    'station': string,
    'datetimearrival': string,
    'datetimedepart': string,
    'servicelocationkey': number,
    'stoptype': string,
    'requeststop': boolean,
    'expecteddatetime': string,
    'notstopping': boolean
  }>;
  'locfrom': string;
  'datetimefrom': string;
  'locto': string;
  'datetimeto': string;
  'onlc': number;
  'modetype': string;
  'dnlc': number;
  'tocdesc': string;
  'haslongconnection': boolean;
  'isservicedisrupted': boolean;
  'snlc': number;
  'enlc': number;
  'bclass': string;
  'disruptioninfo': null | IDisruptionInfo;
  'eexpecteddatetime': string;
  'dexpecteddatetime': string;
  'dnotstopping': boolean;
  'enotstopping': boolean;
  'legcancelled': boolean;
  'nrenotices'?: Array<{
    'noticetype': string,
    'noticereference': string,
    'noticeheader': string,
    'noticetext': string,
    'noticeurl': string
  }>;
}

export interface IRouteDetailsCallPoint {
  label: string;
  arriveTime: string;
  departTime: string;
  isPassed?: boolean;
  isCurrent?: boolean;
  expectedDateTime?: string;
  isCPointDelayed?: boolean;
  isCPointCancelled?: boolean;
}

export interface IDisruptionInfo {
  name: null | string;
  disruptionReason: string;
  delayDescription: string;
  delayAdditionalInformation: string;
  delayPublished: string;
}
