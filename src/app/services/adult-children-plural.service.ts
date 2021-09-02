import {Injectable} from '@angular/core';

@Injectable()
export class AdultChildrenPluralService {

  public styleAdultChildDisplay(adults: number, children: number, separator: boolean): string {
    let passengersInfo = this.styleAdult(adults);
    if (children > 0) {
      passengersInfo += separator ? ' | ' : ', ';
      passengersInfo += this.styleChildren(children);
    }

    return passengersInfo;
  }

  public styleAdult(adults: number): string {
    return adults + ' x ' + (adults !== 1 ? 'Adults' : 'Adult');
  }
  public styleChildren(children: number): string {
    return children + ' x ' + (children !== 1 ? 'Children' : 'Child');
  }
}
