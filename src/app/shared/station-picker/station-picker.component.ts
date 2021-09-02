import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild, NgZone } from '@angular/core';
import { ISelectOption } from '../select/select.component';
import * as _ from 'lodash';
import { LocationService } from '../../services/locations.service';
import { ReplaySubject, Observable, Subject, BehaviorSubject } from 'rxjs';
import { Location } from '../../models/location';
import { GtmHelperService } from '../../services/gtm-helper.service';

@Component({
  selector: 'app-station-picker',
  styleUrls: ['station-picker.component.scss'],
  templateUrl: 'station-picker.component.html'
})
export class StationPickerComponent implements OnInit, OnChanges {
  @Input() public defaultLabel: string = 'Select station...';
  @Input() public value: string|number;
  @Input() public disabled: boolean;
  @Input() public isfilterByTOD: boolean = false;
  @Input() public amend: boolean;
  @Input() public id: string;
  @Output() public onSelected: EventEmitter<ISelectOption> = new EventEmitter<ISelectOption>();
  @ViewChild('inputElement') public inputElement: { nativeElement: any };
  @ViewChild('searchResultPanel') public searchResultPanel: { nativeElement: any };

  public valueStream$: ReplaySubject<any>;
  public keyStream$: Subject<KeyboardEvent>;
  public searchQueryStream$: Subject<string>;
  public locationSearchResults$: Observable<any>;
  public location: Location;
  public isFocussed: boolean = false;
  public userInput: string;
  public searchLabel: string;
  public highlightIndex: number;
  public verticalArrowKeys: string[] = ['ArrowUp', 'ArrowDown', 'Up', 'Down'];
  public totalSearchResultsDisplaying: number = 0;
  public mousedownStarted: boolean = false;
  public searchSnapshot: Location[] = [];

  constructor(public locationService: LocationService,
              private ngZone: NgZone,
              private gtmHelperService: GtmHelperService) {
    this.keyStream$ = new Subject<KeyboardEvent>();
    this.searchQueryStream$ = new Subject<string>();

    // Search results are basically the result of a popular stations observable or a search observable
    this.locationSearchResults$ = this.searchQueryStream$.distinctUntilChanged().flatMap<any>((query: string) => {
      if (query) {
        this.searchLabel = 'Search results';
        return this.locationService.search(query, this.isfilterByTOD);
      } else {
        this.searchLabel = 'Popular stations';
        return this.locationService.fetchRecommended();
      }
    }).do((results: Location[]) => {
      // On each result, keep track of total results showing
      this.totalSearchResultsDisplaying = results.length;
      // Reset the highlight after every search
      this.setHighlight(-1);
      this.searchSnapshot = results;
    });

    // Up/Down arrows to highlight
    this.keyStream$.filter((event: KeyboardEvent) => _.includes(this.verticalArrowKeys, event.key)).subscribe((event: KeyboardEvent) => {
      var h;

      if (event.key === 'ArrowDown' || event.key === 'Down') {
        h = this.highlightIndex + 1;
        if (h >= this.totalSearchResultsDisplaying) {
          this.setHighlight(this.totalSearchResultsDisplaying - 1);
        } else {
          this.setHighlight(h);
        }
        return;
      }
      if (event.key === 'ArrowUp' || event.key === 'Up') {
        h = this.highlightIndex - 1;
        if (h < -1) {
          this.setHighlight(-1);
        } else {
          this.setHighlight(h);
        }
        return;
      }
    });

    // Enter key
    this.keyStream$.filter((event: KeyboardEvent) => event.key === 'Enter').subscribe((e: KeyboardEvent) => {
      e.preventDefault();

      // If no item highlighted, but something searched, pick the first result
      if (this.highlightIndex < 0 && this.searchSnapshot.length > 0 && this.userInput) {
        this.setHighlight(0);
        setTimeout(() => this.selectLocation(this.searchSnapshot[0]), 200);
        return;
      }

      // If highlighted, pick it out of the snapshot;
      if (this.searchSnapshot[this.highlightIndex]) {
        return this.selectLocation(this.searchSnapshot[this.highlightIndex]);
      }
    });

    this.valueStream$ = new ReplaySubject(1);
    this.valueStream$.flatMap((value) => this.locationService.findOne({id: String(value)})).subscribe((location: Location) => {
      if ((location && !this.isfilterByTOD) || (location && this.isfilterByTOD && location.tod)) {
        this.location = location;
        this.value = location.id;
      }
      if (location && this.isfilterByTOD && !location.tod) {
        this.onSelected.emit(null);
      }
    });

    this.valueStream$.distinctUntilChanged().subscribe((value) => {
      this.onSelected.emit(value);
    });
  }

  public collapseDropdown(): void {
    // Need to wait before setting focus to false since a user may have clicked on an option
    // and a click event could take up to 300ms to fire.
    setTimeout(() => {
      this.isFocussed = false;
      this.mousedownStarted = false;
    }, this.mousedownStarted ? 301 : 0);
  }

  public ngOnChanges(changes: any): void {
    if (changes['value']) {
      this.valueStream$.next(changes['value'].currentValue);
      this.gtmHelperService.pushNewFieldValue(this.id, changes['value'].currentValue);
    }
  }

  public onFocusClick(a: any): void {
    if (this.amend) { return; }
    this.isFocussed = true;
    this.userInput = '';
    this.searchQueryStream$.next('');
    this.gtmHelperService.saveFieldValue(this.id, this.value);

    // Give ngIf a chance to render the <input>.
    // Then set the focus, but do this outside the Angular zone to be efficient.
    // There is no need to run change detection after setTimeout() runs,
    // since we're only focusing an element.
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => this.inputElement.nativeElement.focus(), 10);
    });
  }

  public onKeyup(e: KeyboardEvent): void {
    this.keyStream$.next(e);
    this.searchQueryStream$.next(this.userInput);
  }

  public onMouseDown(): void {
    this.mousedownStarted = true;
  }

  public onComponentFocus(): void {
    if (this.amend) { return; }
    this.onFocusClick({});
  }

  public ngOnInit(): void {
    this.setHighlight(0);
    this.valueStream$.next(this.value);
  }

  public selectLocation(location: Location): void {
    this.location = location;
    this.value = location.id;
    this.valueStream$.next(this.value);
    this.isFocussed = false;
  }

  private setHighlight(index: number): void {
    this.highlightIndex = index;

    if (this.searchSnapshot.length === 0 || this.highlightIndex < 0) {
      this.searchResultPanel.nativeElement.scrollTop = 0;
      return;
    }

    // Set search result box scroll position
    let searchItem = this.searchResultPanel.nativeElement.querySelectorAll('.search-result-item')[this.highlightIndex];
    let itemOffset = searchItem.offsetTop;
    let itemHeight = searchItem.offsetHeight;
    let scrollOffset = this.searchResultPanel.nativeElement.scrollTop;
    let searchPanelHeight = this.searchResultPanel.nativeElement.offsetHeight;

    if (itemOffset < scrollOffset) {
      this.searchResultPanel.nativeElement.scrollTop = itemOffset;
    }

    if ((itemOffset + itemHeight) > (scrollOffset + searchPanelHeight)) {
      this.searchResultPanel.nativeElement.scrollTop = itemOffset + itemHeight - searchPanelHeight;
    }
  }
}
