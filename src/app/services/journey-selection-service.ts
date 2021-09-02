import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { JourneySelection } from '../models/journey-selection';
import { JourneySearchCriteria } from '../models/journey-search-criteria';
import { ConfigService } from './config.service';
import * as moment from 'moment';

@Injectable()
export class JourneySelectionService {
  public _fares: any[] = [];
  public hasLocalStorage: boolean = false;

  constructor(private configService: ConfigService) {
    this.hasLocalStorage = this.configService.localStorageAvailable();
  }

  public addTrip(trip: any): any {
    if (!this.hasLocalStorage) { return null; }
    this._fares = window.localStorage.getItem('fares') ? JSON.parse(window.localStorage.getItem('fares')) : [];
    // remove current trip
    _.remove(this._fares, { tripNo: trip.tripNo });
    // update trip
    this._fares.push(new JourneySelection(trip));
    window.localStorage.setItem('fares', JSON.stringify(this._fares));
  }

  public getTrip(tripno: any): any {
    if (!this.hasLocalStorage) { return null; }
    this._fares = JSON.parse(window.localStorage.getItem('fares'));
    return _.find(this._fares, { tripNo: tripno });
  }

  public clearTrips(): any {
    if (!this.hasLocalStorage) { return null; }
    window.localStorage.setItem('fares', JSON.stringify([]));
  }

  public removeTrip(tripno: any): any {
    if (!this.hasLocalStorage) { return null; }
    this._fares = this.tripList();

    _.remove(this._fares, { tripNo: tripno });

    this._fares = this._fares.reduce((previousValue, currentValue, currentIndex, array) => {
      if (currentValue !== currentIndex) {
        array[ currentIndex++ ][ 'tripNo' ] = currentIndex;
      }
      return array;
    }, []);

    window.localStorage.setItem('fares', JSON.stringify(this._fares));
  }

  public isHandoff(): boolean {
    return window.location.hash.split('#').length - 1 > 1;
  }

