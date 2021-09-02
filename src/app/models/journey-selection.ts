import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs/Rx';
import { JourneySearchResult } from './journey-search-result';
import { JourneySearchResultService } from './journey-search-result-service';

@Injectable()
export class JourneySelection {
  private tripNo: number;
  private selectedService: IService;
  private searchResults: JourneySearchResult;
  private otherTickets: IFareTypes;
  private reservations: any;
  private isOpenReturn: boolean = false;

  constructor(trip: IJourney) {
    this.tripNo = trip.tripNo;
    this.selectedService = trip.selectedService;
    this.searchResults = trip.searchResults;
    this.reservations = trip.reservations;

    this.otherTickets = {
      outboundFirstClass: null,
      outboundSingleFirstClass: null,
      outboundStandard: null,
      returnBoundSingleFirstClass: null,
      returnFirstClass: null,
      returnStandard: null,
      singleReturns: null
    };

    if (trip.isOpenReturn) { this.isOpenReturn = true; }

    this.parseOtherFares();
  }

  private parseOtherFares(): void {
    if (this.searchResults == undefined) { return; }

    let outBoundSingle;
    let returnBoundSingle;

    // return service
    if (this.searchResults.returnServices.length) {
      _.filter<JourneySearchResultService>(this.searchResults.outwardServices, (service) => this.selectedService.outwardserviceid === service.id)
        .map((service) => {
          this.otherTickets.returnStandard = _.filter(service.otherfaregroups, (fare) => {
            return fare.class !== '1' && fare.faregroupid !== this.selectedService.outwardfaregroup && fare.isreturn;
          });
          this.otherTickets.returnFirstClass = _.filter(service.otherfaregroups, (fare) => {
            return fare.class === '1' && fare.faregroupid !== this.selectedService.outwardfaregroup && fare.isreturn;
          });
          outBoundSingle = _.filter(service.otherfaregroups, (fare) => {
            return fare.class !== '1' && fare.faregroupid !== this.selectedService.outwardfaregroup && !fare.isreturn;
          });
          this.otherTickets.outboundSingleFirstClass = _.filter(service.otherfaregroups, (fare) => {
            return fare.class === '1' && fare.faregroupid !== this.selectedService.outwardfaregroup && !fare.isreturn;
          });
        });

      _.filter<JourneySearchResultService>(this.searchResults.returnServices, (service) => this.selectedService.returnServiceId === service.id)
        .map((service) => {
          returnBoundSingle = _.filter(service.otherfaregroups, (fare) => {
            return fare.class !== '1' && fare.faregroupid !== this.selectedService.outwardfaregroup && !fare.isreturn;
          });
          this.otherTickets.returnBoundSingleFirstClass = _.filter(service.otherfaregroups, (fare) => {
            return fare.class === '1' && fare.faregroupid !== this.selectedService.outwardfaregroup && !fare.isreturn;
          });
        });

      this.otherTickets.singleReturns = _.sortBy(_.flatten(_.map(outBoundSingle, (outgoingFare: IFareTypeSingles) => _.map(returnBoundSingle, (returnFare: IFareTypeSingles) => {
        return { outgoingFare, [ 'returnFare' ]: returnFare, [ 'totalCost' ]: outgoingFare.cost.totalfare + returnFare.cost.totalfare };
      }))), [ 'totalCost' ]);

    } else {
      // single service
      _.filter<JourneySearchResultService>(this.searchResults.outwardServices, (service) => this.selectedService.outwardserviceid === service.id)
        .map((service) => {
          this.otherTickets.outboundStandard = _.filter(service.otherfaregroups, (fare) => {
            return fare.class !== '1' && fare.faregroupid !== this.selectedService.outwardfaregroup;
          });
          this.otherTickets.outboundFirstClass = _.filter(service.otherfaregroups, (fare) => {
            return fare.class === '1' && fare.faregroupid !== this.selectedService.outwardfaregroup;
          });
        });
    }
  }
}

export interface IJourney {
  tripNo: number;
  selectedService: IService;
  searchResults: any;
  isOpenReturn: boolean;
  reservations: any;
}

export interface IService {
  outwardserviceid: number;
  outwardfaregroup: string;
  returnServiceId: number;
  returnfaregroup: string;
  favouritejourneyname: string;
}

export interface IFareTypes {
  outboundStandard: any[];
  outboundFirstClass: any[];
  returnStandard: any[];
  returnFirstClass: any[];
  singleReturns: any[];
  outboundSingleFirstClass: any[];
  returnBoundSingleFirstClass: any[];
}

export interface IFareTypeSingles {
  cost: {
    totalfare
  };
}
