import { Component, OnInit, Input, Inject } from '@angular/core';
import { BasketService } from '../services/basket.service';
import { UiService } from '../services/ui.service';
import { Analytics } from '../services/analytics.service';
import * as _ from 'lodash';
import { Discount } from '../models/discount';
import { Trip } from '../models/trip';
import * as moment from 'moment';
import { TimetableJourney } from '../models/timetable-journey';
import { IRouteDetailParams } from '../models/route-detail-params';
import { CONFIG_TOKEN } from '../constants';
import { IDescription } from '../models/seat-reservation';
import { dateManipulationUtils } from '../services/date-manipulation-utils.service';

declare var window: Window;

@Component({
  selector: 'app-ticket-information',
  styleUrls: ['ticket-information.component.scss'],
  templateUrl: 'ticket-information.component.html',
})
export class TicketInformationComponent implements OnInit {
  @Input() public trip: Trip;
  @Input() public journeyId: number;
  @Input() public isReturn: boolean = false;
  @Input() public direction: string;
  @Input() public timeDepart: string;
  @Input() public timeArrive: string;
  @Input() public numChanges: number = 0;
  @Input() public issues: boolean;
  @Input() public modifier: number;
  @Input() public hasMultipleStations: boolean;
  @Input() public limitedInventory: boolean;
  @Input() public label1: string;
  @Input() public label2: string;
  @Input() public coach: string;
  @Input() public seats: string;
  @Input() public originName: string;
  @Input() public destinationName: string;
  @Input() public ticketType: string;
  @Input() public ticketRouteDescription: string;
  @Input() public ticketCode: string;
  @Input() public singleReturn: string | boolean = false;
  @Input() public sleepers: any;
  @Input() public adults: any;
  @Input() public children: any;
  @Input() public cost: any;
  @Input() public showRouteDetails: boolean;
  @Input() public isCheapest: boolean;
  @Input() public fares: any;
  @Input() public discounts: Discount[];
  @Input() public routeDetailsParamsOutward: IRouteDetailParams;
  @Input() public routeDetailsParamsReturn: IRouteDetailParams;
  @Input() public routeDetailsSimplified: boolean = false;
  @Input() public price: number;

