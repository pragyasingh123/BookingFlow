import { Component, OnInit, AfterViewInit, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RetailhubApiService } from '../services/retailhub-api.service';
import { UiService } from '../services/ui.service';
import { Basket } from '../models/basket';
import { JourneySelectionService } from '../services/journey-selection-service';
import { Analytics } from '../services/analytics.service';
import { CookieService, CookieOptionsArgs } from 'angular2-cookie/core';
import * as moment from 'moment';
import * as _ from 'lodash';
import { Title } from '@angular/platform-browser';
import { SleeperService } from '../services/sleeper.service';
import { JourneyService } from '../services/journey.service';
import { CONFIG_TOKEN } from '../constants';
import { GtmHelperService } from '../services/gtm-helper.service';
import { JourneySearchCriteria } from '../models/journey-search-criteria';
import { ISelectOption } from '../shared/select/index';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { SubscriberComponent } from '../shared/subscriber.component';

@Component({
  selector: 'app-qtt',
  styleUrls: [ 'qtt.component.scss' ],
  templateUrl: 'qtt.component.html'
})

export class QttComponent extends SubscriberComponent implements OnInit, AfterViewInit {
  public searchCriteria: JourneySearchCriteria;
  public originSelection: string;
  public destinationSelection: string;
  public viaDestinationSelection: string;
  public isJourneyCheckInProgress;
  public departOptions: ISelectOption[] = [];
  public departOptionSelection: ISelectOption;
  public viaAvoidOptions: ISelectOption[] = [];
  public viaAvoidOptionSelection: ISelectOption;
  public returnOptions: ISelectOption[] = [];
  public returnOptionSelection: ISelectOption;
  public timeOptions: ISelectOption[] = [];
  public timeOptionSelection: ISelectOption;
  public returnTimeOptions: ISelectOption[] = [];
  public returnTimeOptionSelection: ISelectOption;
  public adultOptions: ISelectOption[] = [];
  public adultOptionSelection: ISelectOption;
  public childOptions: ISelectOption[] = [];
  public childOptionSelection: ISelectOption;
  public outwardDateSelection: moment.Moment = moment();
  public returnDateSelection: moment.Moment = moment();
  public isReturnTicket: boolean = false;
  public isOpenReturn: boolean = false;
  public hasMoreOptions: boolean = false;
  public hasRailcard: boolean = false;
  public amendBooking: boolean = false;
  public railcardComponent: RailcardComponent;
  public handoffParams: any;
  public railcards: IRailcardGetResponse[] = [];
  public availableRailcards: IRailcardGetResponse[] = [];
  public railcardOptionSelection: ISelectOption;
  public railcardAmount: ISelectOption[] = [];
  public railcardOptionAmount: ISelectOption;
  public basket: Basket;
  public promotion: string;
  public isReturning: boolean = false;
  public disruptionData: IDataToDisruptions;
  public disruptionMessage: string;
  public disruptionSearchQuery: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private uiService: UiService,
    private _retailHubApi: RetailhubApiService,
    private journeySelectionService: JourneySelectionService,
    private titleService: Title,
    private analytics: Analytics,
    private cookieService: CookieService,
    private sleeperService: SleeperService,
    private journeyService: JourneyService,
    private gtmHelperService: GtmHelperService,
    @Inject(CONFIG_TOKEN) private config: any
  ) {
    super();
    this.loadInitials();
  }

  public ngAfterViewInit(): void {
    this.loadRailcards();
  }

  public ngOnInit(): void {
    this.subscriptions.push(this.gtmHelperService.isAboutToPush.filter(() => Boolean(this.railcardComponent)).subscribe((res) => {
      const railcards = this.railcardComponent.railcards
        .map((x) => {
          return {
            adults: x.adultSelection,
            children: x.childSelection,
            code: x.optionSelection,
            number: x.amountSelection
          };
        })
        .filter((x) => x.code);

      const outwardTimeData: moment.Moment = this.outwardDateSelection
        .hour(this.timeOptionSelection.value.hour())
        .minute(this.timeOptionSelection.value.minute())
        .second(0);
      let returnTimeData: moment.Moment | null;
      if (this.returnTimeOptionSelection) {
        returnTimeData = this.returnDateSelection
          .hour(this.returnTimeOptionSelection.value.hour())
          .minute(this.returnTimeOptionSelection.value.minute())
          .second(0);
      }

      let viaData: string | null;
      let avoidData: string | null;
      if (this.hasMoreOptions && this.viaDestinationSelection !== undefined) {
        if (this.viaAvoidOptionSelection.value === 'via') {
          viaData = this.viaDestinationSelection;
          avoidData = null;
        } else {
          viaData = null;
          avoidData = this.viaDestinationSelection;
        }
      } else {
        viaData = null;
        avoidData = null;
      }
      const params = {
        adults: this.adultOptionSelection,
        avoid: avoidData,
        children: this.childOptionSelection,
        depart: this.departOptionSelection,
        destination: this.destinationSelection,
        isopenreturn: this.isOpenReturn,
        isreturn: this.isReturnTicket,
        origin: this.originSelection,
        promotion: this.promotion,
        railcards: railcards.length > 0 ? JSON.stringify(railcards) : undefined,
        returntime: returnTimeData,
        time: outwardTimeData,
        via: viaData
      };

      this.searchCriteria = this.journeySelectionService.parseGtmSearchParams(params);
      this.gtmHelperService.searchCriteria = this.searchCriteria;
    }));

    this.titleService.setTitle('Buy Tickets');
    this.analytics.trackPage(this.titleService.getTitle());
    this.sleeperService.clear();
    this.analytics.trackPage(this.titleService.getTitle());
    this.cookieService.put('qttFirstStage', 'bookingFlow', {
      expires: moment().add(1, 'day').format(),
      path: '/',
      secure: this.config.secureCookies
    });

    if (this.availableRailcards == null || this.availableRailcards.length === 0) {
      this.subscriptions.push(this._retailHubApi.get('/rail/railcards').subscribe((response) => {
        let railcards = response.data as IRailcardGetResponse[];
        this.availableRailcards = railcards.filter((card) => {
          return moment().isBetween(card.dateeffectivefrom, card.dateeffectiveto);
        });

        localStorage.setItem('railcards', JSON.stringify(this.availableRailcards));
        this.railcardComponent = new RailcardComponent(this.availableRailcards, this.gtmHelperService);
        this.loadRailcards();
      }));
    }

    this.subscriptions.push(this.journeyService.disruptionsCurrentMessage.subscribe((message) => (this.disruptionMessage = message)));
    this.subscriptions.push(this.journeyService.disruptionsCurrentSearchQuery.subscribe((data) => (this.disruptionSearchQuery = data)));
  }

  public toggleMoreOptions(): void {
    this.hasMoreOptions = !this.hasMoreOptions;
    this.gtmHelperService.registerClickEvent('qtt_checkbox_more_options');
  }

  public search(): void {
    this.gtmHelperService.pushNewFieldValue('qtt_Submit');
    let outwardTime = this.outwardDateSelection
      .hour(this.timeOptionSelection.value.hour())
      .minute(this.timeOptionSelection.value.minute())
      .second(0);

    // Validations
    let currentDateTime = moment();

    if (currentDateTime.isAfter(outwardTime)) {
      const message = 'Outbound journey must be in the future.';
      this.gtmHelperService.registerValidationErrorEvent(message);
      this.uiService.alert(message);
      return;
    }

    if (this.isReturnTicket && !this.isOpenReturn) {
      let returnTime = this.returnDateSelection
        .hour(this.returnTimeOptionSelection.value.hour())
        .minute(this.returnTimeOptionSelection.value.minute())
        .second(0);

      if (outwardTime.isAfter(returnTime)) {
        const message = 'Return must take place after outbound journey.';
        this.gtmHelperService.registerValidationErrorEvent(message);
        this.uiService.alert(message);
        return;
      }
    }

    if (this.onStationSelected()) {
      return;
    }

    if (this.onViaAvoidStationSelected()) {
      return;
    }

    if (!this.originSelection || !this.destinationSelection) {
      const message = 'You must select both origin and destination stations.';
      this.gtmHelperService.registerValidationErrorEvent(message);
      this.uiService.alert(message);
      return;
    }

    let queryOptions = {
      adults: this.adultOptionSelection.value,
      children: this.childOptionSelection.value,
      depart: this.departOptionSelection.value,
      destination: this.destinationSelection,
      origin: this.originSelection,
      time: this.outwardDateSelection
        .hour(this.timeOptionSelection.value.hour())
        .minute(this.timeOptionSelection.value.minute())
        .format()
    };

    if (this.adultOptionSelection.value + this.childOptionSelection.value >= 10) {
      const message = 'Adults and children total should be less then 10.';
      this.gtmHelperService.registerValidationErrorEvent(message);
      this.uiService.alert(message);
      return;
    }

    if (this.promotion) {
      queryOptions[ 'promotion' ] = this.promotion;
    }

    if (this.hasMoreOptions) {
      queryOptions[ this.viaAvoidOptionSelection.value ] = this.viaDestinationSelection;
    }

    if (this.isReturnTicket) {
      queryOptions[ 'isreturn' ] = true;
      if (this.isOpenReturn) {
        queryOptions[ 'isopenreturn' ] = true;
      } else {
        queryOptions[ 'return' ] = this.returnOptionSelection.value;
        queryOptions[ 'returntime' ] = this.returnDateSelection
          .hour(this.returnTimeOptionSelection.value.hour())
          .minute(this.returnTimeOptionSelection.value.minute())
          .format();
      }
    }

    if (this.hasRailcard && this.railcardComponent.railcards[ 0 ].adultOptions.length > 0) {
      queryOptions[ 'railcards' ] = JSON.stringify(
        this.railcardComponent.railcards.map((x) => {
          return {
            adults: x.amountSelection.value * x.adultSelection.value,
            children: x.childSelection ? x.amountSelection.value * x.childSelection.value : 0,
            code: x.optionSelection.value,
            number: x.amountSelection.value
          };
        })
      );
    }

    var totalAdultsNoRailcard = 0;
    var totalChildrenNoRailcard = 0;

    if (this.hasRailcard) {
      for (var i = 0; i < this.railcardComponent.railcards.length; i++) {
        if (this.railcardComponent.railcards[ i ].isAdultAvailable) {
          totalAdultsNoRailcard =
            totalAdultsNoRailcard +
            this.railcardComponent.railcards[ i ].adultSelection.value * this.railcardComponent.railcards[ i ].amountSelection.value;
        }
        if (this.railcardComponent.railcards[ i ].isChildAvailable) {
          totalChildrenNoRailcard =
            totalChildrenNoRailcard +
            this.railcardComponent.railcards[ i ].childSelection.value * this.railcardComponent.railcards[ i ].amountSelection.value;
        }
      }

      if (this.adultOptionSelection.value < totalAdultsNoRailcard) {
        const message = 'The total number of adult passengers with a railcard is more than the number of adult passengers travelling';
        this.gtmHelperService.registerValidationErrorEvent(message);
        this.uiService.alert(message);
        return;
      }

      if (this.childOptionSelection.value < totalChildrenNoRailcard) {
        const message = 'The total number of child passengers with a railcard is more than the number of child passengers travelling';
        this.gtmHelperService.registerValidationErrorEvent(message);
        this.uiService.alert(message);
        return;
      }
    }

    if (localStorage.getItem('CheapestNotification') !== null) {
      localStorage.removeItem('CheapestNotification');
    }

    var checkReturnTime = null;

    if (this.isReturnTicket && !this.isOpenReturn) {
      checkReturnTime = this.returnDateSelection
        .hour(this.returnTimeOptionSelection.value.hour())
        .minute(this.returnTimeOptionSelection.value.minute());
    }

    var outwardTimeFormated = this.outwardDateSelection
      .hour(this.timeOptionSelection.value.hour())
      .minute(this.timeOptionSelection.value.minute())
      .format();
    var returnTimeFormated = null;

    if (checkReturnTime) {
      returnTimeFormated = checkReturnTime.format();
    }

    this.disruptionData = {
      DisplayMode: 'Qtt',
      OutwardJourneyDate: outwardTimeFormated,
      ReturnJourneyDate: returnTimeFormated,
      StationCodes: [ this.originSelection, this.destinationSelection ],
      UseNlc: true
    };
    this.isJourneyCheckInProgress = true;
    this.gtmHelperService.registerClickEvent('qtt_Submit');
    this.subscriptions.push(this.journeyService.getDisruptions(this.disruptionData).subscribe(
      (res) => {
        if (res && res.length > 0) {
          let disruptionText = ('' + res[ 0 ].Description).replace(
            /<a\s+href="/gi,
            '<a target="_blank" href="' + this.config.defaultSitecoreApiUrl
          );

          this.journeyService.sendDisruptionMessage(disruptionText);
          this.journeyService.sendSearchQueryOptions(queryOptions);
          this.router.navigate([ './disruptions/warning' ], { relativeTo: this.route });
          this.isJourneyCheckInProgress = false;
        } else {
          this.isJourneyCheckInProgress = false;
          this.router.navigate([ '/search', queryOptions ]);
        }
      },
      (error) => {
        this.isJourneyCheckInProgress = false;
        this.router.navigate([ '/search', queryOptions ]);
      }
    ));

    this.gtmHelperService.discardId();
  }

  public onStationSelected(): boolean {
    if (this.originSelection && this.originSelection == this.destinationSelection) {
      const message = 'Destination and origin have to be different.';
      this.gtmHelperService.registerValidationErrorEvent(message);
      this.uiService.alert(message);

      return true;
    }
    return false;
  }

  public onViaAvoidStationSelected(): boolean {
    if (
      this.originSelection &&
      this.destinationSelection &&
      (this.originSelection === this.viaDestinationSelection || this.destinationSelection === this.viaDestinationSelection)
    ) {
      const message = 'Via/Avoid station must be different than departure or arrival station.';
      this.gtmHelperService.registerValidationErrorEvent(message);
      this.uiService.alert(message);
      return true;
    }
    return false;
  }

  public outboundDateSelect(): void {
    if (this.outwardDateSelection.isAfter(this.returnDateSelection)) {
      this.returnDateSelection = this.outwardDateSelection;
    }
  }

  public onCheckedReturnTicket(isChecked: boolean): void {
    this.isReturnTicket = isChecked;
  }

  public onCheckedOpenReturn(isChecked: boolean): void {
    this.isOpenReturn = isChecked;
  }

  public onCheckedRailcard(): void {
    this.hasRailcard = !this.hasRailcard;

    if (this.hasRailcard) {
      this.railcardComponent = new RailcardComponent(this.availableRailcards, this.gtmHelperService);
    }
  }

  public handleAmendJourney(params): void {
    // From seats&extras page
    this.originSelection = params[ 'origin' ];
    this.destinationSelection = params[ 'destination' ];
    this.outwardDateSelection = moment(params[ 'time' ]);

    let selectedTimeIndex =
      Number(this.outwardDateSelection.format('HH')) * 2 + Math.ceil(Number(this.outwardDateSelection.format('mm')) / 30);
    _.each(this.timeOptions, function(item, index) {
      item.selected = index === selectedTimeIndex;
    });

    let outwardDepartAfter = params[ 'depart' ] === 'depart-after' ? true : false;
    this.departOptions[ 0 ].selected = outwardDepartAfter;
    this.departOptions[ 1 ].selected = !outwardDepartAfter;
    this.returnOptions[ 0 ].selected = true;
    this.viaAvoidOptions[ 0 ].selected = true;

    this.returnDateSelection = moment(params[ 'returntime' ]);
    let selectedReturnTimeIndex =
      Number(this.returnDateSelection.format('HH')) * 2 + Math.ceil(Number(this.returnDateSelection.format('mm')) / 30);
    _.each(this.returnTimeOptions, function(item, index) {
      item.selected = index === selectedReturnTimeIndex;
    });

    let adults = params[ 'adults' ] ? Number(params[ 'adults' ]) : 1;
    this.adultOptions[ adults ].selected = true;

    let children = params[ 'children' ] ? Number(params[ 'children' ]) : 0;
    this.childOptions[ children ].selected = true;

    if (params[ 'via' ]) {
      this.hasMoreOptions = true;
      this.viaAvoidOptions[ 0 ].selected = true;
      this.viaAvoidOptions[ 1 ].selected = false;
      this.viaAvoidOptionSelection = this.viaAvoidOptions[ 0 ].value;
      this.viaDestinationSelection = params[ 'via' ];
    } else if (params[ 'avoid' ]) {
      this.hasMoreOptions = true;
      this.viaAvoidOptions[ 0 ].selected = false;
      this.viaAvoidOptions[ 1 ].selected = true;
      this.viaAvoidOptionSelection = this.viaAvoidOptions[ 1 ].value;
      this.viaDestinationSelection = params[ 'avoid' ];
    }

    if (params[ 'isreturn' ]) {
      this.isReturnTicket = true;

      if (params[ 'isopenreturn' ]) {
        this.isOpenReturn = true;
      } else {
        this.returnOptions[ 0 ].selected = params[ 'return' ] === 'depart-after';
        this.returnOptions[ 1 ].selected = params[ 'return' ] === 'arrive-before';

        this.returnDateSelection = moment(params[ 'returntime' ]);
      }
    }

    if (params[ 'railcards' ]) {
      this.railcards = this.parseRailcardFromString(params[ 'railcards' ]);
      if (this.railcards != null && this.railcards.length > 0) { this.onCheckedRailcard(); }
    }

    for (let j = 1; j < 10; j++) {
      this.railcardAmount.push({ label: j, value: j });
    }

    if (params[ 'promotion' ]) {
      this.promotion = params[ 'promotion' ];
    }
    this.handoffParams = params[ 'railcards' ];
  }

  public handleHandoff(params: any): void {
    this.originSelection = params.origin;
    this.destinationSelection = params.destination;
    this.outwardDateSelection = params.datetimedepart;
    this.departOptions[ 0 ].selected = params.outwardDepartAfter;
    this.departOptions[ 1 ].selected = !params.outwardDepartAfter;

    for (let i = 0; i < 24 * 2; i++) {
      if (this.timeOptions[ i ].label == this.outwardDateSelection.format('HH:mm')) {
        this.timeOptions[ i ].selected = true;
      } else {
        this.timeOptions[ i ].selected = false;
      }
    }

    this.adultOptions[ params.adults ].selected = true;
    this.childOptions[ params.children ].selected = true;

    if (params.isreturn && !params.isopenreturn) {
      this.isReturnTicket = true;
      this.returnDateSelection = params.datetimeReturn;

      this.returnOptions[ 0 ].selected = params.returnDepartAfter;
      this.returnOptions[ 1 ].selected = !params.returnDepartAfter;

      for (let i = 0; i < 24 * 2; i++) {
        if (this.returnTimeOptions[ i ].label == this.returnDateSelection.format('HH:mm')) {
          this.returnTimeOptions[ i ].selected = true;
        } else {
          this.returnTimeOptions[ i ].selected = false;
        }
      }
    }

    if (params.isopenreturn) {
      this.isReturnTicket = true;
      this.isOpenReturn = true;
    }

    if (params.avoid || params.via) {
      this.viaAvoidOptions[ params.avoid ? 1 : 0 ].selected = true;
      this.hasMoreOptions = true;
      this.viaDestinationSelection = params.avoid ? params.avoid : params.via;
    }

    if (params.Railcards && params.Railcards.length) {
      // handle railcards
      if (this.handoffParams) {
        this.railcards = this.parseRailcardFromString(this.handoffParams);
      }
    }
  }

  private loadInitials(): void {
    let timeOption = this.outwardDateSelection
      .add(2, 'hour')
      .minute(0)
      .second(0);
    let timeLoop = timeOption.clone().hour(0);
    let returntimeOption = this.returnDateSelection
      .add(3, 'hour')
      .minute(30)
      .second(0);
    let returntimeLoop = returntimeOption.clone().hour(0);

    for (let i = 0; i < 24 * 2; i++) {
      this.timeOptions.push({
        label: timeLoop.format('HH:mm'),
        selected: timeLoop.isSame(timeOption, 'minute'),
        value: timeLoop.clone()
      });
      timeLoop.add(30, 'minute');
      this.returnTimeOptions.push({
        label: returntimeLoop.format('HH:mm'),
        selected: returntimeLoop.isSame(returntimeOption, 'minute'),
        value: returntimeLoop.clone()
      });
      returntimeLoop.add(30, 'minute');
    }

    this.departOptions = [ { label: 'Depart after', value: 'depart-after' }, { label: 'Arrive before', value: 'arrive-before' } ];
    this.returnOptions = [ { label: 'Depart after', value: 'depart-after' }, { label: 'Arrive before', value: 'arrive-before' } ];
    this.viaAvoidOptions = [ { label: 'Via', value: 'via' }, { label: 'Avoid', value: 'avoid' } ];
    this.adultOptions.push({ label: '0 Adults', value: 0 });
    this.adultOptions.push({ label: '1 Adult', value: 1 });

    for (let j = 2; j < 10; j++) {
      this.adultOptions.push({ label: j + ' Adults', value: j });
    }

    this.childOptions.push({ label: '0 Children', value: 0 });
    this.childOptions.push({ label: '1 Child', value: 1 });

    for (let j = 2; j < 10; j++) {
      this.childOptions.push({ label: j + ' Children', value: j });
    }

    for (let j = 1; j < 10; j++) {
      this.railcardAmount.push({ label: j, value: j });
    }

    this.subscriptions.push(this.route.params.subscribe((params) => {
      if (params[ 'amend' ]) {
        this.amendBooking = true;
      } else {
        this.amendBooking = false;
      }

      if (this.journeySelectionService.isHandoff()) {
        // populate qtt with passed over params
        this.handleHandoff(this.journeySelectionService.parseUrlParams());
      } else if (params[ 'origin' ]) {
        // populate qtt with default params
        this.handleAmendJourney(params);
      } else {
        // first time
        this.departOptions[ 0 ].selected = true;
        this.returnOptions[ 0 ].selected = true;
        this.viaAvoidOptions[ 0 ].selected = true;
        this.viaAvoidOptionSelection = this.viaAvoidOptions[ 0 ].value;
        this.adultOptions[ 1 ].selected = true;
        this.childOptions[ 0 ].selected = true;
      }

      if (this.route.params instanceof BehaviorSubject) {
        this.searchCriteria = this.journeySelectionService.parseSearchParams(this.route.params.value);
      } else {
        this.searchCriteria = this.journeySelectionService.parseSearchParams(this.route.params);
      }
      this.gtmHelperService.init(this.searchCriteria);
    }));
  }

  private loadRailcards(): void {
    if (!this.availableRailcards || this.availableRailcards.length <= 0) { return; }

    this.subscriptions.push(this.route.params.subscribe((params) => {
      if (params[ 'railcards' ]) {
        var railcards = this.parseRailcardFromString(params[ 'railcards' ]);
        if (railcards) {
          let it = 0;
          railcards.forEach((railc) => {
            let rrr = this.availableRailcards.find((r) => r.railcardcode == railc.code);
            if (!rrr) { return; }

            this.railcardComponent.railcards[ it ].onSelectedOption({
              label: rrr.railcarddescription,
              selected: true,
              value: rrr.railcardcode
            });

            this.railcardComponent.railcards[ it ].onSelectedAmount({
              label: null,
              selected: true,
              value: railc.number
            });

            this.railcardComponent.railcards[ it ].onSelectedAdult({
              label: null,
              selected: true,
              value: railc.adults
            });

            this.railcardComponent.railcards[ it ].onSelectedChild({
              label: null,
              selected: true,
              value: railc.children
            });

            it++;

            this.railcardComponent.add();
          });
        }

        if (this.railcardComponent != null) { this.railcardComponent.remove(this.railcardComponent.railcards.length - 1); }
      }
    }));
  }

  private parseRailcardFromString(railcardString: string): any {
    try {
      return JSON.parse(railcardString);
    } catch (err) {
      return null;
    }
  }
}

