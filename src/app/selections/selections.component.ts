import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { ActivatedRoute, Router} from '@angular/router';
import { RequestOptionsArgs, Response, URLSearchParams } from '@angular/http';
import { Title } from '@angular/platform-browser';
import { Subscription } from 'rxjs/Rx';
import { BasketService } from '../services/basket.service';
import { Basket } from '../models/basket';
import { Trip, ITripFares } from '../models/trip';
import { LoadingIndicatorComponent } from '../shared/loading-indicator/loading-indicator.component';
import { UiService } from '../services/ui.service';
import { RetailhubApiService } from '../services/retailhub-api.service';
import { JourneySelectionService } from '../services/journey-selection-service';
import { Analytics } from '../services/analytics.service';
import { SleeperService } from '../services/sleeper.service';
import { BasketContinueButtonService } from '../services/basket-continue-button.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-selections',
  styleUrls: ['selections.component.scss'],
  templateUrl: 'selections.component.html'
})
export class SelectionsComponent implements OnInit, OnDestroy {
  private basketSub: Subscription;
  private tripSub: Subscription;
  private paramsSub: Subscription;
  private basket: Basket;
  private trip: Trip;
  private firstClassAvailable: boolean = true;
  private ticketIsFirstClass: boolean = false;
  private firstClassSinglesAvailable: boolean = false;
  private disableSelection: boolean = false;
  private tripNotFound: boolean = false;
  private changeOfJourney: boolean = false;
  private firstClassTicket: object[] = [];
  private otherTicketOptions: object[] = [];
  private singleReturns: object[] = [];
  private nectarPts: number;
  private adminFeePrice: string | number;
  private selectedServiceResult: any;
  private tripnumber: number;
  private showSleeperNotification: boolean = false;
  private showCheapestNotification: boolean = false;

  constructor(private basketService: BasketService,
              private route: ActivatedRoute,
              private router: Router,
              private _retailHubApi: RetailhubApiService,
              private journeySelectionService: JourneySelectionService,
              private uiService: UiService,
              private titleService: Title,
              private analytics: Analytics,
              private sleeperService: SleeperService,
              private basketContinueButtonService: BasketContinueButtonService) {}

  public ngOnInit(): void {
    this.titleService.setTitle('Your tickets');
    this.analytics.trackPage(this.titleService.getTitle());
    this.showSleeperNotification = this.sleeperService.isOutwardSleeper || this.sleeperService.isReturnSleeper;
    let selectedOtherTicket = JSON.parse(localStorage.getItem('CheapestNotification'));

    if (selectedOtherTicket) {
      this.showCheapestNotification = false;
    } else {
      this.showCheapestNotification = true;
    }

    this.basketSub = this.basketService.basket$.subscribe((basket: Basket) => {
      this.basket = basket;
      this.nectarPts = this.basket.loyaltyPoints;
      this.changeOfJourney = this.basket.ischangeofjourney;
      this.adminFeePrice = this.basket.amendFee;

      this.paramsSub = this.route.params.subscribe((params) => {
        if (Number(params['trip']) > this.basketService.totalTrips() && this.basketService.totalTrips() > 0) {
          this.tripnumber = this.basketService.totalTrips();
        } else {
          this.tripnumber = Number(params['trip']);
        }
        this.getTrip(this.tripnumber);
      });
    });

    this.basketContinueButtonService.change.subscribe((response) => {
      if (response === true) {
        const event = new Event('click');
        this.continueJourney(event, this.trip.id);
      }
    });
  }

  public getTrip(tripnumber: any): void {
     this.tripSub = this.basketService.findTrip(tripnumber).subscribe((trip: Trip) => {
      this.trip = trip;
      this.selectedServiceResult = this.journeySelectionService.getTrip(this.tripnumber);
      this.getOtherFares(this.selectedServiceResult);
    }, (err) => {
      this.router.navigate(['/qtt']);
    });
  }

  public cancelAmend(): void {
    this.basketService.cancelAmendBooking().subscribe((response) => {
      this.basketService.routeToMyAccount();
    }, (err) => {
      throw err;
    });
  }

  public getOtherFares(fares: any): void {
    if (fares == null) { return; }

    this.firstClassTicket = fares.otherTickets.outboundFirstClass !== null ? fares.otherTickets.outboundFirstClass : fares.otherTickets.returnFirstClass;
    this.otherTicketOptions = fares.otherTickets.outboundStandard !== null ? fares.otherTickets.outboundStandard : fares.otherTickets.returnStandard;

    if (fares.otherTickets.singleReturns !== null) {
      this.singleReturns = fares.otherTickets.singleReturns;
    }

    if (this.selectedServiceResult.selectedService && this.selectedServiceResult.selectedService.returnfaregroup) {
      this.firstClassTicket = _.concat(this.firstClassTicket, _.concat(fares.otherTickets.outboundSingleFirstClass, fares.otherTickets.returnBoundSingleFirstClass));
      this.firstClassSinglesAvailable = true;
    }
  }

