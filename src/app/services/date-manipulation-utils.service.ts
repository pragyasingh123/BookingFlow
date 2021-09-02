import { Injectable } from '@angular/core';
import * as moment from 'moment';

@Injectable()
class DateManipulationUtils {
  public getShortUkDateForBus(busStringWithDate: string): string {
    // An example of busStringWithDate value: ' Plymouth on Fri, Aug 28th'
    // We have to use date after comma separator -> 'Aug 28th'
    const dateParsingRegex: RegExp = /[A-z]{3}, ([A-z]{3}) (\d{1,2})/;
    const match: RegExpMatchArray|null = busStringWithDate.match(dateParsingRegex);
    let dateFormatted: string = '';
    if (match && match.length > 2) {
      const currentYear: number = moment().year();
      const month: string = match[1];
      const day: string = match[2];
      const dateMoment: moment.Moment = moment(day + ' ' + month + ' ' + currentYear, 'DD MMM YYYY');
      dateFormatted = dateMoment.format('ddd D MMM');
    }
    return dateFormatted;
  }

  public getDuration(startTime: string, endTime: string): string {
    let duration: string = '';
    let minutes: number = moment(endTime).diff(moment(startTime), 'minutes');
    let hours: number = Math.floor(minutes / 60);

    if (hours >= 1) {
      duration += hours + 'h ';
      minutes = minutes - hours * 60;
    }
    return (duration += minutes + 'm');
  }
}
const dateManipulationUtils: DateManipulationUtils = new DateManipulationUtils();
export { dateManipulationUtils };
