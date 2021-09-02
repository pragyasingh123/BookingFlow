import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CookieService } from 'angular2-cookie/core';
import { Router } from '@angular/router';
import { Trip } from '../../models/trip';
import { UiService } from '../../services/ui.service';
import { BasketService } from '../../services/basket.service';
import { JourneySelectionService } from '../../services/journey-selection-service';
import { IJourney } from '../../models/journey-selection';
import { Analytics } from '../../services/analytics.service';
import { Device } from 'ng2-device-detector/src/index';
import { RoutingService } from '../../services/routing.service';
import * as _ from 'lodash';
import { SubscriberComponent } from '../subscriber.component';
import {dateManipulationUtils} from '../../services/date-manipulation-utils.service';
import {JourneyService} from '../../services/journey.service';

@Component({
  selector: 'app-trip-card',
  styleUrls: ['trip-card.component.scss'],
  templateUrl: 'trip-card.component.html'
})
export class TripCardComponent extends SubscriberComponent implements OnInit {
  @Input() public editable: boolean;
  @Input() public amendMode: boolean;
  @Input() public favouriteName: string;
  @Input() public trip: Trip;
  @Input() public isBasket: boolean;
  @Input() public checkReservations: boolean = false;
  @Input() public adminFee: string;
  @Output() public onEdit: EventEmitter<Trip> = new EventEmitter<Trip>();

  public journey: IJourney | null;
  public selectionsPage: boolean;
  public reviewPage: boolean;
  public confirmationPage: boolean;
  public currentTrip: any;
  public favouriteJourneyName: string = '';
  public tripIsFavouite: boolean = false;
  public canEditFavourite: boolean = false;
  public showFavouriteName: boolean = false;
  public showLoadingState: boolean = false;
  public numRailcard: number = 0;
  public trips: Trip[] = [];
  public isSingleReturn: boolean = false;
  public outwardRouteDetailsParams: IRouteDetailSimplified;
  public returnRouteDetailsParams: IRouteDetailSimplified;
  private service: any;
  private fare: any;
  private closestCheapestPrice: number = Infinity;

  constructor(
    private uiService: UiService,
    private router: Router,
    private journeySelectionService: JourneySelectionService,
    private basketService: BasketService,
    private analytics: Analytics,
    private device: Device,
    private routingService: RoutingService,
    private cookieService: CookieService
  ) {
    super();
  }

  public inflect(num: number, noun: string) {
    let nounCap = noun[0].toUpperCase() + noun.slice(1);
    if (noun === 'child') {
      return num === 1 ? '1 Child' : num + ' Children';
    } else {
      return num === 1 ? '1 ' + nounCap : num + ' ' + nounCap + 's';
    }
  }

  public ngOnInit(): void {
    this.isSingleReturn = this.trip.outwardJourneys[0].fares.length > 1;
    this.journey = this.journeySelectionService.getTrip(this.trip.id);

    if (this.journey !== null && (this.journey !== undefined && this.journey.selectedService !== undefined)) {
      // find selected service
      this.service = this.journey.searchResults.allServices.find((service) => service.id === this.journey.selectedService.outwardserviceid);
      // find closes price from other fares
      if (this.service) {
        this.fare = this.service.otherfaregroups.find((fare) => fare.faregroupid === this.journey.selectedService.outwardfaregroup);

        if (this.fare) {
          this.service.otherfaregroups
            .filter((fareData) => {
              let fareGroupId = fareData.faregroupid !== this.fare.faregroupid;
              let fareClass = fareData.class == this.fare.class;
              let isGroupsaveIncluded = fareData.isgroupsaveincluded == false && fareData.isgroupsaveincluded == this.fare.isgroupsaveincluded;
              let offpick = _.includes(this.fare.faregroupname, 'Off-Peak') == false;
              let fareCost = fareData.cost.totalfare > this.fare.cost.totalfare;

              return fareGroupId && fareClass && isGroupsaveIncluded && offpick && fareCost;
            })
            .forEach((fareData) =>
              (this.closestCheapestPrice = this.closestCheapestPrice > fareData.cost.totalfare ? fareData.cost.totalfare : this.closestCheapestPrice)
            );
        }
      }

      if (this.journey.selectedService.favouritejourneyname !== undefined) {
        this.setFavouriteTrip(this.journey.selectedService.favouritejourneyname);
      } else {
        if (this.router.url.indexOf('selections') > -1 && !this.isBasket) {
          this.showFavouriteName = true;
        }
      }
    }

    if (this.journey && this.journey.searchResults) {
      this.outwardRouteDetailsParams = this.getSelectedServiceDirection('outwardSimplifiedRoute');
      this.returnRouteDetailsParams = this.getSelectedServiceDirection('returnSimplifiedRoute');
    }
  }

  public get isCheapest(): boolean {
    return this.service && _.includes(this.service.flags, 'Cheapest');
  }

  public get savedMoneyAmount(): number {
    return this.fare && this.closestCheapestPrice !== Infinity ? (this.closestCheapestPrice - this.fare.cost.totalfare) / 100 : 0;
  }

  public isReturnJourneyType(): boolean {
    return this.trip.ticketTypes[0].journeytype === 'S';
  }

  public onKey(event: any): void {
    this.favouriteJourneyName = event.target.value.replace(/[^0-9a-z]/gi, ' ');
  }