  public showSleeperSection: boolean = false;
  public returnTicket: boolean = false;
  public sleepersPreferences: boolean = false;
  public showPassengerInformation: boolean = false;
  public isSingleReturn: boolean = false;
  public timeDepartReturn: any;
  public timeArriveReturn: any;
  public journeyDateReturn: any;
  public numChangesReturn: any;
  public ttjourneys: TimetableJourney[] = [];
  public timeDepartDesc: string;
  public timeArriveDesc: string;
  public timeDepartReturnDesc: string;
  public timeArriveReturnDesc: string;
  public assistedTravelLink: string = '';
  private ticketTypes: any = [
    'FGS',
    'FOS',
    'GFS',
    'GUS',
    'FDS',
    'EFS',
    'IFS',
    'AS1',
    'FC1',
    'BCS',
    'FSS',
    'MIF',
    'MJF',
    'FSX',
    'OBZ',
    'OCZ',
    'OHS',
    'OJS',
    'OAS',
    'OBS',
    'OES',
    'OGS',
    'ODS',
    'IF1',
    'IF3',
    '3PF',
    'NXO',
    'PCF',
    'FZP',
    'FFA',
    'FFY',
    'FFT',
    'FP5',
    'FPX',
    'FFX',
    'FP6',
    'FP1',
    'CNF',
    'IXF',
    '94A',
    'CEF',
    'BFS',
    'FXS',
    'FBS',
    'MBF',
    'EJA',
    'FAS',
    'MAF',
    'FCS',
    'MCF',
    'MDF',
    'FPL',
    'MEF',
    '92A',
    'S21',
    'S22',
    'S23',
    'S24',
    'FFP',
    '1SS',
    'F1L',
    'FFL',
    'BFO',
    'MFF',
    'BGO',
    'MGF',
    '1AF',
    '1BF',
    '1CF',
    '1DF',
    '1EF',
    'SHF',
    'G1S',
    'AA1',
    'AB1',
    'AD1',
    'AE1',
    'AF1',
    'B1S',
    'GCA',
    'G1Y',
    '1FF',
    '1GF',
    '1HF',
    'AG1',
    'AH1',
    'AI1',
    'F2V',
    'F4V',
    'GCE',
    'GC3',
    'GC4',
    'GC5',
    'GC6',
    'GC7',
    'GC8',
    '10F',
    '10B',
    'GPC',
    'GPB',
    'GPA',
    'OCS',
    'GFR',
    'GUR',
    'EFR',
    'IFR',
    'CAC',
    'FDR',
    'FDT',
    'FC2',
    'AR1',
    'CAB',
    'FPP',
    'BCR',
    'CAF',
    'MMD',
    '99N',
    '99Q',
    'FRX',
    'FTX',
    'TVR',
    'WK1',
    'TTN',
    'CR1',
    'ARR',
    'FWE',
    'SNU',
    'FCP',
    'FCB',
    'FCF',
    'OY2',
    'L1R',
    'SWF',
    'OTF',
    'SFA',
    'FTR',
    'FCR',
    'GE1',
    '55F',
    'TFF',
    'SIH',
    'EJB',
    '55C',
    'ELF',
    'LGR',
    'SI1',
    '91G',
    '93A',
    '98J',
    'BED',
    'XP2',
    'XP1',
    'XBR',
    'VBR',
    'F1F',
    'OY4',
    'VZR',
    'VYR',
    'BFR',
    'FSR',
    'H1F',
    'F55',
    'F56',
    'FXR',
    '91A',
    '98K',
    '1SO',
    '99S',
    '98S',
    '98U',
    'GWC',
    '99I',
    'TFH',
    'TFL',
    'G1R',
    'B1R',
    'G1Z',
    '98N',
    '91J',
    'COA',
    '1JF',
    '1KF',
    'AJ1',
    'AK1',
    '1ST',
    'FGR',
    'FOR',
    'CPF',
    'ETR',
    'FHR',
    'XLF',
    'AVL',
    'AVN',
    '1F4',
    '1F3',
    '1F2',
    '1F1',
    '1F0',
    '1G4',
    '1G3',
    '1G2',
    '1G1',
    '1G0',
    '2F4',
    '2F3',
    '2F2',
    '2F1',
    '2F0',
    '2G4',
    '2G3',
    '2G2',
    '2G1',
    '2G0',
    '2D0',
    '1D0',
    'E20',
    'E21',
    'E22',
    'E23',
    'E24',
    'E40',
    'E41',
    'E42',
    'E43',
    'E44',
    'E60',
    'E61',
    'E62',
    'E63',
    'E64',
    '99B',
    '99D',
    '99F',
    'CAV',
    '99H',
    '24G',
    '24I',
    'DF1',
    'DF2',
    'DF3',
    'DF4',
    'DF5',
    'DF6',
    '99L',
    'VP1',
    '91C',
    'WC1',
    'IDO',
    'EVF',
    'BG1',
    '99T',
    '98V',
    'FZS',
    'FZL',
    'TQ1',
    '91H',
    'COL',
    '98X',
    '60F',
    'BC1',
    'BD1',
    'OC1',
    'OD1',
    '99Y',
    'ES1',
    'ES3',
    '98F',
    'ES5',
    '98H',
    'FCD',
    'LG4',
    '99V',
    'OPF',
    '98C',
    'FSO',
    'SOF',
    'O2R',
    'FTP',
    'FSC',
    'FSA',
    'FSB',
    'CA1',
    'RVE',
    '7FF',
    '7D1',
    '1WK',
    'R71',
    'RF7',
    '7DF',
    '7TF',
    'FMW',
    '7AF',
    'RVF',
    '0AT',
    '0CK',
    'SP3',
    'RMA',
    'A05',
    'A04',
    'MFB',
    '4WK',
    'ACP',
    'ND6',
    'ND2',
    'R81',
    'R91',
    'R01',
    'RA1',
    'RFM',
    'PSF',
    'TRF',
    'FMM',
    '0AV',
    '97A',
    '95A',
    'EIF',
    'VA6',
    '24H',
    '1SA',
    '1SB',
    '1SC',
    '1SD',
    '1SE',
    'FB0',
    'FB1',
    'FB2',
    'FB3',
    'FB4',
    'FPW',
    'TVS',
    'VW1',
    'TTR',
    'BHO',
    'VFA',
    'VFB',
    'VFC',
    'VFD',
    'VFE',
    'VFG',
    'LFB',
    'FIS',
    'VAL',
    'VJF',
    'VIF',
    'VKF',
    'F1V',
    'F3V',
    'F7V',
    'XAF',
    'XBF',
    'XCF',
    'XDF',
    'XEF',
    'XFF',
    'XGF',
    'RCS',
    'X1C',
    '1AS',
    '1BS',
    '1CS',
    '1DS',
    '1ES',
    '1DB',
    '1FS',
    '1GS',
    'I1H',
    '1HS',
    '1AB',
    '1BB',
    '1CB',
    'I1A',
    'I1B',
    'I1C',
    'GP1',
    'I1D',
    'I1E',
    'I1F',
    'I1G',
    'I1I',
    'IAB',
    'IBB',
    'ICB',
    '1JS',
    'DFS',
    'DGS',
    'DHS',
    'DAS',
    'DBS',
    'DCS',
    'AVP',
    'W1A',
    'W1C',
    'W1E',
    'W1G',
    'DES',
    'DDS',
    'W1H',
    'W1J',
    'W1L',
    'W1N',
    'W1O',
    'W1P',
    'W1Q',
    'W1R',
    'W1S',
    'CL1',
    'CM1',
    'CH1',
    'W1T',
    'DJS',
    'DKS',
    'DLS',
    'AW1',
    'HT1',
    'HTT',
    'UFA',
    'UFB',
    'UFC',
    'UFD',
    'UFE',
    'UFF',
    'UFG',
    'UFH',
    'UFI',
    'HH1',
    'HL1',
    'CA4',
    'OF1',
    'OF2',
    'OF3',
    'OF4',
    'LG2',
    'OF5',
    'OF6',
    'NX1',
    'FAV',
    'FBV',
    'FDV',
    '0AZ',
    'F1A',
    'F2A',
    'F3A',
    'F4A',
    'F5A',
    'F6A',
    'F7A',
    'F8A',
    'F9A',
    '98A',
    '96A',
    '0GS',
    '0FS',
    '0AD',
    '0GR',
    '0FR',
    '0AH',
    '0AC',
    '0CB',
    '0CD',
    '0AJ',
    '0E1',
    '0BM',
    '0AR',
    '0CI',
    '0AN',
    'GEU',
    'WW1',
    'G10',
    'WET',
    'WFU',
    'FWF',
    'WKU',
    'VWU',
    'NS1',
    'FCV',
    'FCU',
    'GXO',
    'GXS',
    'GXR',
    'GXC',
    'XCU',
    'G15',
    'FUS',
    'BDU',
    '1FZ',
    '2FZ',
    '1DZ',
    '2DZ',
    'SWU',
    'WUG',
    'LA1',
    'HHH',
    'MMM',
    'IT1',
    'CS1',
    'EM0',
    'EM3',
    'EM5',
    'SUG',
    'ZO2',
    'ZO4',
    'WUR',
    'WUS',
  ];
  private isFirstClass: boolean = false;

