import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Trip } from '../../models/trip';
import { ReservationPostRequest, IReservationPostResponse } from '../../models/trip/reservation-post';
import { BasketService } from '../../services/basket.service';
import { UserService } from '../../services/user.service';
import { UiService } from '../../services/ui.service';
import { JourneySelectionService } from '../../services/journey-selection-service';
import { Analytics } from '../../services/analytics.service';
import { SleeperService } from '../../services/sleeper.service';
import { SubscriberComponent } from '../../shared/subscriber.component';
import * as _ from 'lodash';

@Component({
  selector: 'app-add-seat',
  styleUrls: ['add-seat.component.scss'],
  templateUrl: 'add-seat.component.html'
})
export class AddSeatComponent extends SubscriberComponent implements OnInit {
  private trip: Trip;
  private hasOutward: boolean = true;
  private hasReturn: boolean = false;
  private isOutwardSelectionAvailable: boolean = false;
  private isReturnSelectionAvailable: boolean = false;
  private isLoggedIn: boolean = false;
  private isSendingRequest: boolean = false;
  private isRememberMyPreferences: boolean = false;
  private seatPrefAvailable: boolean = false;
  private selectedSeatDirection: string | number;
  private defaultValue: boolean = false;
  private seatDirectionOptions: Array<{value: string|number, label: string}> = [
    { value: 'ANYDIRECTION', label: 'Don\'t mind' },
    { value: 'FACE', label: 'Forwards' },
    { value: 'BACK', label: 'Backwards' }
  ];
  private selectedAisleOption: string|number;
  private seatAisleOptions = [
    { value: 'ANYAISLE', label: 'Don\'t mind' },
    { value: 'WIND', label: 'Window' },
    { value: 'AISL', label: 'Aisle'}
  ];
  private selectedTableOption: string|number;
  private seatTableOptions = [
    { value: 'ANYTABLE', label: 'Don\'t mind' },
    { value: 'TABL', label: 'Table' },
    { value: 'AIRL', label: 'Airline' }
  ];
  private selectedQuietCoachOption: boolean = false;
  private seatAttributes: ISeatAttributes;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private basketService: BasketService,
    private userService: UserService,
    private journeySelectionService: JourneySelectionService,
    private uiService: UiService,
    private analytics: Analytics,
    private sleeperService: SleeperService) {
    super();
  }

  public ngOnInit(): void {
     this.subscriptions.push(this.route.params.subscribe((params) => {
        if (params['trip']) {
          this.subscriptions.push(this.basketService.findTrip(params['trip']).take(1).subscribe((trip: Trip) => {
            this.trip = trip;

            if (!trip || !trip.returnJourneys || trip.returnJourneys.length === 0) {
              this.hasOutward = true;
            }

            this.selectedSeatDirection = this.seatDirectionOptions[0].value;

            this.subscriptions.push(this.userService.getSeatPreferences(this.trip.id).take(1).subscribe((seatPreferences) => {
              this.removeQuietCoach(seatPreferences.data.seatattributes);
              this.seatAttributes = seatPreferences.data.seatattributes;
              this.setPreferences(seatPreferences.data.seatattributes);
            }));
          }));
        }
    }));

    if (this.sleeperService.sleeperSelection) {
      this.isOutwardSelectionAvailable = this.sleeperService.sleeperSelection.IsOutwardSeatSelectionAvailable();
      this.isReturnSelectionAvailable = this.sleeperService.sleeperSelection.IsReturnSeatSelectionAvailable();
    }

    this.hasReturn = this.trip.returnJourneys.length > 0 && this.isReturnSelectionAvailable;

    this.analytics.gtmTrackEvent({
      event: 'pop-over',
      'pop-over': 'reservations'
    });
  }

  public reserveSeat(): void {
    this.isSendingRequest = true;
    let reservationPostRequest = new ReservationPostRequest(this.trip.id);
    reservationPostRequest.reserveoutward = this.hasOutward;
    reservationPostRequest.reserveinward = this.hasReturn;
    reservationPostRequest.seatpreferences = this.getPreferencesForSeatReservation();
    reservationPostRequest.numberOfBicycles = (this.trip.bike) ? this.trip.bike.numberOfBikes : 0;

    let reservationResponse: IReservationPostResponse = null;
    this.subscriptions.push(
      this.basketService.addReservation(reservationPostRequest)
      .do((reservationPostResponse: IReservationPostResponse) => {
        reservationResponse = reservationPostResponse;
      })
      // Need to get fresh basket content, as WL POST reservation API returns unreliable data
      .flatMap(() => this.basketService.basketSubject$
      .map((basket) => _.find(basket.trips, { id: Number(this.trip.id) }))
      .filter((trip) => !!trip).first())
      .subscribe((trip: Trip) => {
        if (reservationResponse.information.success) {
          if (trip.seatReservationStillNeededOnSomeJourneys) {
            this.uiService.error('No seats available for your chosen ticket and service. Please remove this journey from your basket and search again.');
            this.backToSeatsAndExtras();
            return;
          }

          if (reservationResponse.information.hasWarning('seatnotavailable')) {
            this.uiService.alertWithButton('Sorry, we couldn’t reserve your seat(s). We recommend that you choose a different service.');
            this.backToSeatsAndExtras();
            return;
          }

          if (this.isRememberMyPreferences) {
            let seatPreferences = this.getPreferencesForSeatPreferences();
            this.subscriptions.push(this.userService.postSeatPreference(seatPreferences).subscribe((x) => {
              this.trip.seatPreferences = seatPreferences;
            }));
          }

          let tripDetails = this.journeySelectionService.getTrip(this.trip.id);
          if (tripDetails && tripDetails.selectedService) {
            this.journeySelectionService.addTrip({
              reservations: reservationPostRequest,
              searchResults: tripDetails.searchResults,
              selectedService: tripDetails.selectedService,
              tripNo: this.trip.id
            });
          } else {
            this.saveReservations(reservationPostRequest);
          }

          this.isSendingRequest = false;
          this.analytics.gtmTrackEvent({
            event: 'formSubmit',
            form: 'reservations',
            options: this.getGTMReservationSeatOptions(reservationPostRequest)
          });

          this.backToSeatsAndExtras();
        } else {
          // In case seat preferences cannot be met, WL returns that reservation was not successful
          // despite that they actually complete the reservation but on different seat types as the customer selected
          // we are handling that behavior with a lower lewel warning message here.
          if (!trip.seatReservationStillNeededOnSomeJourneys &&
              reservationResponse.information.warnings.length === 1 &&
              reservationResponse.information.hasWarning('seatingpreferencesnotmet')) {
            this.uiService.alertWithButton('Sorry, we couldn’t meet your seating preferences. We recommend that you choose a different service.');
          } else {
            this.uiService.errorWithButton('Sorry, we couldn’t reserve your seat(s). We recommend that you choose a different service.');
          }
          this.backToSeatsAndExtras();
        }

      }, (error: any) => {
        this.isSendingRequest = false;
        this.uiService.error('Error while making reservation');
        this.backToSeatsAndExtras();
      }
    ));
  }

  public saveReservations(reservationPostRequest: ReservationPostRequest): void {
    this.journeySelectionService.addTrip({
      reservations: reservationPostRequest,
      tripNo: this.trip.id
    });
  }

  public backToSeatsAndExtras(): void {
    this.router.navigate(['./seats-and-extras', this.trip.id]);
  }

  private getGTMReservationSeatOptions(reservationPostRequest): string {
    var options = 'Journeys:' + (reservationPostRequest.reserveoutward ? 'Outward' : 'Inward');

    if (reservationPostRequest.seatpreferences === null) {
      reservationPostRequest.seatpreferences = ['ANYDIRECTION'];
    }

    reservationPostRequest.seatpreferences.forEach((code) => {
       options += this.getGTMReservationSeatOptionByCode('Direction', code);
       options += this.getGTMReservationSeatOptionByCode('Aisle', code);
       options += this.getGTMReservationSeatOptionByCode('Table', code);
    });

    return options;
  }

  private getGTMReservationSeatOptionByCode(option, code): string {
    var optionElement = this['seat' + option + 'Options'].find((x) => x.value === code);
    return optionElement ? '|' + option + ':' + optionElement.label : '';
  }

  private setPreferences(preferences: ISeatAttributes) {

    this.seatPrefAvailable = true;

    if (preferences['individual'] && this.seatTableOptions.length < 4) {
      this.seatTableOptions[3] = { value: 'INDL', label: 'Individual' };
    }
  }

  private getPreferencesForSeatReservation(): string[] {
    let result = [];

    if (this.selectedSeatDirection && this.selectedSeatDirection !== 'ANYDIRECTION') {
      result.push(this.selectedSeatDirection);
    }
    if (this.selectedAisleOption && this.selectedAisleOption !== 'ANYAISLE') {
      result.push(this.selectedAisleOption); // aisle options + INDL
    }
    if (this.selectedTableOption && this.selectedTableOption !== 'ANYTABLE') {
      result.push(this.selectedTableOption);
    }
    if (this.selectedQuietCoachOption) {
      result.push('QUIE');
    }

    return result.length === 0 ? null : result;
  }

  private getPreferencesForSeatPreferences(): any {
    let result = {};

    if (this.selectedSeatDirection === this.seatAisleOptions[1].value) {
      result['windows'] = true;
    } else if (this.selectedSeatDirection === this.seatAisleOptions[2].value) {
      result['aisle'] = true;
    }

    if (this.selectedSeatDirection === this.seatDirectionOptions[0].value) {
      result['forwards'] = true;
    } else if (this.selectedSeatDirection === this.seatDirectionOptions[1].value) {
      result['backwards'] = true;
    }

    if (this.selectedTableOption === this.seatTableOptions[1].value) {
      result['table'] = true;
    } else if (this.selectedTableOption === this.seatTableOptions[2].value) {
      result['airline'] = true;
    } else if (this.selectedSeatDirection === this.seatTableOptions[3].value) {
      result['individual'] = true;
    }

    if (this.selectedQuietCoachOption) {
      result['quietcoach'] = true;
    }

    return result;
  }

  private removeQuietCoach(seatAttributes: ISeatAttributes): void {
    delete seatAttributes.quiet;
  }
}

export interface ISeatAttributes {
  airline: boolean;
  aisle: boolean;
  atends: boolean;
  backwards: boolean;
  center: boolean;
  facing: boolean;
  individual: boolean;
  quiet: boolean;
  table: boolean;
  toilet: boolean;
  windows: boolean;
}
