import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { Basket } from '../models/basket';
import { SleeperSupplementGetRequest, ISleeperSupplementGetResponse, ISleeperSupplementDetailGetApiResponse } from '../models/sleeper-supplement-get';
import { Trip, IPlusBus, ITravelcard, IBike } from '../models/trip';
import { ILegolandAndWestgateBus } from '../models/legoland-westgate';
import { ExtraGetRequest, IExtraGetResponse } from '../models/trip/extra-get';
import { ExtraPutRequest, IAdditionalOptionItemSelections } from '../models/trip/extra-put';
import { ReservationPostRequest, IReservationPostResponse } from '../models/trip/reservation-post';
import { SleeperSelection } from './seats-and-extras-sleeper-selection';
import { SleeperService } from '../services/sleeper.service';
import { UserService } from '../services/user.service';
import { UiService } from '../services/ui.service';
import { BasketService } from '../services/basket.service';
import { IRadioOption } from '../shared/radio/radio.component';
import { ISelectOption } from '../shared/select/select.component';
import { NreHelper } from '../services/nre-helper/nre-helper';
import { JourneySelectionService } from '../services/journey-selection-service';
import { Device } from 'ng2-device-detector/src/index';
import { Analytics } from '../services/analytics.service';
import { BasketContinueButtonService } from '../services/basket-continue-button.service';
import { CONFIG_TOKEN } from '../constants';
import * as _ from 'lodash';
import { CookieService } from 'angular2-cookie/core';
import { RoutingService } from '../services/routing.service';
import { SubscriberComponent } from '../shared/subscriber.component';
import { CarbonFootprintCalculation } from '../models/carbon-footprint-calculation';

declare var window: Window;

@Component({
  selector: 'app-seats-and-extras',
  styleUrls: [ 'seats-and-extras.component.scss' ],
  templateUrl: 'seats-and-extras.component.html'
})
export class SeatsAndExtrasComponent extends SubscriberComponent implements OnInit {

  private get currentTripID(): number {
    return this.trip.id - 1;
  }

  private get isTripWithChildren(): boolean {
    return this.trip.numChild > 0 ? true : false;
  }

  private get isPackageSleeperOutward(): boolean {
    return this.basketService[ 'basket' ].trips[ this.currentTripID ].outwardJourneys[ '0' ].ticketTypeDescription.toLowerCase().indexOf('sleeper') > -1 ? true : false;
  }

  private get isGroupSaveOutward(): boolean {
    return _.find<any>(this.basketService[ 'basket' ].trips[ this.currentTripID ].outwardJourneys[ '0' ].discounts, (discount) => {
      return discount.description.toLowerCase().indexOf('groupsave') > -1;
    }) ? true : false;
  }

  private get isReturnJourneyExist(): boolean {
    return this.basketService[ 'basket' ].trips[ this.currentTripID ].returnJourneys[ '0' ] ? true : false;
  }

  private get isPackageSleeperReturn(): boolean {
    return this.basketService[ 'basket' ].trips[ this.currentTripID ].returnJourneys[ '0' ].ticketTypeDescription.toLowerCase().indexOf('sleeper') > -1 ? true : false;
  }

