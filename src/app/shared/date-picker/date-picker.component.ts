import { Component, OnInit, Input, Output, EventEmitter, Inject, OnChanges } from '@angular/core';
import * as moment from 'moment';
import { Subject, Observable, BehaviorSubject } from 'rxjs/Rx';
import { CONFIG_TOKEN } from '../../constants';
import { GtmHelperService } from '../../services/gtm-helper.service';

@Component({
  selector: 'app-date-picker',
  styleUrls: ['date-picker.component.scss'],
  templateUrl: 'date-picker.component.html'
})
export class DatePickerComponent implements OnInit, OnChanges {
  // Observables
  public open$: BehaviorSubject<boolean>;
  public selected$: BehaviorSubject<moment.Moment>;
  public viewMonthClick$: Subject<moment.Moment>;
  public viewMonth$: Observable<moment.Moment>;
  public visibleMonthData$: Observable<IMonthDayData<IMonthDayDataItem>>;

  // Properties
  public today: moment.Moment;
  public labelFormat: string = 'ddd D MMM YYYY';
  public dayHeadings: string[] = [];
  public visibleMonth: moment.Moment;
  public previousAllowed: boolean = true;
  public nextAllowed: boolean = true;
  public currentDay: moment.Moment = moment();

  @Input() public date: moment.Moment;
  @Input() public minDate: moment.Moment;
  @Input() public maxDate: moment.Moment;
  @Input() public id: string = '';

  @Output() public onChange: EventEmitter<moment.Moment> = new EventEmitter<moment.Moment>();

  constructor(@Inject(CONFIG_TOKEN) protected config?: any, private gtmHelperService?: GtmHelperService) {
    this.today = this.date || moment();

    // Default minDate
    this.minDate = this.today.clone();

    // Default maxDate
    this.maxDate = this.today.clone().add(this.config.futureBookingDateMonths, 'months');
    // Open/close stream
    this.open$ = new BehaviorSubject(false);

    // Create day headings
    var day = this.today.clone();
    for (let i = 1; i <= 7; i++) {
      this.dayHeadings.push(day.isoWeekday(i).format('dd'));
    }

    // Create a selected day stream. Default to today
    this.selected$ = new BehaviorSubject(this.minDate || this.today.clone());

    // Record the selected day as it changes (so we can use it easily to determine the selected day
    // when looping the the days to generate the month day data
    this.selected$.subscribe((day: moment.Moment) => {
      this.today = day;
      this.onChange.emit(this.today);
    });

    // Create a stream for when a month should be viewed.
    this.viewMonthClick$ = new Subject<moment.Moment>();

    // Merge the selected date with the show month clicks. This represents the month currently rendered to the user.
    this.viewMonth$ = this.selected$.merge<moment.Moment>(this.viewMonthClick$);

    // Use the combined selected date and show month click stream and turn it into the month data to
    // render in the view
    this.visibleMonthData$ = this.viewMonth$
      .do((visibleMonth: moment.Moment) => {
        this.visibleMonth = visibleMonth;
      })
      .map((month: moment.Moment) => this.getMonthDayData(month));
  }

  public ngOnChanges(changes: any): void {
    if (changes.date) {
      if (!changes.date.currentValue.isSame(changes.date.previousValue, 'day')) {
        this.selectDay(moment(changes.date.currentValue));
      }

      if (this.id && this.id.length > 0) {
        if (moment.isMoment(moment(changes.date.currentValue))) {
          this.gtmHelperService.pushNewFieldValue(this.id, changes.date.currentValue.format('YYYYMMDD'));
        }
      }
    }

    if (changes.minDate) {
      if (changes.minDate.currentValue) {
        let newMinDate = moment(changes.minDate.currentValue);
        this.minDate = newMinDate;

        if (this.date.isBefore(newMinDate, 'day')) {
          this.selectDay(newMinDate);
        } else {
          this.selectDay(this.date);
        }
      }
    }
  }

  public ngOnInit(): void {}

  public viewNextMonthButton(): boolean {
    if (this.visibleMonth.clone().add(1, 'month').isAfter(this.maxDate, 'month')) {
      return true;
    } else { return false; }
  }

  public viewPrevMonthButton(): boolean {
    if (this.visibleMonth.clone().isAfter(this.currentDay, 'month')) {
      return false;
    } else { return true; }
  }

  public viewCurrentMonth(): void {
    this.viewMonth(this.today.clone());
  }

  public viewNextMonth(): void {
    this.viewMonth(this.visibleMonth.clone().add(1, 'month'));
    this.viewNextMonthButton();
  }

  public viewPreviousMonth(): void {
    this.viewMonth(this.visibleMonth.clone().subtract(1, 'month'));
    this.viewPrevMonthButton();
  }

  public viewMonth(month: moment.Moment): void {
    this.viewMonthClick$.next(month);
  }

  public selectDay(day: moment.Moment): void {
    this.selected$.next(day);
  }

  public dayClick(day: moment.Moment): void {
    this.selectDay(day);
    setTimeout(() => {
      this.closePanel();
    }, 300);
  }

  public closePanel(): void {
    this.open$.next(false);
  }

  public openPanel(e: any): void {
    if (e.keyCode == 27) {
      this.open$.next(false);
    } else if (e.keyCode == 9 && e.target.nodeName == 'BUTTON') {
      this.open$.next(false);
    } else {
      this.open$.next(true);
    }

    if (this.id && this.id.length > 0) {
      if (moment.isMoment(moment(this.date))) {
        this.gtmHelperService.saveFieldValue(this.id, this.date.format('YYYYMMDD'));
      }
    }
  }

  public getMonthDayData(monthMoment: moment.Moment): IMonthDayData<IMonthDayDataItem> {
    // Start of the month moment
    var startMonth = monthMoment.clone().date(1).hour(0).minute(1);
    var startDate = startMonth.clone().isoWeekday(1);
    var endMonth = startMonth.clone().add(1, 'month').subtract(1, 'hour').minute(59);
    var endDate = endMonth.clone().isoWeekday(7);
    var currentMoment = startDate.clone();
    var month = [];
    var currentWeek = 0;
    var dayCount = 0;

    do {
      if (!month[currentWeek]) {
        month[currentWeek] = [];
      }

      month[currentWeek].push({
        isAfterMinDate: currentMoment.isAfter(this.maxDate, 'day'),
        isBeforeMinDate: currentMoment.isBefore(this.minDate, 'day'),
        isCurrentMonth: currentMoment.isSame(startMonth, 'month'),
        isSelected: currentMoment.isSame(this.today, 'day'),
        isToday: currentMoment.isSame(this.today, 'day'),
        moment: currentMoment.clone()
      });

      currentMoment = currentMoment.add(1, 'day');
      dayCount++;

      if (dayCount === 7) {
        dayCount = 0;
        currentWeek++;
      }
    } while (currentMoment.isBefore(endDate));
    return month;
  }
}

export interface IMonthDayData<T> {
  [index: number]: {
    [index: number]: T;
  };
}

export interface IMonthDayDataItem {
  isBeforeMinDate: boolean;
  isSelected: boolean;
  isToday: boolean;
  isCurrentMonth: boolean;
  moment: moment.Moment;
}
