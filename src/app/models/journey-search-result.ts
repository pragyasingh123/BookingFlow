import * as moment from 'moment';
import * as _ from 'lodash';
import {JourneySearchResultService, IJourneySearchServiceApiResponse} from './journey-search-result-service';
import {JourneySearchCriteria} from './journey-search-criteria';
import {ILocationSearchApiResponse} from './location';

export class JourneySearchResult {

  public searchCriteria: JourneySearchCriteria;
  public searchId: string;
  public outwardServices: JourneySearchResultService[] = [];
  public returnServices: JourneySearchResultService[] = [];
  public earlierOutwardLink: string;
  public laterOutwardLink: string;
  public earlierReturnLink: string;
  public laterReturnLink: string;
  public hasGroupedStation: boolean = false;
  public changeofjourney: boolean = false;
  public outwardfares: any[] = [];
  public returnfares: any[] = [];
  public hasChildSleeper = false;
  public isSleeper = false;
  public cheapestReturn = false;
  public isservicedisrupted: boolean;
  public isSlowTrain: boolean;
  public allServices: JourneySearchResultService[] = [];
  public showAdvanceFareNotice: boolean;
  private _apiResponse: IJourneySearchApiResponse;

  constructor(apiResponse?: IJourneySearchApiResponse) {
    if (!apiResponse) {
      return;
    }
    this._apiResponse = apiResponse;
    this.init();
  }