  private get isGroupSaveRetur(): boolean {
    return _.find<any>(this.basketService[ 'basket' ].trips[ this.currentTripID ].returnJourneys[ '0' ].discounts, (discount) => {
      return discount.description.toLowerCase().indexOf('groupsave') > -1;
    }) ? true : false;
  }
  public seatSelectorAvailable: boolean = false;
  public seatSelectorDisabled: boolean = false;
  public phoneNo: string = null;
  private trip: Trip;
  private tripno: number;
  private plusBuses: IPlusBus[];
  private legolandBus: ILegolandAndWestgateBus;
  private oxfordWestgateBus: ILegolandAndWestgateBus;
  private travelcard: ITravelcard;
  private bike: IBike;
  private isSeatSelectionAvailable = true;
  private requiresPreferences = false;
  private requiresCustomerDetails = false;
  private changeOfJourney: boolean = false;
  private sleeperOptionSelected: boolean = false;
  private tripReservationLoaded: boolean = false;
  private reservationDisabled: boolean = false;
  private sleeperSupplements: ISleeperSupplementDetailGetApiResponse[] = [];
  private sleeperOugoingCode: string[] = [];
  private sleeperReturnCode: string[] = [];
  private outwardSleeperOptions: IRadioOption[] = [];
  private returnSleeperOptions: IRadioOption[] = [];
  private outwardSleeperSelection: ISleeperSupplementDetailGetApiResponse;
  private returnSleeperSelection: ISleeperSupplementDetailGetApiResponse;
  private genderOptions: Array<{ value: string | number, label: string }> = [
    { value: 'M', label: 'Male' },
    { value: 'F', label: 'Female' }
  ];
  private shareOptions: Array<{ value: boolean | string, label: string }> = [
    { value: 'true', label: 'Share' },
    { value: 'false', label: "Don't share" }
  ];
  private bunkOptions: Array<{value: string|number, label: string}> = [
    { value: 'UPPR', label: 'Upper'},
    { value: 'LOWR', label: 'Lower'}
  ];
  private personTitleOptions: ISelectOption[] = [
    { label: 'Dr.' },
    { label: 'Lady' },
    { label: 'Lord' },
    { label: 'Miss' },
    { label: 'Mr' },
    { label: 'Mrs' },
    { label: 'Ms' },
    { label: 'Rev' },
    { label: 'Sir' }
  ];
  private sleeperInfoContent: string = `
    <h2>General Facilities</h2>
    <p>All our passengers – cabin and lounge passengers – have access to:</p>
    <ul>
      <li>Customer host</li>
      <li>Wake up call if required</li>
      <li>Complimentary breakfast</li>
      <li>Night Riviera Sleeper Café</li>
      <li>Showers at Paddington (platform 12) on departure or after arrival</li>
      <li>Unisex toilets</li>
    </ul>
    <h2>Facilities for cabin passengers</h2>
    <p>Both single and twin cabins also offer:</p>
    <ul>
      <li>Air conditioning</li>
      <li>Wash basin with shaver point</li>
      <li>Towels</li>
      <li>Bottled water</li>
      <li>Personally-controlled lighting</li>
      <li>In-cabin refreshments</li>
      <li>Door locks</li>
    </ul>
  `;
  private seatSelectorReservationState: string;
  private inwardSeatmapAvailable: boolean = false;
  private outwardSeatmapAvailable: boolean = false;
  private showAllInfoInBasket: boolean = false;
  private dateTimeFormat: string = 'ddd D MMM YYYY HH:mm';
  private dateFormat: string = 'ddd D MMM YYYY';
  private dateTime: string = 'HH:mm';
  private nectarPoints: string = '';
  private nreCheckForOneJourney: boolean = true;
  private carbonFootprintCalculation: CarbonFootprintCalculation;
  private totalNumberOfTickets: number;
  private showSleeperMessage: boolean = false;
  private showContentForRegularSleeper: boolean = true;
  private possibilityOfBikeReservation: boolean = false;

  constructor(private route: ActivatedRoute,
    private router: Router,
    private basketService: BasketService,
    private journeySelectionService: JourneySelectionService,
    private uiService: UiService,
    private titleService: Title,
    private device: Device,
    private analytics: Analytics,
    private sleeperService: SleeperService,
    private basketContinueButtonService: BasketContinueButtonService,
    private location: Location,
    private userService: UserService,
    private cookieService: CookieService,
    private routingService: RoutingService,
    @Inject(CONFIG_TOKEN) private config: any) {
    super();
  }

  public setActiveTrip() {
    // if url has valid tripno, set to this trip
    if (Number(this.tripno) <= this.basketService.totalTrips()) {
      this.setCurrentTrip(Number(this.tripno));
    } else if (this.basketService.totalTrips() > -1) {
      this.route.params[ 'trip' ] = this.basketService.totalTrips();
      this.router.navigate([ '/seats-and-extras', this.basketService.totalTrips() ]);
    }
  }

