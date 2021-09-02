import { Component, Inject, Output, EventEmitter } from '@angular/core';
import { CONFIG_TOKEN } from '../../constants';
import * as moment from 'moment';
import * as _ from 'lodash';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { CheapestFareFinderService, ICffJourneySearchResult, IDayFromApiResponse } from '../../services/cheapest-fare-finder.service';
import { SubscriberComponent } from '../../shared/subscriber.component';
import { JourneySearchCriteria } from '../../models/journey-search-criteria';
import { Observable } from 'rxjs/Observable';
import { JourneySelectionService } from '../../services/journey-selection-service';

@Component({
  selector: 'app-cff-date-picker',
  styleUrls: ['cff-date-picker.component.scss'],
  templateUrl: 'cff-date-picker.component.html'
})
export class CffDatePickerComponent extends SubscriberComponent {
  @Output() public selectedDayDateEmitter = new EventEmitter<string>();
  public calendar: IWeek[] = [];
  public selectedMonth$: BehaviorSubject<moment.Moment> = new BehaviorSubject(null);
  public dayHeadings: string[] = [];
  public selectedDayDate: string = null;
  public searchError: string = '';
  private minDate: moment.Moment;
  private maxDate: moment.Moment;
  private searchResults$: BehaviorSubject<IDayFromApiResponse[]> = new BehaviorSubject(null);
  private closestCount: number = 2;
  private resultsForGivenDay: ICffJourneySearchResult[] = [];

  constructor(
    @Inject(CONFIG_TOKEN) protected config: any,
    private cffService: CheapestFareFinderService,
    private journeySelectionService: JourneySelectionService,
  ) {
    super();
    this.selectedDayDateEmitter.next(this.selectedDayDate);
    this.minDate = moment();
    this.maxDate = moment().add(this.config.futureBookingDateMonths, 'months');

    this.createHeadings();

    this.subscriptions.push(
      this.cffService.searchCriteria$.filter(Boolean).subscribe((searchCriteria: JourneySearchCriteria) => {
        // trigger fetch data for month
        if (this.selectedMonth$.value === null || !this.selectedMonth$.value.isSame(searchCriteria.datetimedepart, 'month')) {
          this.selectedMonth$.next(searchCriteria.datetimedepart.startOf('month'));
        }

        // fetch selected day
        if (this.selectedDayDate) {
          this.cffService.getMultiday(
            parseInt(searchCriteria.origin, 10),
            parseInt(searchCriteria.destination, 10),
            moment(this.selectedDayDate),
            searchCriteria.outwardDepartAfter,
            searchCriteria.adults,
            searchCriteria.children,
            this.closestCount
          );
        }
      }),

      this.selectedMonth$.filter(Boolean).subscribe((date: moment.Moment) => this.fetchMonth(date.startOf('month'))),
      this.searchResults$.filter(Boolean).subscribe((results) => this.updateCalendar()),
      this.cffService.searchResults$.subscribe((results: ICffJourneySearchResult[]) => {
        this.setResultsForGivenDay(results);
      })
    );
  }

  public get selectedDate(): string {
    return this.selectedDayDate
      ? moment(this.selectedDayDate).format('ddd D MMM YYYY')
      : this.selectedMonth$.value
        ? this.selectedMonth$.value.format('ddd D MMM YYYY')
        : '';
  }

  public get isNextMonthAvailable(): boolean {
    const selectedMonth = this.selectedMonth$.value.clone();
    return selectedMonth && selectedMonth.add(1, 'month').isBefore(this.maxDate);
  }

  public get isPrevMonthAvailable(): boolean {
    const selectedMonth = this.selectedMonth$.value.clone().endOf('month');
    return selectedMonth && selectedMonth.subtract(1, 'month').isAfter();
  }
  public tapPrevCallback(): () => void {
    return () => this.isPrevMonthAvailable && this.changeMonth('PREV');
  }

  public tapNextCallback(): () => void {
    return () => this.isNextMonthAvailable && this.changeMonth('NEXT');
  }

  public getFlattenCalendar(data: IWeek[], week?: number): ICalendarDay[] {
    const output = [];
    if (week) {
      const monthWeek = this.findWeek(data, week);
      if (monthWeek) {
        output.push(...monthWeek);
      }
    } else {
      data.forEach((monthWeek: IWeek) => output.push(...monthWeek.days));
    }
    return output;
  }

  public amendSelection(): void {
    this.cffService.amendSelection();
  }

  public canDisplayPrice(day: ICalendarDay): boolean {
    return !day.isOtherMonth && !day.isDisabled && day.isEligible;
  }

  public selectDay(day: ICalendarDay): void {
    // unselect selected days
    this.getFlattenCalendar(this.calendar).forEach((calendarDay: ICalendarDay) => (calendarDay.isSelected = false));

    // select current day and wait for animation end
    day.isSelected = true;
    Observable.timer(700)
      .take(1)
      .subscribe(() => {
        this.selectedDayDate = day.date.format();
        this.selectedDayDateEmitter.next(this.selectedDayDate);
        this.updateCalendar();

        const lastSearchCriteria = this.cffService.searchCriteria$.value;
        lastSearchCriteria.datetimedepart = day.date.startOf('day');
        lastSearchCriteria.datetimeReturn = null;
        this.cffService.updateSearch(lastSearchCriteria);
      });
  }

  private changeMonth(event: 'NEXT' | 'PREV'): void {
    const currentMonth = this.selectedMonth$.value.clone();
    this.clearDaySelection();
    this.selectedMonth$.next(event === 'NEXT' ? currentMonth.add(1, 'month') : currentMonth.subtract(1, 'month'));
  }

