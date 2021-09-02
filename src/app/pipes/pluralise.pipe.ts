import { Pipe, PipeTransform } from '@angular/core';
/*
 * Returns plural/singular form of noun according to number
 * Useful for UI messages based on a numeric value
 *
 * Usage:
 *   noun | pluralise(:num)
 *
 * Example:
 *   {{ "point" | pluralise(2) }}
 *   formats to: "points"
 */
@Pipe({name: 'pluralise'})

export class PluralisePipe implements PipeTransform {
  public transform(value: string, num: number): string {
    let noun = value;
    let suffix = num > 1 ? 's' : ''; // pluralise

    if (noun.toLowerCase() === 'change' && num === 0) {
      return 'Direct';
    } else if (noun.toLowerCase() === 'child' && num > 1) {
      return noun[0] + 'hildren'; // return same first letter case
    } else {
      return noun + suffix;
    }
  }
}