  public init(): void {
    this.searchId = this._apiResponse.searchid;
    this.outwardfares = this._apiResponse.outwardfares;
    this.returnfares = this._apiResponse.returnfares;
    this.hasChildSleeper = this._apiResponse.searchquery.children > 0;

    // Parse information data
    this.earlierOutwardLink = this._apiResponse.information.earlier_outward_link;
    this.laterOutwardLink = this._apiResponse.information.later_outward_link;
    this.earlierReturnLink = this._apiResponse.information.earlier_return_link;
    this.laterReturnLink = this._apiResponse.information.later_return_link;

    if (this._apiResponse.outwardservices.length) {
      this.isservicedisrupted = this._apiResponse.outwardservices[0].isservicedisrupted;
    }

    this.changeofjourney = this._apiResponse.changeofjourney;

    // Parse hasGroupedStation property
    this.hasGroupedStation = _.find(this._apiResponse.locations, { nlc: this._apiResponse.searchquery.originnlc }).isgroup
      || _.find(this._apiResponse.locations, { nlc: this._apiResponse.searchquery.destinationnlc }).isgroup;

    // Parse outward services
    _.each(this._apiResponse.outwardservices, (service) => {
      let srv = new JourneySearchResultService(service);
      srv.originName = _.find(this._apiResponse.locations, { nlc: srv.originNlc }).name;
      srv.destinationName = _.find(this._apiResponse.locations, { nlc: srv.destinationNlc }).name;

      if (srv.hasCheapestReturnFareCost) {
        this.cheapestReturn = true;
      }

      // TODO: I have rolled back that logic for GBF-449 (Aytekin)
      if (service.otherfaregroups.length > 0 && service.otherfaregroups[0]['railcards'] && service.otherfaregroups[0]['railcards'].length > 0) {
        srv.hasRailcard = true;
        if (service.otherfaregroups[0]['railcards'][0].replace(/\s/g, '').toUpperCase() == 'GROUPSAVEDISCOUNT' ||
            service.otherfaregroups[0]['railcards'][0].replace(/\s/g, '').toUpperCase() == 'GROUPSAVE') {
          srv.hasRailcard = false;
        }
        srv.railcardDescription = service.otherfaregroups[0]['railcards'][0];
      }

      if (service.otherfaregroups.length > 0 && service.otherfaregroups[0]['availablespaces'] && service.otherfaregroups[0]['availablespaces']) {
        srv.limitedInventoryAmount = Number(service.otherfaregroups[0]['availablespaces']);
      }

      _.each(srv.flags, (flag) => {
        if (flag == 'Sleeper' && this.hasChildSleeper) {
          srv.hasChildSleeper = true;
        } else if (flag == 'Sleeper') {
          srv.isSleeper = true;
        }
      });

      this.outwardServices.push(srv);
    });

    // Parse return
    _.each(this._apiResponse.returnservices, (service, i) => {
      let srv = new JourneySearchResultService(service);
      srv.originName = _.find(this._apiResponse.locations, { nlc: srv.originNlc }).name;
      srv.destinationName = _.find(this._apiResponse.locations, { nlc: srv.destinationNlc }).name;

      this.returnServices.push(srv);
    });

    var checkSlowTrain = (item, arr) => {
      return arr.some(function(arr) {
          return  arr.departureDateTime > item.departureDateTime
                  && arr.arrivalDateTime < item.arrivalDateTime;
      });
   };
    // set outbound slow train property
    _.each(this.outwardServices, (item, index, list) => {
        item.isSlowTrain = checkSlowTrain(item, list);
    });
    // set return slow train property
    _.each(this.returnServices, (item, index, list) => {
        item.isSlowTrain = checkSlowTrain(item, list);
    });

    // Store a search criteria for reference in views if needed
    this.searchCriteria = new JourneySearchCriteria({
      adults: this._apiResponse.searchquery.adults,
      children: this._apiResponse.searchquery.children,
      datetimeReturn: moment(this._apiResponse.searchquery.returndatetime),
      datetimedepart: moment(this._apiResponse.searchquery.outwarddatetime),
      destination: String(this._apiResponse.searchquery.destinationnlc),
      directServicesOnly: this._apiResponse.searchquery.directservicesonly,
      firstClass: this._apiResponse.searchquery.firstclass,
      isopenreturn: this._apiResponse.searchquery.isopenreturn,
      isreturn: this._apiResponse.searchquery.isreturn,
      origin: String(this._apiResponse.searchquery.originnlc),
      outwardDepartAfter: this._apiResponse.searchquery.outwarddepartafter,
      railcards: this._apiResponse.searchquery.railcards,
      standardClass: this._apiResponse.searchquery.standardclass,
    });

    if (this._apiResponse.searchquery.via) {
      this.searchCriteria.via = Number(this._apiResponse.searchquery.via);
    } else if (this._apiResponse.searchquery.avoid) {
      this.searchCriteria.avoid = Number(this._apiResponse.searchquery.avoid);
    }
    this.searchCriteria.destinationName = _.find(this._apiResponse.locations, { nlc: String(this.searchCriteria.destination) }).name;
    this.searchCriteria.originName = _.find(this._apiResponse.locations, { nlc: String(this.searchCriteria.origin) }).name;

    this.allServices = this.outwardServices.concat(this.returnServices);

    let hasAdvanced =  _.some(_.flatten(_.map(this.allServices, (s) => s.otherfaregroups)), (f) => {
      return f.faregroupname.toLowerCase().indexOf('advance') == -1;
    });

    this.showAdvanceFareNotice = hasAdvanced && (this.searchCriteria.datetimedepart.diff(moment(), 'months') > 3);
  }
}

export interface IJourneySearchApiResponse {
  'searchquery': {
    'originnlc': string,
    'destinationnlc': string,
    'outwarddatetime': string,
    'outwarddepartafter': boolean,
    'isreturn': boolean,
    'isopenreturn': boolean,
    'returndatetime': string,
    'returndepartafter': boolean,
    'directservicesonly': boolean,
    'firstclass': boolean,
    'standardclass': boolean,
    'adults': number,
    'children': number,
    'avoid': string,
    'via': string,
    'railcards': any[]
  };
  'searchid': string;
  'outwardservices': IJourneySearchServiceApiResponse[];
  'returnservices': IJourneySearchServiceApiResponse[];
  'outwardfares': any[];
  'returnfares': any[];
  'information': {
    'earlier_outward_link': string,
    'later_outward_link': string,
    'earlier_return_link': string,
    'later_return_link': string
  };
  changeofjourney: boolean;
  locations: ILocationSearchApiResponse[];
}