interface IRailcardGetResponse {
  railcardcode: string;
  railcarddescription: string;
  mustspecifynumber: boolean;
  maxadults: number;
  minadults: number;
  maxchildren: number;
  minchildren: number;
  dateeffectivefrom: Date;
  dateeffectiveto: Date;
}

class RailcardComponent {
  public railcards: Railcard[] = [];

  constructor(private options: IRailcardGetResponse[], private gtmHelperService: GtmHelperService) {
    if (options !== null) {
      this.add();
    }
  }

  public add(): void {
    this.railcards.push(new Railcard(this.options));
    this.gtmHelperService.registerClickEvent('qtt_checkbox_railcard_add');
  }

  public remove(index: number): void {
    this.railcards.splice(index, 1);
    if (this.railcards.length === 0) {
      this.add();
    }
    this.gtmHelperService.registerClickEvent('qtt_checkbox_railcard_remove_' + index);
  }
}

class Railcard {
  public options: ISelectOption[] = [];
  public optionSelection: ISelectOption;
  public amountOptions: ISelectOption[] = [];
  public amountSelection: ISelectOption;
  public adultOptions: ISelectOption[] = [];
  public adultSelection: ISelectOption;
  public childOptions: ISelectOption[] = [];
  public childSelection: ISelectOption;
  public isAdultAvailable: boolean = false;
  public isChildAvailable: boolean = false;