  public selectOtherTicket(ticket: any): void {
    if (this.disableSelection) { return; }

    this.disableSelection = true;
    ticket.showLoadingState = true;

    let selectedService;

    if (ticket.returnFare) {
      // return singles ticket
      selectedService = {
        outwardfaregroup: ticket.outgoingFare.faregroupid,
        outwardserviceid: this.selectedServiceResult.selectedService.outwardserviceid,
        returnServiceId: this.selectedServiceResult.selectedService.returnServiceId,
        returnfaregroup: ticket.returnFare.faregroupid
      };
    }

    if (this.selectedServiceResult.selectedService.returnServiceId && ticket.isreturn) {
      // return ticket
      selectedService = {
        outwardfaregroup: ticket.faregroupid,
        outwardserviceid: this.selectedServiceResult.selectedService.outwardserviceid,
        returnServiceId: this.selectedServiceResult.selectedService.returnServiceId
      };

       this.firstClassSinglesAvailable = false;
    }

    if (!this.selectedServiceResult.selectedService.returnServiceId && !ticket.isreturn || this.selectedServiceResult.isOpenReturn) {
      // single ticket or  open returns
      selectedService = {
        outwardfaregroup: ticket.faregroupid,
        outwardserviceid: this.selectedServiceResult.selectedService.outwardserviceid
      };
    }

    // first class single upgrade
    if (this.selectedServiceResult.selectedService.returnServiceId && ticket.class == '1' && this.firstClassSinglesAvailable) {
      if (ticket.cost.isreturn) {
        selectedService = {
          outwardfaregroup: this.selectedServiceResult.selectedService.outwardfaregroup,
          outwardserviceid: this.selectedServiceResult.selectedService.outwardserviceid,
          returnServiceId: this.selectedServiceResult.selectedService.returnServiceId,
          returnfaregroup: ticket.faregroupid
        };
      } else {
         selectedService = {
          outwardfaregroup: ticket.faregroupid,
          outwardserviceid: this.selectedServiceResult.selectedService.outwardserviceid,
          returnServiceId: this.selectedServiceResult.selectedService.returnServiceId,
          returnfaregroup: this.selectedServiceResult.selectedService.returnfaregroup
        };
      }
    }

    this.showSleeperNotification = false;
    this.showCheapestNotification = false;
    localStorage.setItem('CheapestNotification', 'true');

    this.basketService.updateTrip(this.tripnumber, selectedService).subscribe((data: any) => {
      this.tripnumber = data.tripno;
      ticket.showLoadingState = false;
      this.disableSelection = false;
      this.analyticsTrack(ticket);
    }, (err) => {
      this.journeySelectionService.removeTrip(this.tripnumber);
      this.router.navigate(['/qtt']);
      this.uiService.error("Sorry, there's a problem with our system. Please try booking your journey again.");
      this.basketService.refresh();
    }, () => {
      this.router.navigate(['/selections', { trip: this.tripnumber }]);
      this.saveTripJourney(this.tripnumber, selectedService);
    });
  }

  public saveTripJourney(tripno: any, selectedService: any): void {
    this.journeySelectionService.addTrip({
      isOpenReturn: this.selectedServiceResult.isOpenReturn ? this.selectedServiceResult.isOpenReturn : false,
      searchResults: this.selectedServiceResult.searchResults,
      selectedService,
      tripNo: tripno
    });
  }

  public continueJourney(event: any, tripId: any): void {
    event.preventDefault();
    this.router.navigate(['/seats-and-extras', tripId]);
  }

  public ngOnDestroy(): void {
    this.basketSub.unsubscribe();
    this.tripSub.unsubscribe();
    this.paramsSub.unsubscribe();
  }

  public analyticsTrack(ticket: any): void {
    if (ticket.class == '1') {
      let increment = ticket.cost.totalfare > this.trip.totalCostPence ? 'UP' : 'DOWN';

      this.analytics.gtmTrackEvent({
        event: 'first-class-upgrade-click',
        options: `${increment}:${this.trip.totalCostPence}:${ticket.cost.totalfare}:${Math.abs(ticket.cost.totalfare - this.trip.totalCostPence)}`
      });

    } else {
      let oldTicketType = _.map(this.trip.ticketTypes, (fare) => fare.description);
      let newTicketType = ticket.totalCost ? (`${ticket.outgoingFare.faregroupname},${ticket.returnFare.faregroupname}`) : ticket.faregroupname;
      let oldPrice = this.trip.totalCostPence;
      let newPrice = ticket.totalCost ? ticket.totalCost : ticket.cost.totalfare;

      this.analytics.gtmTrackEvent({
        event: 'add-item',
        options: `${oldTicketType}:${newTicketType}:${oldPrice}:${newPrice}:${Math.abs(oldPrice - newPrice)}`
      });
    }
  }
}