  public ngOnInit() {
    this.titleService.setTitle('Select seats and extras');
    this.analytics.trackPage(this.titleService.getTitle());
    this.phoneNo = this.config.phoneSleeperReservation;

    // Listen for route trip ID changes
    this.subscriptions.push(this.route.params.subscribe((params) => {
      if (params[ 'trip' ]) {
        let tripNumberParam = Number(params[ 'trip' ]);
        if (tripNumberParam !== this.tripno) {
          this.tripno = tripNumberParam;
          this.setActiveTrip();
        }
      }

      switch (params[ 'seatSelectorStatus' ]) {
        case 'success':
          this.changeSeatSelectorSuccessful('success', this.tripno);
          break;
        case 'fail':
          this.changeSeatSelectorSuccessful('fail', this.tripno);
          break;
        case 'cancelled':
          this.changeSeatSelectorSuccessful('cancelled', this.tripno);
          break;
        default:
          this.changeSeatSelectorSuccessful(null, this.tripno);
          break;
      }

      this.seatSelectorDisabled = false;
    }));

    // Listen for basket changes
    this.subscriptions.push(
      this.basketService.basket$
      .subscribe((basket: Basket) => {
        this.setActiveTrip();
        this.changeOfJourney = basket.ischangeofjourney;
        this.nreSetup(basket);
      })
    );

    if (!this.sleeperService.sleeperSelection) {
      this.sleeperService.sleeperSelection = new SleeperSelection();
    }

    // Set selected title for a user if data exists
    if (this.sleeperService.sleeperReservation) {
      this.setSelectedPersonTitleOptions(this.sleeperService.sleeperReservation.personTitle);
    }

    this.subscriptions.push(this.basketContinueButtonService.change.subscribe((response) => {
      if (response === true) {
        this.continue();
      }
    }));

    this.seatSelectorAvailable = this.inwardSeatmapAvailable || this.outwardSeatmapAvailable;
  }

  public changeSeatSelectorSuccessful(state, tripId) {
    this.seatSelectorReservationState = state;
    this.location.replaceState('/seats-and-extras' + '/' + tripId);
  }

  public setCurrentTrip(tripId: number) {
    this.subscriptions.push(
      this.basketService.findTrip(tripId).take(1)
        .subscribe((trip: Trip) => {
          this.refreshCoreTripData(trip);
          this.refreshSleeperTripData(trip);

          if (this.nreIsSet() && this.trip !== undefined) {
            this.totalNumberOfTickets = Number(this.trip.numAdult) + Number(this.trip.numChild);
            this.carbonFootprintCalculation = this.trip.carbonFootPrintCalculation;
          }

          if (this.trip && this.trip.bike && (this.trip.bike.numberOfReservedLegs > 0 || this.trip.bike.numberOfAllowedBikeReservation > 0)) {
            this.possibilityOfBikeReservation = true;
          }

          this.tripReservationLoaded = true;
        })
    );
  }

  public checkSleeperMessageToShow(): boolean {
    return ((this.isPackageSleeperOutward || (this.isReturnJourneyExist && this.isPackageSleeperReturn)) && this.isTripWithChildren) ||
      ((this.isGroupSaveOutward || (this.isReturnJourneyExist && this.isGroupSaveRetur)) && this.trip.hasSleepers && this.trip.numChild > 0) ||
      (this.trip.hasSleepers && this.trip.numChild > 0);
  }

  public checkRadioButtonAvailableForOutward(): boolean {
    if (this.isReturnJourneyExist) {
      return (this.isPackageSleeperOutward || this.isPackageSleeperReturn) && this.isTripWithChildren ? false : true;
    } else {
      return this.isPackageSleeperOutward && this.isTripWithChildren ? false : true;
    }
  }

  public checkRadioButtonAvailableForReturn(): boolean {
    let isPackageSleeperReturn: boolean = true;

    if (this.isReturnJourneyExist) {
      isPackageSleeperReturn = this.isPackageSleeperReturn;
      return (this.isPackageSleeperOutward || isPackageSleeperReturn) && this.isTripWithChildren ? false : true;
    } else {
      return isPackageSleeperReturn && this.isTripWithChildren ? false : true;
    }
  }

  public cancelAmend() {
    this.subscriptions.push(this.basketService.cancelAmendBooking().subscribe((response) => {
      this.basketService.routeToMyAccount();
    }, (err) => {
      throw err;
    }));
  }

  public showSleeperModal(content) {
    this.subscriptions.push(this.uiService.modal(content, true).subscribe());
  }

