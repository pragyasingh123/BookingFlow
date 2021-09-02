import { Injectable } from '@angular/core';
import { ISmartcardsListItem, ISmartcardDropdownItem, IDeliveryItsoOption } from '../services/user.service';
import * as moment from 'moment';
import { Location } from '../models/location';
import { IItsoLocations } from '../models/delivery-option';

@Injectable()

export class ItsoHelper {
  public static itsoEnabledOnUi: boolean = false;

  public static isrnBeautify(isrnNo: string): string {
    const breaksInIsrno: number[] = [ 6, 4, 4, 4 ];
    const start: number = 0;
    const finalCut: number = 3;
    let formattedIsrn: string = '';
    breaksInIsrno.forEach( (stop) => {
      formattedIsrn = formattedIsrn + ' - ' + isrnNo.substring(start, stop);
      isrnNo = isrnNo.substring(stop);
    });
    return formattedIsrn.substring(finalCut);
  }

  public static checkForNumerics(ev: KeyboardEvent): boolean {
    const charCode = (ev.which) ? ev.which : ev.keyCode;
    let keysNumeric: boolean;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      keysNumeric = false;
    } else if (ev.shiftKey === false) {
      keysNumeric = true;
    } else {
      keysNumeric = false;
    }
    return keysNumeric;
  }

  public static setupDropdownArray(smartcradsArray: ISmartcardsListItem[]): ISmartcardDropdownItem[] {
    let smartcardDropdown: ISmartcardDropdownItem[] = [];
    smartcradsArray.forEach( (smartcard: ISmartcardsListItem, index) => {
      if (smartcard.status.toLowerCase() === 'active') {
        const smartcardDropdownItem: ISmartcardDropdownItem = {
          index: 0,
          isrn: '',
          label: '',
          status: ''
        };
        smartcardDropdownItem.index = index;
        smartcardDropdownItem.isrn = smartcard.isrn;
        smartcardDropdownItem.label = ItsoHelper.isrnBeautify(smartcard.isrn);
        smartcardDropdownItem.status = smartcard.status;
        smartcardDropdown.push(smartcardDropdownItem);
      }
    });
    return smartcardDropdown;
  }

  public static createDeliveryOption(
      deliveryOpt: number,
      locationId: string,
      smartcardId: string,
      startOfReservationDate: string,
      tripDepartureDate: moment.Moment): IDeliveryItsoOption {
    const searchMoment: string = this.calculateSmartcardCollectionTime(startOfReservationDate, tripDepartureDate);
    return {
      deliveryoptionid: deliveryOpt,
      itsocollectiondate: searchMoment,
      itsoisrn: smartcardId,
      othercard: false,
      todlocationnlc: locationId
    };
  }

  public static translateItsoLocationToLocationObject(itsoItemLocation: IItsoLocations): Location {
    itsoItemLocation.tod = false;
    return new Location(itsoItemLocation);
  }

  public static itsoSubmitValication(smartcardField: any, location: any, noSmartcardsOnAccount: boolean): string {
    let smartcardText: string;
    let locationText: string;
    let textToDisplay: string = 'Please select ';
    if (smartcardField === null || smartcardField === undefined || smartcardField === '') {
      smartcardText = 'saved Smartcard';
    }
    if (location === undefined) {
      locationText = 'Smartcard location';
    }
    if (smartcardText && locationText) {
      textToDisplay += smartcardText + ' and ' + locationText;
    } else {
      textToDisplay += smartcardText ? smartcardText : locationText;
    }
    if (noSmartcardsOnAccount) {
      textToDisplay = 'Please select different delivery option due to lack of Smartcards on the account.';
    }
    return textToDisplay;
  }

  public static itsoErrorFormMessageHandler(anError: any): string {
    const itsoSmartcardErrorList: string[] = ['10038',
      '10039',
      '10040',
      '10041',
      '10042',
      '10043',
      '10044'];
    let smartcardErrorSpecific: boolean = false;
    let smartcardErrorText: string = 'Sorry, there\'s a problem with our system. Please try again';
    if (anError.errors !== undefined && anError.errors.length > 0) {
      anError.errors.forEach( (errorElem) => {
        smartcardErrorSpecific = itsoSmartcardErrorList.some((errorNoItem) => errorElem.includes(errorNoItem));
      });
    }
    if (smartcardErrorSpecific) {
      smartcardErrorText = 'The Touch Smartcard you have chosen has failed. ' +
      'Please enter another smartcard number or pick an alternative fulfillment method.';
    }
    return smartcardErrorText;
  }

  public static wasUserRedirectedFromDeliveryItsoStep(redirectUri: string): boolean {
    return this.itsoEnabledOnUi && redirectUri.indexOf('delivery') !== -1 ? true : false;
  }

  private static calculateSmartcardCollectionTime(startOfReservationDate: string, tripDepartureDate: moment.Moment): string {
    const dateTimeWLTemplate = 'YYYY-MM-DDTHH:mm:ss';
    let searchMoment = moment(startOfReservationDate).add(2, 'hours');
    searchMoment = searchMoment.add(45, 'minutes');
    const departureTime: moment.Moment = moment(tripDepartureDate.format(dateTimeWLTemplate));
    if (searchMoment.isAfter(departureTime)) {
      searchMoment = departureTime;
    }
    return searchMoment.format(dateTimeWLTemplate);
  }
}
