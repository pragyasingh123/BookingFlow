import { Component, Input, OnChanges } from '@angular/core';
import { Router } from '@angular/router';
import { JourneySelectionService } from '../../../services/journey-selection-service';
import { BasketService } from '../../../services/basket.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { ICffJourneySearchResult, CheapestFareFinderService, IAvailableServiceResponse, } from '../../../services/cheapest-fare-finder.service';

@Component({
  selector: 'app-cff-ticket-picker',
  styleUrls: [ './cff-ticket-picker.scss' ],
  templateUrl: './cff-ticket-picker.html',
})
export class CffTicketPickerComponent implements OnChanges {
  @Input() public searchResults: ICffJourneySearchResult[];
  @Input() public closestCount: number = 2;
  public showMobileToast: boolean = false;
  public currentPage: number = 0;
  public visibleResults: ICffJourneySearchResult[] = [];
  public searchError: string = '';
  public showRouteDetails: boolean = false;
  public routeDetailsParams$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  private isWaitingForAvailabilityCheck: boolean = false;
  private resultsPerPage: number = 7;

  constructor(
    private cffService: CheapestFareFinderService,
    private router: Router,
    private journeySelectionService: JourneySelectionService,
    private basketService: BasketService
  ) {

  }

  public ngOnChanges(): void {
    this.updateVisibleResults();
  }

  public get showAll(): boolean {
    return this.currentPage !== 0;
  }

  public set showAll(state: boolean) {
    this.currentPage = 1;
    this.updateVisibleResults();
  }

  public showAllFares($event: MouseEvent): void {
    $event.preventDefault();
    this.cffService.toggleFares('all');
  }

  public hideMobileToast(): void {
    this.showMobileToast = false;
    this.clearSelection();
  }

  public selectFare(journey: ICffJourneySearchResult, fare: 'first' | 'standard'): void {
    if (!this.isWaitingForAvailabilityCheck) {
      this.isWaitingForAvailabilityCheck = true;
      const setUnavailable = (selectedFare) => {
        selectedFare.isAvailable = false;
        Observable.timer(2000)
          .take(1)
          .subscribe(() => {
            this.isWaitingForAvailabilityCheck = false;
            selectedFare.selected = false;
            selectedFare.isSoldOut = true;
            selectedFare.isAvailable = undefined;
          });
      };

      // hide mobile toast and clear all selections
      this.hideMobileToast();
      // select fare
      journey[ fare ].selected = true;
      // reset fare availability
      journey[ fare ].isAvailable = null;

      this.cffService.findAvailableTicket(journey, fare === 'first').subscribe(
        (availableServiceResponse: IAvailableServiceResponse) => {
          journey[ fare ].isAvailable = Boolean(availableServiceResponse);
          if (journey[ fare ].isAvailable) {
            this.basketService.addServiceToBasket(availableServiceResponse.service).subscribe(
              (tripno) => {
                this.isWaitingForAvailabilityCheck = false;
                this.saveJourney(tripno, availableServiceResponse.service, availableServiceResponse.searchResults);
                this.continueJourney(tripno);
              },
              (error) => setUnavailable(journey[ fare ])
            );
          } else {
            setUnavailable(journey[ fare ]);
            this.showMobileToast = true;
          }
        },
        (error) => setUnavailable(journey[ fare ])
      );
    }
  }

  public get isPrevPageAvailable(): boolean {
    return this.currentPage > 1;
  }

  public get isNextPageAvailable(): boolean {
    return this.currentPage !== 0 && this.searchResults.length - this.currentPage * this.resultsPerPage > 0;
  }

  public closeRouteDetails(): void {
    this.routeDetailsParams$.next(null);
    this.showRouteDetails = false;
  }

  public showNextPage(): void {
    this.updateVisibleResults(this.currentPage + 1);
  }

  public showPrevPage(): void {
    this.updateVisibleResults(this.currentPage - 1);
  }

  private updateVisibleResults(page?: number): void {
    if (this.searchResults) {
      if (page !== undefined) {
        this.currentPage = page;
      }

      // the UI is showing only 7 results
      this.visibleResults =
        this.currentPage === 0
          ? this.searchResults
          : [ ...this.searchResults ].splice((this.currentPage - 1) * this.resultsPerPage, this.resultsPerPage);
    }
  }

  private clearSelection(): void {
    this.searchResults.forEach((serviceData: ICffJourneySearchResult) => {
      serviceData.first.selected = false;
      serviceData.standard.selected = false;
    });
  }

  private saveJourney(tripNo, selectedService, searchResults): void {
    this.journeySelectionService.addTrip({
      searchResults,
      selectedService,
      tripNo
    });
  }

  private continueJourney(tripno: number): void {
    if (this.basketService.isBasketRefreshing$.value) {
      this.router.navigate([ '/selections', { trip: tripno } ]);
    }
  }

  private handleError(message: string = 'The system error occurred.'): void {
    this.searchError = message;
    this.showMobileToast = true;
  }
}
