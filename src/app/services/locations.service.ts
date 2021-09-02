import {Injectable, Inject} from '@angular/core';
import {ReplaySubject, BehaviorSubject, Observable, ConnectableObservable, AsyncSubject} from 'rxjs/Rx';
import {RetailhubApiService} from './retailhub-api.service';
import {Location, ILocationApiResponse} from '../models/location';
import { CONFIG_TOKEN } from '../constants';
import * as _ from 'lodash';
import {IItsoLocations} from '../models/delivery-option';
import {ItsoHelper} from '../delivery-details/itso-helper';
import { BasketService } from './basket.service';

function setGroup(x: any, y: any): number {
  if (x > -1) {
    return 3;
  } else {
    if (y == 0) {
      return 2;
    } else {
      return 1;
    }
  }
}

@Injectable()
export class LocationService {
  public stations$: Observable<Location[]>;
  public isStationsLoading$: BehaviorSubject<boolean>;
  public recommendedNlcs: string[] = [];
  public itsoStations$: Observable<any[]>;
  private _stationRequest: ConnectableObservable<any>;

  constructor(private retailHubApi: RetailhubApiService, @Inject(CONFIG_TOKEN) private config: any, private basketService: BasketService) {
    this.recommendedNlcs = this.config.recommendedNlcs;
    this.isStationsLoading$ = new BehaviorSubject<boolean>(false);

    // Request location data but call publish() so we can control when it gets triggered (in loadStation method)
    this.stations$ = Observable.from([1])
      .do(() => {
        this.isStationsLoading$.next(true);
      })
      .flatMap(() => this.retailHubApi.get('/rail/locations'))
      .map((res) => res.data)
      .map((data: ILocationApiResponse[]) => {
        return _.map(data, (item) => new Location(item));
      })
      .do(() => {
        this.isStationsLoading$.next(false);
      })
      .publishReplay(1)
      .refCount();

    this.itsoStations$ = Observable.from([1])
      .do(() => {
        this.isStationsLoading$.next(true);
      })
      .map(() => {
        return _.map(this.basketService.getItsoLocations(), (item) => ItsoHelper.translateItsoLocationToLocationObject(item));
      })
      .do(() => {
        this.isStationsLoading$.next(false);
      })
      .publishReplay(1)
      .refCount();
  }

  public search(query: string, isfilterByTOD: boolean = false): Observable<Location[]> {
    var searchingQuery = query.toLowerCase();
    var crsCodeQuery = query.toLowerCase();
    return this.stations$.map((data: Location[]) => {
      var suggestions = _.filter(data, (item: Location) => {
        if (isfilterByTOD && !item.tod) { return; }

        var lcvalue = item.label.toLowerCase();
        var containsStationName = lcvalue.indexOf(searchingQuery) !== -1;

        if (containsStationName) {
          item['group'] = setGroup(item.code.toLowerCase().indexOf(crsCodeQuery), lcvalue.indexOf(searchingQuery));
        }

        return containsStationName;
      });

      if (searchingQuery) {
        var resultsWithLondon = [];
        var resultsStartingWith = [];
        var resultsWithCRS = [];
        var resultsWithNLC = [];
        var otherResults = [];

        _.each(suggestions, (item: Location) => {
          if (item.id === '1072' || item.id === '3087') { // put london terminals and paddington at the beginning
            resultsWithLondon.push(item);
          } else if (searchingQuery === item.id.toLowerCase()) {
            resultsWithNLC.push(item);
          } else if (searchingQuery.length <= 3 && item.label.toLowerCase().indexOf('(' + searchingQuery + ')') !== -1) {
            resultsWithCRS.push(item);
          } else if (this.startsWith(item.label.toLowerCase(), searchingQuery)) {
            resultsStartingWith.push(item);
          } else {
            otherResults.push(item);
          }
        });

        return resultsWithLondon.reverse().concat(resultsWithNLC.concat(resultsWithCRS.concat(resultsStartingWith.concat(otherResults))));
      }

      return suggestions;
    });
  }

  public searchItso(query: string): Observable<Location[]> {
    const stations$ = Observable.from([1])
    .map(() => this.basketService.getItsoLocations())
    .map((data: IItsoLocations[]) => {
      return _.map(data, (item: IItsoLocations) => ItsoHelper.translateItsoLocationToLocationObject(item));
    })
    .publishReplay(1)
    .refCount();
    return stations$.map( (itsoLocation: Location[]) => {
      let item = _.filter( itsoLocation, (data) => {
        const itemName: string = data.label.toLowerCase();
        query = query.toLowerCase();
        const containsName: boolean = itemName.indexOf(query) !== -1;
        return containsName;
      });
      return item;
    });
  }

  public findOne(findObj: IFindLocationCriteria): Observable<Location> {
    return this.find(findObj).map((items) => _.head(items));
  }

  public fetchRecommended(): Observable<Location[]> {
    return this.stations$.map((items) => {
      return _.filter(items, (item: Location) => {
        return _.includes(this.recommendedNlcs, item.id);
      });
    });
  }

  public fetchRecommendedForItso(): Observable<Location[]> {
    const itsoArray: IItsoLocations[] = _.filter(this.basketService.getItsoLocations(), (item: IItsoLocations) => {
      return _.includes(this.recommendedNlcs, item.nlc);
    });
    const locationArray: string[] = this.translateItso(itsoArray);

    return this.itsoStations$.map((items) => {
      return _.filter(items, (item) => {
        return _.includes(locationArray, item.id);
      });
    });
  }

  public translateItso(itsoLocations: IItsoLocations[]): string[] {
    let itsoIds: string[] = [];
    itsoLocations.forEach( (item) => {
      itsoIds.push(item.nlc);
    });
    return itsoIds;
  }
  public autoSelectItsoStation(stationNo: string): Location {
    const itsoObject: IItsoLocations = this.basketService.getItsoLocations()
      .find( (val: IItsoLocations) => val.nlc === stationNo);
    if (itsoObject) {
      return ItsoHelper.translateItsoLocationToLocationObject(itsoObject);
    } else {
      return new Location({code: '',
        id: '',
        label: '',
        name: '',
        tod: false});
    }
  }

  private startsWith(value: string, str: string): boolean {
    return value.indexOf(str) === 0;
  }

  private find(findObj: IFindLocationCriteria): Observable<Location[]> {
    return this.stations$.map((data: Location[]) => {
      return _.filter(data, findObj);
    });
  }
}

export interface IFindLocationCriteria {
  id?: string;
  code?: string;
  name?: string;
}