  constructor(private railcardOptions: IRailcardGetResponse[]) {
    this.options = this.railcardOptions.map((card) => {
      return {
        label: card.railcarddescription,
        selected: false,
        value: card.railcardcode
      };
    });

    _.times(10, (x) => {
      this.amountOptions.push({ label: x + 1, value: x + 1, selected: x === 0 });
    });
  }

  public selectOption(selection: ISelectOption): void {
    this.options.forEach((element) => {
      if (element.value == selection.value) {
        element.selected = true;
      }
    });
    this.optionSelection = selection;
  }
  public onSelectedOption(selection: ISelectOption): void {
    if (this.optionSelection && selection.value === this.optionSelection.value) {
      return;
    }

    this.options.forEach((element) => {
      if (element.value == selection.value) {
        element.selected = true;
      }
    });
    this.optionSelection = selection;
    this.adultOptions = [];
    this.childOptions = [];

    this.railcardOptions.forEach((x) => {
      if (x.railcardcode === selection.value) {
        if (x.maxadults > 0) {
          this.isAdultAvailable = true;

          for (let i = x.minadults; i <= x.maxadults; i++) {
            this.adultOptions.push({ label: i === 1 ? '1 Adult' : i + ' Adults', value: i });
          }
        }

        this.isChildAvailable = x.maxchildren > 0;
        if (x.maxchildren > 0) {
          for (let i = x.minchildren; i <= x.maxchildren; i++) {
            this.childOptions.push({ label: i === 1 ? '1 Child' : i + ' Children', value: i });
          }
        }
        return;
      }
    });
  }

  public onSelectedAmount(selection: ISelectOption): void {
    this.amountOptions.forEach((element) => {
      if (element.value == selection.value) {
        element.selected = true;
      }
    });
    this.amountSelection = selection;
    return;
  }

  public onSelectedAdult(selection: ISelectOption): void {
    this.adultOptions.forEach((element) => {
      if (element.value == selection.value) {
        element.selected = true;
      }
    });
    this.adultSelection = selection;
    return;
  }

  public onSelectedChild(selection: ISelectOption): void {
    this.childOptions.forEach((element) => {
      if (element.value == selection.value) {
        element.selected = true;
      }
    });
    this.childSelection = selection;
    return;
  }
}

export interface IDataToDisruptions {
  StationCodes: IStationCodesArray[];
  OutwardJourneyDate: string;
  ReturnJourneyDate: any;
  UseNlc: boolean;
  DisplayMode: string;
}

export interface IStationCodesArray {
  [ index: number ]: string;
}