  public removeSeat(isOutward: boolean) {
    let outwardReservations = _.find(this.trip.outwardJourneys[ 0 ].reservations, { direction: 'O' }) ? true : false;
    let returnReservations = _.find(this.trip.outwardJourneys[ 0 ].reservations, { direction: 'R' }) ? true : false;
    let reservationPostRequest = new ReservationPostRequest(this.trip.id);

    if (isOutward) {
      reservationPostRequest.reserveoutward = false;
      reservationPostRequest.reserveinward = returnReservations;
    } else {
      reservationPostRequest.reserveinward = false;
      reservationPostRequest.reserveoutward = outwardReservations;
    }

    reservationPostRequest.seatpreferences = this.trip.seatPreferences;
    reservationPostRequest.numberOfBicycles = (this.bike) ? this.bike.numberOfBikes : 0;

    if (this.bike.numberOfBikes) {
      reservationPostRequest.bicycleReservationsOnly = true;
    }

    this.journeySelectionService.addTrip({
      reservations: reservationPostRequest,
      tripNo: this.trip.id
    });

    this.subscriptions.push(this.basketService.addReservation(reservationPostRequest).subscribe(() => {}));
  }

  public removeBike() {
    let reservationPostRequest = new ReservationPostRequest(this.trip.id);
    reservationPostRequest.bicycleReservationsOnly = true;
    reservationPostRequest.reserveoutward = this.trip.outwardJourneys.length > 0;
    reservationPostRequest.reserveinward = this.trip.returnJourneys.length > 0;
    reservationPostRequest.seatpreferences = (reservationPostRequest.reserveoutward || reservationPostRequest.reserveinward) ? this.trip.seatPreferences : [];

    let tripDetails = this.journeySelectionService.getTrip(this.trip.id);

    if (tripDetails != undefined) {
      if (tripDetails.reservations !== undefined && tripDetails.reservations.seatpreferences !== undefined) {
        reservationPostRequest.seatpreferences = tripDetails.reservations.seatpreferences;
        reservationPostRequest.bicycleReservationsOnly = false;
      }
    }

    this.analytics.gtmTrackEvent({
      event: 'formSubmit',
      form: 'remove-bike-reservation',
      options: '0'
    });

    this.subscriptions.push(this.basketService.addReservation(reservationPostRequest).subscribe(() => { }));
  }

  public removeAdditionalOption(option, name: string, formName: string) {
    this.subscriptions.push(this.basketService.fetchExtras(new ExtraGetRequest(this.trip.id)).take(1).subscribe(
      (extrasOptions: IExtraGetResponse) => {
        let additionalOptionItems = extrasOptions.additionalOptionItems
          .filter((x) => {
            if (x.additionaloption && x.additionaloption.name && x.additionaloption.directiontype && option && option.id && option.directiontype) {
              return x.additionaloption.name.toLowerCase().indexOf(name) >= 0 && x.id === option.id && x.additionaloption.directiontype === option.directiontype;
            }
            return false;
          });

        let additionalOptionItemSelections: IAdditionalOptionItemSelections = {
          additionaloptionitemselection: additionalOptionItems
            .map((x) => {
              return {
                directiontype: x.additionaloption.directiontype,
                id: x.id,
                numberof: 0,
                numberofadults: 0,
                numberofchildren: 0,
                state: 'None',
                travelcardselectedfareid: ''
              };
            })
        };

        let extraPutRequest = new ExtraPutRequest(this.trip.id, additionalOptionItemSelections);

        this.analytics.gtmTrackEvent({
          event: 'formSubmit',
          form: 'remove-' + formName,
          options: ''
        });

        this.subscriptions.push(this.basketService.putExtra(extraPutRequest).subscribe(() => {}));
      }));
  }

  public removeTravelcard(option) {
    this.subscriptions.push(this.basketService.fetchExtras(new ExtraGetRequest(this.trip.id)).take(1).subscribe(
      (extrasOptions: IExtraGetResponse) => {
        let additionalOptionItem = extrasOptions.additionalOptionItems
          .filter((x) => {
            if (x.additionaloption && x.additionaloption.name) {
              return x.additionaloption.name.toLowerCase().indexOf('travelcard') >= 0;
            }
            return false;
          })[ 0 ];
        let additionalOptionItemSelections: IAdditionalOptionItemSelections = {
          additionaloptionitemselection: [ {
            directiontype: additionalOptionItem.additionaloption.directiontype,
            id: String(additionalOptionItem.id),
            numberof: '0',
            numberofadults: '0',
            numberofchildren: '0',
            state: 'None',
            travelcardselectedfareid: '0034_3-1'
          } ]
        };

        let extraPutRequest = new ExtraPutRequest(this.trip.id, additionalOptionItemSelections);

        this.analytics.gtmTrackEvent({
          event: 'formSubmit',
          form: 'remove-london-travelcard',
          options: ''
        });

        this.subscriptions.push(this.basketService.putExtra(extraPutRequest).subscribe(() => {}));
      }));
  }

