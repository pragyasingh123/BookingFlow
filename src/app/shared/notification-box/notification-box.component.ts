import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { JourneySelectionService } from '../../services/journey-selection-service';
import { JourneySearchCriteria } from './../../models/journey-search-criteria';
import { Observable } from 'rxjs/Observable';
import { JourneyService } from '../../services/journey.service';

@Component({
  selector: 'app-notification-box',
  styleUrls: ['notification-box.component.scss'],
  templateUrl: 'notification-box.component.html'
})
export class NotificationBoxComponent {

  @Input() public message: string;
  @Input() public type: string;
  @Input() public icon: string;
  @Input() public btnLinkType?: string;
  @Input() public btnLinkCopy?: string;
  @Input() public btnLink?: string;
  private searchCriteria$: Observable<JourneySearchCriteria>;
  private lastSearchCriteria: JourneySearchCriteria;

  constructor(
    private router?: Router,
    private journeyService?: JourneyService,
    private journeySelectionService?: JourneySelectionService
  ) {
    this.searchCriteria$ = this.journeyService.searchCriteria$.asObservable();
    this.searchCriteria$.subscribe((searchCriteria: JourneySearchCriteria) => this.lastSearchCriteria = searchCriteria);
  }

  public amendSearch(): void {
    this.router.navigate(['/qtt', this.journeySelectionService.amendSearchParams(this.lastSearchCriteria)]);
  }
}