  constructor(
    private basketService: BasketService,
    private uiService: UiService,
    private analytics: Analytics,
    @Inject(CONFIG_TOKEN) private config: any
  ) {}

  public ngOnInit(): void {
    this.isSingleReturn = this.trip.ticketTypes[0].journeytype === 'R';
    this.isReturn = this.isSingleReturn && this.trip.returnJourneys.length > 0;
    this.cost = this.aggregatePricePassengers(this.journeyId, this.fares, this.discounts);
    this.timeDepartDesc = moment(this.timeDepart).format('HH:mm');
    this.timeArriveDesc = moment(this.timeArrive).format('HH:mm');

    if (this.isReturn) {
      this.timeDepartReturn = this.trip.returnJourneys[0].departureTime;
      this.timeArriveReturn = this.trip.returnJourneys[0].arrivalTime;

      this.timeDepartReturnDesc = moment(this.timeDepartReturn).format('HH:mm');
      this.timeArriveReturnDesc = moment(this.timeArriveReturn).format('HH:mm');

      this.journeyDateReturn = this.trip.returnJourneys[0].departureTime.format('ddd D MMM');
      this.numChangesReturn = this.trip.returnJourneys[0].timetableJourneys[0].legs.length - 1;
    }
    if (this.direction == 'return' && this.singleReturn == 'false') {
      this.returnTicket = true;
    }

    this.populateTimeTableJourneys();

    if (this.singleReturn == 'true') {
      this.returnTicket = false;

      if (this.direction == 'return') {
        this.price = this.fares[1].farePrice;
      } else {
        this.price = this.fares[0].farePrice;
      }
    }

    if (this.sleepers) {
      let sleeperBerth: any = _.find<any>(this.sleepers, function(item) {
        return item.direction == 'O' || item.direction == 'R';
      });
      sleeperBerth = sleeperBerth ? sleeperBerth.direction.toLowerCase() : '';
      this.showSleeperSection = this.direction.charAt(0) === sleeperBerth ? true : false;

      this.sleepersPreferences = true;
      for (let sleeper of this.sleepers) {
        sleeper.cost = sleeper.cost * sleeper.passengers;
      }
    }

    this.isFirstClass = _.includes(this.ticketTypes, this.ticketCode.toUpperCase());
    this.assistedTravelLink = this.config.data.links.assistedTravel;
  }