  public onSelectedSleeper(value: string, direction: string) {
    this.sleeperSupplements.forEach((x) => {
      if (x.direction === direction && x.code === value) {
        if (direction === 'O') {
          this.sleeperService.sleeperSelection.outwardSelection = x;
        } else {
          this.sleeperService.sleeperSelection.returnSelection = x;
        }
      }
    });

    if (direction == 'O') {
      this.sleeperOugoingCode = [ String(value) ];
    } else {
      this.sleeperReturnCode = [ String(value) ];
    }

    let sleeperTypes = [ 'XVS', 'XSV', 'XBA', 'XBB', 'XBC', 'XBD', 'XBI', 'XBJ', 'XBK', 'XBL', 'XBH' ];

    if (sleeperTypes.indexOf(value) > -1) {
      this.sleeperOptionSelected = true;
    } else {
      this.sleeperOptionSelected = false;
    }

    this.setSleeperSelectionFlags();
  }

  public continue() {
    if (this.trip.outwardJourneys[0].seatReservationStillNeeded && !this.sleeperOptionSelected) {
      this.uiService.alert('Please make a reservation for outward journey.');
      return;
    } else if (this.trip.returnJourneys.length > 0 && this.trip.returnJourneys[0].seatReservationStillNeeded &&  !this.sleeperOptionSelected) {
      this.uiService.alert('Please make a reservation for return journey.');
      return;
    } else if (this.requiresCustomerDetails) {
      if (!this.sleeperService.sleeperReservation.personTitle || !this.sleeperService.sleeperReservation.firstname ||
        !this.sleeperService.sleeperReservation.surname || !this.sleeperService.sleeperReservation.telephone) {
        this.uiService.alert('Please fill out all in contact information section.');
        return;
      }
    }

    if (this.trip.hasSleepers) {
      let reservationPostRequest = new ReservationPostRequest(this.trip.id);
      reservationPostRequest.reserveoutward = this.trip.outwardJourneys.length > 0;
      reservationPostRequest.reserveinward = this.trip.returnJourneys.length > 0;
      reservationPostRequest.numberOfBicycles = (this.bike) ? this.bike.numberOfBikes : 0;
      reservationPostRequest.title = this.sleeperService.sleeperReservation.personTitle;
      reservationPostRequest.forename = this.sleeperService.sleeperReservation.firstname;
      reservationPostRequest.surname = this.sleeperService.sleeperReservation.surname;
      reservationPostRequest.phoneNumber = this.sleeperService.sleeperReservation.telephone;
      reservationPostRequest.sleeperpreferences = {
        sleeperpreferences: this.sleeperService.sleeperReservation.sleeperPreferences.map((pref) => {
          return {
            bedtype: pref.bedtype,
            gender: pref.gender,
            sharewithfellowtraveller: pref.sharewithfellowtraveller.toString()
          };
        })
      };

      reservationPostRequest.outwardSupplementCodes = this.sleeperOugoingCode;
      reservationPostRequest.inwardSupplementCodes = this.sleeperReturnCode;

      this.basketService.addReservation(reservationPostRequest).toPromise().then((reservationPostResponse: IReservationPostResponse) => {
        NreHelper.removeNreVisualFLag();
        this.router.navigate([ './delivery' ]);
      }).catch((err) => {
        return err;
      });
    } else {
      NreHelper.removeNreVisualFLag();
      this.router.navigate([ './delivery' ]);
    }
  }
  public addAnotherJourney() {
    NreHelper.removeNreVisualFLag();
    if (this.device.isMobile()) {
      this.router.navigate([ '/qtt' ]);
    } else {
      window.location.assign(window.location.origin + '/tickets');
    }
  }

  public setSleeperSelectionFlags() {
    if (!this.sleeperService.sleeperSelection) {
      return;
    }

    this.isSeatSelectionAvailable = this.sleeperService.sleeperSelection.IsOutwardSeatSelectionAvailable() &&
      this.trip.outwardJourneys.length > 0 || this.sleeperService.sleeperSelection.IsReturnSeatSelectionAvailable() &&
      this.trip.returnJourneys.length > 0;
    this.requiresCustomerDetails = this.sleeperService.sleeperSelection.RequiresCustomerDetails();
    this.requiresPreferences = this.sleeperService.sleeperSelection.RequiresPreferences();
  }