  public getUrlParams(): string[] {
    return window.location.hash.replace('#', '').replace(/^\//, '').replace(/\/$/, '').split('/').splice(1);
  }

  public parseUrlParams(): JourneySearchCriteria {
    let params = this.getUrlParams();
    let criteria = new JourneySearchCriteria({
      adults: Number(params[ 6 ]),
      children: Number(params[ 7 ]),
      datetimedepart: moment(params[ 2 ] + 'T' + params[ 3 ].substring(1)),
      destination: String(params[ 1 ]),
      origin: String(params[ 0 ]),
      outwardDepartAfter: (params[ 3 ].charAt(0) === 'D') ? true : false,
      railcards: []
    });

    // is return
    if (params[ 4 ] !== 'N' && !(params[ 4 ] === 'O')) {
      criteria.isreturn = true;
      criteria.returnDepartAfter = (params[ 5 ].charAt(0) === 'D' ? true : false);
      criteria.datetimeReturn = moment(params[ 4 ] + 'T' + params[ 5 ].substring(1));
    }

    // is OPEN return
    if (params[ 4 ] === 'O') {
      criteria.isopenreturn = true;
      criteria.isreturn = true;
    }

    // via or aviod
    if (params[ 11 ] !== 'N') {
      if (params[ 11 ].charAt(0) == 'V') {
        criteria.via = Number(params[ 11 ].substring(1));
      } else {
        criteria.avoid = Number(params[ 11 ].substring(1));
      }
    }

    if (params[ 12 ] !== 'N') {
      criteria.promotion = params[ 12 ];
    }

    if (params[ 13 ] !== 'N') {
      let regex = new RegExp(/([A-Z])\w+:(\d:){2}\d/);
      criteria.railcards = [];
      params.forEach(function(value, key) {
        if (regex.test(value)) {
          let railcards = value.split(':');
          criteria.railcards.push({
            adults: Number(railcards[ 2 ]),
            children: Number(railcards[ 3 ]),
            code: String(railcards[ 0 ]),
            number: Number(railcards[ 1 ])
          });
        }
      });
    }

    // is a link
    if (params[ params.length - 1 ] == 'L') {
      criteria.isALink = true;
    } else {
      criteria.isALink = false;
    }

    return criteria;
  }

  public parseGtmSearchParams(params): JourneySearchCriteria {
    const outwardDepartAfterData: boolean = typeof (params[ 'depart' ]) !== 'string' && params[ 'depart' ] !== undefined ?
      (params[ 'depart' ][ 'value' ] === 'depart-after') ? true : false :
      (params[ 'depart' ] === 'depart-after') ? true : false;
    const adultsData: number = typeof (params[ 'adults' ]) !== 'string' && params[ 'adults' ] !== undefined ?
      Number(params[ 'adults' ][ 'value' ]) : Number(params[ 'adults' ]);
    const childrenData: number = typeof (params[ 'children' ]) !== 'string' && params[ 'children' ] !== undefined ?
      Number(params[ 'children' ][ 'value' ]) : Number(params[ 'children' ]);

    let criteria = new JourneySearchCriteria({
      adults: adultsData,
      avoid: params[ 'avoid' ],
      children: childrenData,
      datetimedepart: params[ 'time' ],
      destination: String(params[ 'destination' ]),
      isopenreturn: false,
      isreturn: params[ 'isreturn' ],
      origin: String(params[ 'origin' ]),
      outwardDepartAfter: outwardDepartAfterData,
      railcards: [],
      via: params[ 'via' ]
    });

    criteria.datetimeReturn = null;
    if (params[ 'isreturn' ]) {
      criteria.isopenreturn = params[ 'isopenreturn' ];
      if (params[ 'isopenreturn' ]) {
        criteria.isreturn = false;
      } else {
        criteria.datetimeReturn = params[ 'returntime' ];
      }
    } else {
      criteria.isopenreturn = false;
    }

    if (params[ 'promotion' ]) {
      criteria.promotion = String(params[ 'promotion' ]);
    }

    if (params[ 'sj-outbound-depart' ]) {
      if (params[ 'railcards' ]) {
        let cards = params[ 'railcards' ];
        let arr = cards.split('|');

        arr.forEach((rail) => {
          criteria.railcards.push({
            adults: Number(params[ 'adults' ]),
            children: Number(params[ 'children' ]),
            code: rail.split(',')[ 0 ],
            number: Number(rail.split(',')[ 1 ])
          });
        });
      }
    } else {
      if (params[ 'railcards' ]) {
        criteria.railcards = JSON.parse(params[ 'railcards' ]);
      }
    }

    return criteria;
  }

  public parseSearchParams(params: any): JourneySearchCriteria {
    let criteria = new JourneySearchCriteria({
      adults: Number(params[ 'adults' ]),
      children: Number(params[ 'children' ]),
      datetimedepart: moment(params[ 'time' ]),
      destination: String(params[ 'destination' ]),
      origin: String(params[ 'origin' ]),
      outwardDepartAfter: (params[ 'depart' ] === 'depart-after') ? true : false,
      railcards: []
    });

    this.storageQueryOptions(params);

    if (params[ 'promotion' ]) {
      criteria.promotion = String(params[ 'promotion' ]);
    }

    if (params[ 'via' ]) {
      criteria.via = Number(params[ 'via' ]);
    } else if (params[ 'avoid' ]) {
      criteria.avoid = Number(params[ 'avoid' ]);
    }

    if (params[ 'isreturn' ]) {
      criteria.isreturn = true;

      if (params[ 'isopenreturn' ]) {
        criteria.isopenreturn = true;
      } else {
        criteria.returnDepartAfter = (params[ 'return' ] === 'depart-after') ? true : false;
        criteria.datetimeReturn = moment(params[ 'returntime' ]);
      }
    }

    if (params[ 'isopenreturn' ]) {
      criteria.isopenreturn = params[ 'isopenreturn' ];
    }

    if (params[ 'return' ]) {
      criteria.returnDepartAfter = (params[ 'return' ] === 'depart-after') ? true : false;
      criteria.datetimeReturn = moment(params[ 'returntime' ]);
    }

    if (params[ 'sj-outbound-depart' ]) {
      if (params[ 'railcards' ]) {
        let cards = params[ 'railcards' ];
        let arr = cards.split('|');

        arr.forEach((rail) => {
          criteria.railcards.push({
            adults: Number(params[ 'adults' ]),
            children: Number(params[ 'children' ]),
            code: rail.split(',')[ 0 ],
            number: Number(rail.split(',')[ 1 ])
          });
        });
      }
    } else {
      if (params[ 'railcards' ]) {
        criteria.railcards = JSON.parse(params[ 'railcards' ]);
      }
    }

    return criteria;
  }

  public amendSearchParams(searchCriteria: JourneySearchCriteria) {
    let queryOptions = {
      adults: searchCriteria.adults,
      children: searchCriteria.children,
      depart: searchCriteria.outwardDepartAfter ? 'depart-after' : 'arrive-before',
      destination: searchCriteria.destination,
      origin: searchCriteria.origin,
      railcards: JSON.stringify(searchCriteria.railcards),
      time: searchCriteria.datetimedepart.format('YYYY-MM-DDTHH:mm:ss')
    };

    if (searchCriteria.via) {
      queryOptions[ 'via' ] = searchCriteria.via;
    } else if (searchCriteria.avoid) {
      queryOptions[ 'avoid' ] = searchCriteria.avoid;
    }

    if (searchCriteria.isreturn && searchCriteria.datetimeReturn.isValid() || searchCriteria.isopenreturn) {
      queryOptions[ 'isreturn' ] = true;
      if (searchCriteria.isopenreturn) {
        queryOptions[ 'isopenreturn' ] = true;
      } else {
        queryOptions[ 'return' ] = searchCriteria.returnDepartAfter ? 'depart-after' : 'arrive-before';
        queryOptions[ 'returntime' ] = searchCriteria.datetimeReturn.format();
      }
    }

    if (searchCriteria.promotion) {
      queryOptions[ 'promotion' ] = searchCriteria.promotion;
    }

    return queryOptions;
  }

  private tripList(): any {
    return JSON.parse(window.localStorage.getItem('fares'));
  }

  private storageQueryOptions(params: any): void {
    let queryOptions = {
      adults: params[ 'adults' ],
      children: params[ 'children' ],
      depart: params[ 'depart' ],
      destination: params[ 'destination' ],
      origin: params[ 'origin' ],
      time: params[ 'time' ]
    };

    window.localStorage.setItem('queryOptions', JSON.stringify(queryOptions));
  }
}