  public editExtras(trip: Trip): void {
    this.router.navigate(['/seats-and-extras', trip.id]);
    this.onEdit.emit(trip);
  }

  public addFavourite(tripId: any): void {
    if (this.favouriteJourneyName.length < 3) {
      return;
    }

    this.currentTrip = this.journeySelectionService.getTrip(tripId);

    if (this.currentTrip.selectedService.favouritejourneyname == this.favouriteJourneyName) {
      this.tripIsFavouite = true;
      return;
    }

    this.currentTrip.selectedService.favouritejourneyname = this.favouriteJourneyName;
    this.showLoadingState = true;

    this.subscriptions.push(this.basketService.updateTrip(this.trip.id, this.currentTrip.selectedService).subscribe((data: any) => {
        if (data.tripno == 0) {
          this.uiService.error('You already have the maximum number of favourites allowed.');
          delete this.currentTrip.selectedService.favouritejourneyname;
          this.subscriptions.push(this.basketService.addServiceToBasket(this.currentTrip.selectedService).subscribe((tripno) => {
              this.router.navigate(['/selections', { trip: tripno }]);
              this.journeySelectionService.addTrip({
                isOpenReturn: false,
                searchResults: this.currentTrip.searchResults,
                selectedService: this.currentTrip.selectedService,
                tripNo: tripno
              });
            }, (err) => {
              this.router.navigate(['/qtt']);
            }
          ));
        } else {
          this.journeySelectionService.addTrip(this.currentTrip);
          this.router.navigate(['/selections', { trip: data.tripno }]);
          this.showLoadingState = false;
          this.tripIsFavouite = true;

          this.analytics.gtmTrackEvent({
            event: 'formSubmit',
            form: 'add-favourite-journey',
            options: ''
          });
        }
      }, (error) => {
        this.showLoadingState = false;
        this.uiService.error("Sorry, there's a problem with our system. Please try booking your journey again.");
        this.journeySelectionService.removeTrip(this.trip.id);
        this.router.navigate(['/qtt']);
        this.basketService.refresh();
      }
    ));
  }

  public editFavourite(): void {
    this.analytics.gtmTrackEvent({
      event: 'formSubmit',
      form: 'edit-favourite-journey',
      options: ''
    });
  }

  public removeFavourite(tripId: any): void {
    this.showLoadingState = true;
    this.currentTrip = this.journeySelectionService.getTrip(tripId);
    this.currentTrip.selectedService.favouritejourneyname = '';

    this.subscriptions.push(this.basketService.updateTrip(this.trip.id, this.currentTrip.selectedService).subscribe((data: any) => {
      this.journeySelectionService.addTrip(this.currentTrip);
      this.router.navigate(['/selections', { trip: data.tripno }]);
      this.showLoadingState = false;
      this.tripIsFavouite = true;

      this.analytics.gtmTrackEvent({
        event: 'formSubmit',
        form: 'remove-favourite-journey',
        options: ''
      });
    }));
  }

  public deleteTrip(trip: Trip): void {
    this.subscriptions.push(this.uiService.prompt('Remove Trip', 'Are you sure?', [
        {label: 'Yes', value: true},
        {label: 'No', value: false}
      ]).subscribe((val) => {
        if (val === true) {
          this.subscriptions.push(this.basketService.removeTrip(trip.id).subscribe((response) => {
            this.analytics.gtmTrackEvent({
              event: 'remove-item'
            });

            this.journeySelectionService.removeTrip(trip.id);
          }));
        }

      this.subscriptions.push(this.basketService.basket$.subscribe((res) => {
          if (res.isEmpty) {
            this.handleRouting();
            return;
          }
        }));
    }));
  }

  public refreshBasket(): void {
    this.basketService.refresh();
  }

  private getSelectedServiceDirection(direction: string) {
    this.wrapDataForRouteSimplified(direction);
    return {
      service: direction
    };
  }

   private wrapDataForRouteSimplified(direction: string): void {
    let returnOrOutwardService: number = this.journey.selectedService.outwardserviceid;
    if (sessionStorage.getItem(direction)) {
      sessionStorage.removeItem(direction);
    }
    if (direction === 'returnSimplifiedRoute') {
      returnOrOutwardService = this.journey.selectedService.returnServiceId;
    }
    sessionStorage.setItem(direction, JSON.stringify({ routeDetailsUri: '/rail/journey/' + returnOrOutwardService + '/' + this.journey.searchResults.searchId}));
  }

  private setFavouriteTrip(favouriteName: string = ''): void {
    this.favouriteJourneyName = favouriteName;
    this.tripIsFavouite = favouriteName !== undefined && favouriteName.length > 0;

    if (this.router.routerState.snapshot.url.indexOf('selections') > -1) {
      this.showFavouriteName = true;
      this.canEditFavourite = true;
    }

    if (this.tripIsFavouite) {
      this.showFavouriteName = true;
    }

    if (this.isBasket) {
      this.canEditFavourite = false;
    }
  }

  private handleRouting(): void {
    let qttFirstStage = this.cookieService.get('qttFirstStage');
    if (qttFirstStage == 'mixingDeck' && !this.device.isMobile()) {
      this.routingService.redirectDesktop();
    } else {
      this.routingService.redirectMobile();
    }
  }
}

export interface IRouteDetailSimplified {
  service: string;
}