  public setSelectedPersonTitleOptions(optionValue: string) {
    this.personTitleOptions.forEach((element) => {
      if (element.label === optionValue) {
        element.selected = true;
        return;
      }
    });
  }

  public mobileCheck() {
    let check = false;
    (function(a, b) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) { check = true; } })(navigator.userAgent || navigator.vendor || (window as any).opera);
    return check;
  }

  public seatSelector() {
    let seatSelectorData = {
      CancelUrl: window.location.href + '/cancelled',
      FailureUrl: window.location.href + '/fail',
      SuccessUrl: window.location.href + '/success',
      TripNo: this.tripno
    };

    let seatSelectorWL = '';
    this.seatSelectorDisabled = true;

    this.subscriptions.push(this.basketService.seatSelectorUrl(seatSelectorData).subscribe(
      (response: any) => {
        seatSelectorWL = response.data.seatmapsurl;

        if (this.mobileCheck()) {
          seatSelectorWL = seatSelectorWL + '&IsWebView=1';
        } else {
          seatSelectorWL;
        }

        this.analytics.gtmTrackEvent({
          'engagement-name': 'handoff-to-seat-selector',
          event: 'engagement',
          options: this.trip.totalCost
        });

        window.location.href = seatSelectorWL;
      }, (err) => {
        this.seatSelectorDisabled = false;
        this.seatSelectorReservationState = 'fail';
      }));
  }

  // check if user is logged in
  public goToSeatSelector() {
    if (this.userService.userAuthenticated()) {
      this.userService.isLoggedIn$.next(true);
      this.seatSelector();
    } else {
      this.userService.isLoggedIn$.next(false);
      this.router.navigate([ '/login', { redirect: this.router.url.substr(1) } ]);
    }
  }

  public journeyDirection(): string {
    let direction: string = 'Single';
    if (this.trip.returnJourneys.length > 0 || this.trip.outwardJourneys[ 0 ][ '_apiResponse' ].tickettypes[ 0 ].journeytype === 'R') {
      direction = 'Return';
    }
    return direction;
  }

  public nreIsSet(): boolean {
    return NreHelper.checkIfNreVisualFlagIsSet() && this.nreCheckForOneJourney;
  }

  public checkIfOneTripForNRE(basket: Basket): void {
    if (basket.trips.length > 1) {
      this.nreCheckForOneJourney = false;
    }
  }

  public showAllDetailsInBasket(): void {
    this.showAllInfoInBasket = !this.showAllInfoInBasket;
  }

  public noOfChanges(outward: boolean): number {
    let legsNo = 0;
    if (outward) {
      legsNo = this.trip.outwardJourneys[ 0 ][ '_apiResponse' ].outwardtimetablejourneys[ 0 ].timetablelegs.length;
    } else {
      legsNo = this.trip.returnJourneys[ 0 ][ '_apiResponse' ].returntimetablejourneys[ 0 ].timetablelegs.length;
    }
    if (legsNo > 1) {
      --legsNo;
    } else {
      legsNo = 0;
    }
    return legsNo;
  }

  public deleteMyTrip(): void {
    this.subscriptions.push(this.uiService.prompt('Remove Trip', 'Are you sure?', [
      { label: 'Yes', value: true },
      { label: 'No', value: false }
    ]).subscribe((val) => {
      if (val === true) {
        this.removeTrip();
      }
      this.removeBasketCookie();
    }));
  }

  public routeTo(): void {
    let qttFirstStage = this.cookieService.get('qttFirstStage');
    if (qttFirstStage == 'mixingDeck' && !this.device.isMobile()) {
      this.routingService.redirectDesktop();
    } else {
      this.routingService.redirectMobile();
    }
  }

  public nreSetup(basket: Basket): void {
    if (basket['_lastApiResponse'] && basket[ '_lastApiResponse' ].nectarpointsearned) {
      for (var i = 0; i < basket[ '_lastApiResponse' ].nectarpointsearned.length; i++) {
        this.nectarPoints += basket[ '_lastApiResponse' ].nectarpointsearned[i].bankedpoints;
      }
    }
    this.checkIfOneTripForNRE(basket);
  }

  public nreNoOfAdults(): number {
    return this.trip.numAdult;
  }

  public nreNoOfChildren(): number {
    return this.trip.numChild;
  }

  private refreshCoreTripData(trip: Trip) {
    this.trip = trip;
    this.plusBuses = this.trip.plusBuses;
    this.legolandBus = this.trip.legolandBus;
    this.oxfordWestgateBus = this.trip.oxfordWestgate;
    this.travelcard = this.trip.travelcard;
    this.bike = this.trip.bike;
    this.inwardSeatmapAvailable = this.trip.inwardseatmapavailable;
    this.outwardSeatmapAvailable = this.trip.outwardseatmapavailable;

    this.reservationDisabled = _.every(this.trip.outwardJourneys[ 0 ].timetableJourneys[ 0 ].legs, { reservable: '_' });

    if (this.trip.returnJourneys.length > 0) {
      this.reservationDisabled = _.every(this.trip.returnJourneys[ 0 ].timetableJourneys[ 0 ].legs, { reservable: '_' }) &&
        _.every(this.trip.outwardJourneys[ 0 ].timetableJourneys[ 0 ].legs, { reservable: '_' });
    }
  }

  private refreshSleeperTripData(trip: Trip) {
    if (trip.hasSleepers) {
      if (!this.sleeperService.sleeperReservation) {
        this.sleeperService.sleeperReservation = {
          firstname: '',
          personTitle: '',
          sleeperPreferences: [],
          surname: '',
          telephone: ''
        };

        _.times(trip.numAdult, (x) => {
          this.sleeperService.sleeperReservation.sleeperPreferences.push({
            bedtype: 'UPPR',
            gender: 'M',
            sharewithfellowtraveller: 'false'
          });
        });
      }
      // sleeper walk on fare
      this.showSleeperMessage = this.checkSleeperMessageToShow();

      // sleeper package
      this.subscriptions.push(this.basketService.fetchSleeperSupplements(new SleeperSupplementGetRequest(trip.id))
        .take(1)
        .subscribe((sleeperSupplementGet: ISleeperSupplementGetResponse) => {
          this.sleeperSupplements = sleeperSupplementGet.sleeperSupplements;
          const cabinCode = 'XFS';
          this.outwardSleeperOptions = [];
          this.returnSleeperOptions = [];
          this.showSleeperMessage = this.checkSleeperMessageToShow();
          this.showContentForRegularSleeper = this.isReturnJourneyExist ?
            this.checkRadioButtonAvailableForOutward() && this.checkRadioButtonAvailableForReturn() :
            this.checkRadioButtonAvailableForOutward();

          sleeperSupplementGet.sleeperSupplements.forEach((x, index) => {
            if (x.isavailable) {
              if (x.direction === 'O' && this.includeChildInSleeper(x.code.toLowerCase())) {
                this.outwardSleeperOptions.push({
                  extra: x.description,
                  label: x.description,
                  layoutClasses: [ 'l-small-extra' ],
                  price: x.cost / 100,
                  selected: this.outwardSleeperOptions.length === 0,
                  value: x.code
                });
              } else if (this.includeChildInSleeper(x.code.toLowerCase())) {
                this.returnSleeperOptions.push({
                  extra: x.description,
                  label: x.description,
                  layoutClasses: [ 'l-small-extra' ],
                  price: x.cost / 100,
                  selected: this.returnSleeperOptions.length === 0,
                  value: x.code
                });
              }
            }
          });
          this.setSleeperSelectionFlags();
          this.sleeperService.setSelectedSleeperOption(this.outwardSleeperOptions, this.returnSleeperOptions);
        }, (err) => {
        }));
    }
  }

  private backToSearchNre(): void {
    this.removeTrip();
    this.removeBasketCookie();
  }

  private removeTrip(): void {
    this.subscriptions.push(this.basketService.removeTrip(1).subscribe((response) => {
      this.analytics.gtmTrackEvent({
        event: 'remove-item'
      });
      this.journeySelectionService.removeTrip(1);
    }));
  }

  private removeBasketCookie(): void {
    this.subscriptions.push(this.basketService.basket$.subscribe((res) => {
      if (res.isEmpty) {
        this.routeTo();
      }
    }));
  }

  private includeChildInSleeper(code: string): boolean {
    if ((this.trip.hasSleepers && this.trip.numChild > 0 && code === 'xfs') || (this.trip.hasSleepers && this.trip.numChild == 0)) {
      return true;
    } else {
      return false;
    }
  }
}
