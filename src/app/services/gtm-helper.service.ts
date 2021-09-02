import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import * as moment from 'moment';
import { JourneySearchCriteria } from '../models/journey-search-criteria';
import { JourneySelectionService } from '../services/journey-selection-service';
import { Analytics } from './analytics.service';

@Injectable()
export class GtmHelperService {
  public searchCriteria: JourneySearchCriteria;
  public isAboutToPush: Subject<any> = new Subject();
  private isInitialised: boolean = false;
  private hasEngagedWithQtt: boolean = false;
  private savedFieldName: string;
  private savedFieldValue: any;
  private momentLastFieldChange: moment.Moment;
  private qttAttr: IQttAttr;

  constructor(private journeySelectionService: JourneySelectionService, private analytics: Analytics) {
    this.qttAttr = {
      qttReference: '',
      qttType: 'bookingFlow'
    };
    this.momentLastFieldChange = moment();
  }

  public pushEvent(options: object = {}, searchCriteria?: any): void {
    let searchCriteriaCopy;

    if (!searchCriteria) {
      this.isAboutToPush.next('true');
      if (this.searchCriteria) {
        searchCriteriaCopy = Object.assign({}, this.searchCriteria);
      }
    } else {
      searchCriteriaCopy = Object.assign({}, searchCriteria);
    }

    if (searchCriteriaCopy) {
      searchCriteriaCopy.datetimedepart = this.formatMomentObject(searchCriteriaCopy.datetimedepart);
      searchCriteriaCopy.datetimeReturn = this.formatMomentObject(searchCriteriaCopy.datetimeReturn);

      let dataLayerObject: any = Object.assign({
        qttJourneySearchParameters: searchCriteriaCopy,
        qttJourneySearchParametersJson: JSON.stringify(searchCriteriaCopy),
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
      }, this.qttAttr, options);

      this.analytics.gtmTrackEvent(dataLayerObject);
    }
  }

  public saveFieldValue(capturedFieldName: string, capturedFieldValue: any = ''): void {
    if (capturedFieldName && capturedFieldName.startsWith('qtt_')) {
      this.savedFieldName = capturedFieldName;
      this.savedFieldValue = capturedFieldValue;
      this.hasEngagedWithQtt = true;
    }
  }

  public pushNewFieldValue(capturedFieldName: string, capturedFieldValue: any = ''): void {
    let now: moment.Moment = moment();
    let isInstantFieldChange: boolean = now.diff(this.momentLastFieldChange, 'milliseconds') <= 500;

    if ((this.hasEngagedWithQtt && !isInstantFieldChange && capturedFieldName === this.savedFieldName) || capturedFieldName === 'qtt_Submit') {
      const fieldChangeObj = {
        'field-name': capturedFieldName,
        'new-value': capturedFieldValue,
        'old-value': this.savedFieldValue
      };

      this.pushEvent({
          event: 'qttFieldChange',
          qttFieldChange: fieldChangeObj,
          qttFieldChangeJson: JSON.stringify(fieldChangeObj)
        }
      );
      this.momentLastFieldChange = now;
    }
  }

  public registerClickEvent(id: string): void {
    let now: moment.Moment = moment();
    let isInstantFieldChange: boolean = now.diff(this.momentLastFieldChange, 'milliseconds') < 850;

    if (!isInstantFieldChange && this.isInitialised && id && id.startsWith('qtt_')) {
      this.hasEngagedWithQtt = true;
      this.momentLastFieldChange = now;
      this.pushEvent({event: id});
    }
  }

  public registerValidationErrorEvent(message: string): void {
    if (this.isInitialised && message && message.length > 0) {
      this.pushEvent({
        event: 'qttError',
        qttError: message
      });
    }
  }

  public discardId(): void {
    this.qttAttr.qttReference = '';
  }

  public init(searchCriteria: JourneySearchCriteria): void {
    if (this.qttAttr && this.qttAttr.qttReference.length === 0) {
      this.qttAttr.qttReference = this.generateUniqueId();
    }
    this.pushEvent({event: 'qttInitialize'}, searchCriteria);
    this.momentLastFieldChange = moment();
    this.isInitialised = true;
  }

  private formatMomentObject(objectToCheckIfMoment: moment.Moment | null): moment.Moment | string {
    let returnObject: string | moment.Moment = '';
    if (objectToCheckIfMoment !== null && objectToCheckIfMoment !== undefined && moment.isMoment(objectToCheckIfMoment) ) {
      returnObject = objectToCheckIfMoment.format('YYYYMMDD HH:mm');
    }
    return returnObject;
  }

  private s4(): string {
    return (((1 + Math.random()) * 0x10000) || 0).toString(16).substring(1);
  }

  private generateUniqueId(): string {
    return 'qtt_' + (this.s4() + this.s4() + '-' + this.s4() + '-4' + this.s4().substr(0, 3) + '-' + this.s4() + '-' + this.s4() + this.s4() + this.s4()).toLowerCase();
  }
}

export interface IQttAttr {
  qttReference: string;
  qttType: string;
}