  public getDirection(way: any): string {
    if (way == 'out') {
      return 'Out';
    } else {
      return 'Rtn';
    }
  }

  public getChangesMsg(num: any): string {
    var value = parseInt(num);
    var s = value > 1 ? 's' : '';
    return value === 0 ? 'Direct' : value + ' chg' + s;
  }

  public getDuration(startTime: string, endTime: string): string {
    return dateManipulationUtils.getDuration(startTime, endTime);
  }

  public aggregatePassengers(journeyId: any, fares: any, discounts: any): any {
    var result = [];
    _.each(fares, function(fare, key) {
      if (fare.journeyId !== journeyId) {
        return;
      }

      if (fare.adults > 0) {
        result.push({
          count: fare.adults,
          discount:
            !fare.discounttype || fare.discounttype === '   '
              ? ''
              : _.filter(discounts, (dc: Discount) => dc.code == fare.discounttype)[0].description,
          price: fare.adultfare,
          pricemultiplier: fare.adultsmultiplier,
          type: fare.adults === 1 ? 'Adult' : 'Adults',
        });
      }

      if (fare.children > 0) {
        result.push({
          count: fare.children,
          discount:
            !fare.discounttype || fare.discounttype === '   '
              ? ''
              : _.filter(discounts, (dc: Discount) => dc.code == fare.discounttype)[0].description,
          price: fare.childfare,
          pricemultiplier: fare.childrenmultiplier,
          type: fare.children === 1 ? 'Child' : 'Children',
        });
      }
    });

    return result;
  }

  public getLimitedInventoryMsg(num: any): string {
    return num + ' left at this price';
  }

  public showRouteDetailsModal(e: any, ticketCode: any): void {
    e.preventDefault();

    this.analytics.gtmTrackEvent({
      'engagement-name': 'view-ticket-restrictions',
      event: 'pop-over',
      options: 'none',
    });

    var ticketInfoTitle = [
      'Ticket Description',
      'Discounts',
      'Railcard',
      'Refunds',
      'Changes',
      'Conditions',
      'Availability',
      'Break journey',
      'Return',
      'Train operator',
      'Booking deadline',
    ];

    this.basketService.fetchTicketFullTerms(ticketCode).subscribe((ticketContent) => {
      let ticketInfo = '';

      for (var key in ticketInfoTitle) {
        let objKey = ticketInfoTitle[key].toLowerCase().replace(/ /g, '');

        if (ticketContent.data[objKey] !== undefined) {
          ticketInfo += '<h3>' + ticketInfoTitle[key] + '</h3>' + ticketContent.data[objKey];
        }
      }

      if (this.isFirstClass) {
        ticketInfo += `<div>
          <div class="assisted-travel-title">
            <iron-icon icon="toc:accessibility" class="assisted-travel-icon"></iron-icon>
            <h3>Wheelchair Access</h3>
          </div>
          <div class="assisted-travel-wrap">
            <div class="assisted-travel-wrap--right-col">
            <p class="assisted-travel">
                It is not possible to access First Class in a wheelchair on TransPennine Express or some other operators’ trains.
                Please check with our <a href="${this.assistedTravelLink}" target="_blank" rel="noopener noreferrer">Assisted Travel</a> team before booking.
              </p>
            </div>
          </div>
        </div>`;
      }

      this.analytics.gtmTrackEvent({
        event: 'pop-over',
        'pop-over': 'view-ticket-restrictions',
      });

      this.uiService.infoLong(ticketInfo, true);
    });
  }

  private populateTimeTableJourneys(): void {
    let $this = this;

    _.each(!this.singleReturn ? this.trip.returnJourneys[0].timetableJourneys : this.trip.outwardJourneys[0].timetableJourneys, function(
      journey,
      key
    ) {
      $this.ttjourneys.push(journey);
    });

    if (this.isReturn) {
      _.each(this.trip.returnJourneys[0].timetableJourneys, function(journey, key) {
        $this.ttjourneys.push(journey);
      });
    }
  }

  private aggregatePricePassengers(journeyId: any, fares: any, discounts: any): number {
    return _.sumBy<any>(this.aggregatePassengers(journeyId, fares, discounts), function(it) {
      return it.price * it.pricemultiplier;
    });
  }
}
