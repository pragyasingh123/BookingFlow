import { Component, OnInit, Inject, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Trip } from '../../models/trip';
import { ReservationPostRequest, IReservationPostResponse } from '../../models/trip/reservation-post';
import { ISelectOption } from '../../shared/select/select.component';
import { UiService } from '../../services/ui.service';
import { BasketService } from '../../services/basket.service';
import { JourneySelectionService } from '../../services/journey-selection-service';
import { CONFIG_TOKEN } from '../../constants';
import { Analytics } from '../../services/analytics.service';
import * as _ from 'lodash';
import { SubscriberComponent } from '../../shared/subscriber.component';
import { Basket } from '../../models';

@Component({
  selector: 'app-add-bike',
  styleUrls: [ 'add-bike.component.scss' ],
  templateUrl: 'add-bike.component.html'
})
export class AddBikeComponent extends SubscriberComponent implements OnInit {
  @Output() public possibilityOfReservation: EventEmitter<boolean> = new EventEmitter<boolean>();
  private bikeSpaceSelection: ISelectOption;
  private bikeSpaceOptions: ISelectOption[] = [];
  private trip: Trip;
  private travellingWithBikeUrl: string;
  private providerDomain: string = 'TPExpress.co.uk';

  constructor(private route: ActivatedRoute,
              private router: Router,
              private basketService: BasketService,
              private uiService: UiService,
              private journeySelectionService: JourneySelectionService,
              @Inject(CONFIG_TOKEN)
              private config: any,
              private analytics: Analytics) {
                super();
                this.travellingWithBikeUrl = config.data.links.travellingWithBike;
  }

  public ngOnInit(): void {
    // params
    this.route.parent.params.subscribe((params) => {
      if (params[ 'trip' ]) {
        this.basketService.findTrip(params[ 'trip' ]).subscribe((trip: Trip) => {
          this.trip = trip;
          this.getPassengers();
        });
      }
    });

    this.analytics.gtmTrackEvent({
      event: 'pop-over',
      'pop-over': 'add bike'
    });
  }

  public reserveBike(): void {
    let reservationPostRequest = new ReservationPostRequest(this.trip.id);
    reservationPostRequest.bicycleReservationsOnly = true;
    reservationPostRequest.reserveoutward = this.trip.outwardJourneys.length > 0;
    reservationPostRequest.reserveinward = this.trip.returnJourneys.length > 0;
    reservationPostRequest.numberOfBicycles = this.bikeSpaceSelection.value;

    let tripDetails = this.journeySelectionService.getTrip(this.trip.id);

    if (tripDetails) {
      if (tripDetails.reservations !== undefined && tripDetails.reservations.seatpreferences !== undefined) {
        reservationPostRequest.seatpreferences = tripDetails.reservations.seatpreferences;
        reservationPostRequest.bicycleReservationsOnly = false;
      }

      this.journeySelectionService.addTrip({
        reservations: reservationPostRequest,
        searchResults: tripDetails.searchResults,
        selectedService: tripDetails.selectedService,
        tripNo: this.trip.id
      });
    }

    this.subscriptions.push(
      this.basketService.addReservation(reservationPostRequest).first()
        .flatMap(() => this.basketService.basketSubject$, (reservationPostResponse: IReservationPostResponse, basket: Basket) => {
          this.trip = _.find(basket.trips, { id: this.trip.id });
          return reservationPostResponse;
        })
        .subscribe((reservationPostResponse: IReservationPostResponse) => {
          let numberOfLegs = this.trip.outwardJourneys[ 0 ].timetableJourneys[ 0 ].legs.length;
          try {
            numberOfLegs += this.trip.returnJourneys[ 0 ].timetableJourneys[ 0 ].legs.length;
          } catch (err) { }

          if (reservationPostResponse.information.success || this.trip.bike.numberOfReservedLegs > 0) {
            // it can happen that bike reservation wasn't completely successfull.
            // for some legs there might not have been a reservation.

            if (this.trip.bike.numberOfReservedLegs < numberOfLegs && numberOfLegs > 1) {
              this.uiService.alert('There are some legs without bike reservations!');
            }

            let bikeState;

            if (this.trip.bike.numberOfBikes == 0 && this.bikeSpaceSelection.value > this.trip.bike.numberOfBikes) {
              bikeState = 'add-bike-reservation';
            } else if (this.trip.bike.numberOfBikes !== 0 && this.bikeSpaceSelection.value !== this.trip.bike.numberOfBikes) {
              bikeState = 'edit-bike-reservation';
            } else if (this.bikeSpaceSelection.value == 0) {
              bikeState = 'remove-bike-reservation';
            }

            this.analytics.gtmTrackEvent({
              event: 'formSubmit',
              form: `${bikeState}`,
              options: this.bikeSpaceSelection.value
            });

            this.backToSeatsAndExtras();
          } else {
            let bikeReservationAvailable = !reservationPostResponse.information.hasWarning('bicyclereservationnotavailable');

            if (!reservationPostResponse.information.success && !bikeReservationAvailable) {
              this.uiService.alertWithButton('Sorry, this service is already full, so we couldn’t reserve your bike space(s). Please choose a different service.');
              this.backToSeatsAndExtras();
            } else {
              this.backToSeatsAndExtras(
                bikeReservationAvailable ? 'Unable to reserve bike. Please try again.' : 'Unable to reserve bike. Please continue without bike reservations.');
            }
          }
        }, (err: any) => {
          this.uiService.error('We encountered an unknown error connecting to our API.');
          this.backToSeatsAndExtras();
        })
      );
  }

  private getPassengers(): void {
    for (let i = 1; i <= (this.trip.numAdult + this.trip.numChild); i++) {
      if (i > 2) { break; }

      this.bikeSpaceOptions.push({
        label: i,
        selected: i === this.trip.bike.numberOfBikes
      });
    }
  }

  private backToSeatsAndExtras(message?: string): void {
    if (message) {
      this.uiService.alert(message);
    }

    if (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > -1) {
      this.basketService.refresh();
    }

    this.router.navigate(['./seats-and-extras', this.trip.id]);
  }
}