  private clearDaySelection(): void {
    this.selectedDayDate = null;
    this.cffService.searchResults$.next(null);
  }

  private findWeek(data: IWeek[], week: number): ICalendarDay[] {
    const weekData = data.find((monthWeek: IWeek) => monthWeek.week === week);
    return weekData ? weekData.days : null;
  }

  private updateCalendar(): void {
    this.calendar = this.buildCalendarData(this.selectedMonth$.value.format(), this.searchResults$.value, this.selectedDayDate);
  }

  private buildCalendarData(date: string, cheapestFares: IDayFromApiResponse[], selectedDate: string): IWeek[] {
    const currentDate = moment(date);
    const calendar = Array<IWeek>();

    var currentDateTemp = moment(date);
    var newDate = new Date(currentDateTemp.format('YYYY-MM-DD'));
    var y = newDate.getFullYear();
    var m = newDate.getMonth();
    var firstDay = new Date(y, m, 1);
    var lastDay = new Date(y, m + 1, 0);
    var numberOfFirstDay = firstDay.getDay();
    var numberOfLastDay = lastDay.getDay();
    var daysToSubtract = numberOfFirstDay === 0 ? 6 : (numberOfFirstDay - 1);
    var daysToAdd = numberOfLastDay === 0 ? 0 : (7 - numberOfLastDay);
    var startOfMonth = moment(firstDay);
    var endOfMonth = moment(lastDay);

    firstDay.setDate(firstDay.getDate() - daysToSubtract);
    lastDay.setDate(lastDay.getDate() + daysToAdd);

    var startOfRendering = moment(firstDay);
    var endOfRendering = moment(lastDay);
    var weeksNumberInMonth = [];
    let daysCount = endOfRendering.diff(startOfRendering, 'days');
    let arrDaysTemp = [];

    // days
    for (let i = 0; i <= daysCount; i++) {
      const currentDay = moment(firstDay).add(i, 'day');
      const fare = cheapestFares.find((item) => currentDay.isSame(item.date));

      var obj = {
        day: {
          date: currentDay,
          isCheapestFirst: fare ? fare.ischeapestfirst : false,
          isCheapestStandard: fare ? fare.ischeapeststandard : false,
          isDisabled: Boolean(currentDay.isBefore(moment().startOf('day'))),
          isEligible: fare && fare.iseligible,
          isOtherMonth: Boolean(currentDay.format('YYYYMM') !== currentDate.format('YYYYMM')),
          isPromo: fare ? fare.ispromotional : false,
          isSelected: Boolean(selectedDate && currentDay.isSame(selectedDate)),
          isToday: currentDate.isSame(moment(), 'day'),
          priceCheapest: fare ? fare.pricecheapest : '',
          priceFirst: fare ? fare.cheapestfirst : '',
          priceStandard: fare ? fare.cheapeststandard : ''
        },
        week: Number(currentDay.isoWeek()),
      };

      arrDaysTemp.push(obj);
    }

    // weeks numbers
    for (let day = 0; day < Number(endOfMonth.format('D')); day++) {
      let dayInMonth = currentDateTemp.startOf('month').add(day, 'day');
      weeksNumberInMonth.push(Number(dayInMonth.isoWeek()));
    }
    weeksNumberInMonth = _.uniq(weeksNumberInMonth);

    // merge
    for (let j = 0; j < weeksNumberInMonth.length; j++) {
      let week = weeksNumberInMonth[j];
      let days = [];

      _.map(arrDaysTemp, function(obj) {
        if (obj.week == weeksNumberInMonth[j]) {
          days.push(obj.day);
        }
      });

      calendar.push({ week, days });
    }

    return calendar;
  }

  private fetchMonth(monthMoment: moment.Moment): void {
    const searchCriteria = this.cffService.searchCriteria$.value;
    const params = {
      adults: searchCriteria.adults,
      children: searchCriteria.children,
      datefrom: monthMoment.clone().startOf('month'),
      dateto: monthMoment.clone().endOf('month'),
      destination: parseInt(searchCriteria.destination, 10),
      origin: parseInt(searchCriteria.origin, 10)
    };

    this.cffService
      .getMultidays(params.origin, params.destination, params.datefrom, params.dateto, params.adults, params.children)
      .subscribe((multidaysData: IDayFromApiResponse[] | any) => {
        if (multidaysData.error) {
          this.searchError =  multidaysData.error.errors && multidaysData.error.errors[0] ? multidaysData.error.errors[0] : 'Sorry, there\'s a problem with our system. Please try again';
        } else {
          this.searchResults$.next(multidaysData);
        }
      });
  }

  private createHeadings(): void {
    for (let i = 1; i <= 7; i++) {
      this.dayHeadings.push(
        moment()
          .isoWeekday(i)
          .format('dd')
      );
    }
  }

  private setResultsForGivenDay(results: ICffJourneySearchResult[]): void {
    this.resultsForGivenDay = results;
  }
}

interface ICalendarDay {
  date: moment.Moment;
  isDisabled: boolean;
  isOtherMonth: boolean;
  isSelected: boolean;
  isPromo: boolean;
  isToday: boolean;
  isCheapestStandard: boolean;
  isCheapestFirst: boolean;
  priceStandard: string;
  priceFirst: string;
  priceCheapest: string;
  isEligible: boolean;
}

interface IWeek {
  week: number;
  days: ICalendarDay[];
}
