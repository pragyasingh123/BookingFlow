import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Device } from 'ng2-device-detector/src/index';
import { Component, OnInit, ElementRef, Renderer, Injectable, Inject, Input, ViewChild, OnChanges, EventEmitter, NgZone } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { BasketService, ISetDeliveryOptionTod, ISetDeliveryOptionPost, ISetDeliveryOptionSelfPrint, ISetDeliveryOptionETicket } from '../services/basket.service';
import { Subscription, Observable, Subject, ReplaySubject, BehaviorSubject } from 'rxjs/Rx';
import { DeliveryOption, IItsoLocations } from '../models/delivery-option';
import { Basket } from '../models/basket';
import * as _ from 'lodash';
import * as moment from 'moment';
import { ISelectOption } from '../shared/select/select.component';
import { UiService } from '../services/ui.service';
import { RetailhubApiService } from '../services/retailhub-api.service';
import { Analytics } from '../services/analytics.service';
import { CONFIG_TOKEN} from '../constants';
import { Location } from '../models/location';
import { UserService, ISmartcardsListItem, ISmartcardDropdownItem, IDeliveryItsoOption } from '../services/user.service';
import { LocationService } from '../services/locations.service';
import { GtmHelperService } from '../services/gtm-helper.service';
import { IWindow } from '../models/confirmation-ga';
import { BasketContinueButtonService } from './../services/basket-continue-button.service';
import { ItsoHelper } from './itso-helper';
declare var window: Window;
import { IUrlStateObject, UrlWatcherService } from '../services/urlWatcher.service';
import { SubscriberComponent } from '../shared/subscriber.component';
import { AlertService } from '../services/alert.service';

@Component({
  selector: 'app-delivery-details',
  styleUrls: ['delivery-details.component.scss'],
  templateUrl: 'delivery-details.component.html'
})

export class DeliveryDetailsComponent extends SubscriberComponent implements OnInit, OnChanges {
  public isLeadTraveller: boolean;
  public userIdentification: string;
  public appName: string = '';
  public isFocussed: boolean = false;
  public mousedownStarted: boolean = false;
  public keyStream$: Subject<KeyboardEvent>;
  public verticalArrowKeys: string[] = ['ArrowUp', 'ArrowDown', 'Up', 'Down'];
  public highlightIndex: number;
  public totalSearchResultsDisplaying: number = 0;
  public searchQueryStream$: Subject<string>;
  public searchLabel: string;
  public locationSearchResults$: Observable<any>;
  public isfilterByTOD: boolean = true;
  public searchSnapshot: Location[] = [];
  public userInput: string;
  public valueStream$: ReplaySubject<any>;
  public id: string;
  public location: Location;
  public onSelected: EventEmitter<ISelectOption> = new EventEmitter<ISelectOption>();
  public amend: boolean;
  public defaultLabel = 'Select station...';
  public basketContinueLimiter: number = 0;
  public showLoginView: boolean = false;
  @ViewChild('inputElement') public inputElement: {nativeElement: any};
  @ViewChild('searchResultPanel') public searchResultPanel: {nativeElement: any};
  protected isValidateTodLocation: boolean = true;
  private userIsLoggedIn: boolean = false;
  private basicSelectedOption;
  private loaderVisible: boolean = false;
  private itsoLocationSearchResults$: Observable<any>;
  private itsoQueryStream$: Subject<string>;
  private itsoSearchLabel: string;
  private itsoIsFocussed: boolean = false;
  private itsoMousedownStarted: boolean = false;
  private itsoUserInput: string;
  private itsoLocation: Location;
  private itsoCollectionLocation: string;
  private itsoAmend: boolean;
  private itsoSmartcardsArray: ISmartcardDropdownItem[];
  private enableItsoOnUI: boolean = false;
  private smartcardAmend: boolean;
  private smartcardUserInput: string;
  private smartcardQueryStream$: Subject<string>;
  private smartcardIsFocussed: boolean = false;
  private smartcardLocationSearchResults$: Observable<any>;
  private smartcradItemSelected: ISmartcardDropdownItem;
  private smartcardMousedownStarted: boolean = false;
  private smartcardDefaultLabel: string = 'Please select... ';
  private stillLoadingSmartcards: boolean = false;
  private smartcardsLoaded: boolean = false;
  private noCardsOnAccount: boolean = false;
  private userWasDirectlyRedirectedFromRegisterToItso: boolean;
  private loading: BehaviorSubject<boolean>;
  private basket: Basket;
  private optionSub: Subscription;
  private deliveryOptions: DeliveryOption[] = [];
  private selectedOption: DeliveryOption;
  private tripDepartsWithin5Days: boolean = false;
  private setDeliveryInProgress: boolean = false;
  private changeOfJourney: boolean = false;
  private saveAddress: number = 0;
  private basketAddress: any;
  private todSelection: string;
  private collectionLocation: string;
  private postageForm: FormGroup;
  private printForm: FormGroup;
  private basketSub: Subscription;

  constructor(private basketService: BasketService,
              private uiService: UiService,
              private formBuilder: FormBuilder,
              private _retailHubApi: RetailhubApiService,
              private router: Router,
              private route: ActivatedRoute,
              private titleService: Title,
              private el: ElementRef,
              private userService: UserService,
              private renderer: Renderer,
              private analytics: Analytics,
              private device: Device,
              @Inject(CONFIG_TOKEN) private config: any,
              public locationService: LocationService,
              private gtmHelperService: GtmHelperService,
              private ngZone: NgZone,
              private basketContinueButtonService: BasketContinueButtonService,
              private urlWatcherService: UrlWatcherService,
              private alertService: AlertService
  ) {
    super();
    this.userWasDirectlyRedirectedFromRegisterToItso = false;
    this.keyStream$ = new Subject<KeyboardEvent>();
    this.searchQueryStream$ = new Subject<string>();
    this.itsoQueryStream$ = new Subject<string>();
    this.smartcardQueryStream$ = new Subject<string>();
    // Up/Down arrows to highlight
    this.subscriptions.push(this.keyStream$.filter((event: KeyboardEvent) =>
      _.includes(this.verticalArrowKeys, event.key)).subscribe((event: KeyboardEvent) => {
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
      })
    );
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
    // Enter key
    this.subscriptions.push(this.keyStream$.filter((event: KeyboardEvent) =>
      event.key === 'Enter').subscribe((e: KeyboardEvent) => {
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
    })
    );
    this.valueStream$ = new ReplaySubject(1);
    this.subscriptions.push(this.valueStream$.flatMap((value) =>
      this.locationService.findOne({id: String(value)})).subscribe((location: Location) => {
      if ((location && !this.isfilterByTOD) || (location && this.isfilterByTOD && location.tod)) {
        this.location = location;
        this.collectionLocation = location.id;
      }
      if (location && this.isfilterByTOD && !location.tod) {
        this.todSelection = null;
      }
      })
    );

    this.subscriptions.push(this.valueStream$.distinctUntilChanged().subscribe((value) => {
        this.todSelection = value;
      })
    );
    this.postageForm = formBuilder.group({
      address1: [null, Validators.required],
      address2: [''],
      address3: [''],
      addressee : [null, Validators.required],
      city: [null, Validators.required],
      housenumber: [null],
      postcode : [null,  Validators.compose([Validators.required, Validators.minLength(3), this.validatePostcode])],
      region: [''],
    });

    this.printForm = formBuilder.group({
      fullNameOnId: [null, Validators.compose([Validators.required, Validators.maxLength(20)])],
      idType: {
        label: [null, Validators.required],
        selected: [null, Validators.required],
        value: [null, Validators.required]
      },
      isLeadTraveller: [null, Validators.required],
      last4digits: [null,  Validators.compose([Validators.required, Validators.minLength(4), Validators.pattern('^[0-9]{4}$')])],
      passengerName: [null, Validators.required]
    });

    this.subscriptions.push(this.basketService.basket$.subscribe((basket: Basket) => {
      this.basket = basket;
      this.changeOfJourney = this.basket.ischangeofjourney;
      this.basketAddress = this.basket.basketAddress;

      if (this.basketAddress) {
        this.setUserAddress(this.basketAddress);
      }

      if (this.basket.trips.length == 0) {
        this.analytics.gtmTrackEvent({
          event: 'Impression',
          options: 'CopyOnPage:yellow:Your basket is empty. Please search again.'
        });
      }

      if (this.basket.trips.length) {
        this.collectionLocation = this.basket.todLocation || this.basket.trips[ 0 ].outwardJourneys[ 0 ].origin.id;
        this.tripDepartsWithin5Days = this.basket.closestTripOutwardMoment.diff(moment(), 'days') <= 5;
      }

      if (basket.selectedDeliveryOption) {
        this.selectedOption = basket.selectedDeliveryOption;
      }
      })
    );

    this.subscriptions.push(this.basketService.deliveryOptions$.subscribe((deliveryOptions: DeliveryOption[]) => {
      this.deliveryOptions = deliveryOptions;
      const eticket: DeliveryOption = _.find(this.deliveryOptions, { isETicket: true });
      const station = _.find(this.deliveryOptions, { isTod: true });
      const post = _.find(this.deliveryOptions, { isPost: true });
      const mobile = _.find(this.deliveryOptions, { isMobile: true });
      let itso: DeliveryOption | undefined = _.find(this.deliveryOptions, { isItso: true });
      if (itso && this.disableItsoIfMoreThanOnePassenger()) {
        this.removeItsoFromOptions();
        itso = undefined;
      }
      if (!this.selectedOption && this.deliveryOptions.length > 0) {
        this.selectedDeliveryOptionByUser(eticket, station, post, mobile);
      }
      if (this.selectedOption.isItso === true) {
        if (this.userService.userAuthenticated()) {
          this.getSmartcards(this.basket.itsoInfo.isrn);
        } else {
          this.selectedDeliveryOptionByUser(eticket, station, post, mobile);
        }
      }
      this.basicSelectedOption = this.selectedOption;

      if (this.deliveryOptions.length == 0) {
        this.analytics.gtmTrackEvent({
          event: 'Impression',
          options: 'CopyOnPage:yellow:There are no Delivery options available for your journey.'
        });
      }

      setTimeout(() => {
        let collectionOptions = this.el.nativeElement.getElementsByClassName('collection-option');
        _.each(collectionOptions, (item, i) => {
          let descriptionElement = item.getElementsByClassName('collection-option-description')[0];
          if (descriptionElement) {
            this.renderer.setElementProperty(descriptionElement, 'innerHTML', this.deliveryOptions[i].description);
          }
        });

        this.getUserAddress();
      }, 150);
    })
    );

    this.loading = this.basketService.isDeliveryOptionsLoading$;
    this.itsoLocationSearchResults$ = this.itsoQueryStream$.distinctUntilChanged().flatMap<any>((query: string) => {
      if (query) {
        this.itsoSearchLabel = 'Search results';
        return this.locationService.searchItso(query);
      } else {
        this.itsoSearchLabel = 'Popular stations';
        return this.locationService.fetchRecommendedForItso();
      }
    });

    this.smartcardLocationSearchResults$ = this.smartcardQueryStream$.distinctUntilChanged().map<any>((query: string) => {
      if (query) {
        return _.filter(this.itsoSmartcardsArray, (item) => item.isrn.indexOf(query) !== -1);
      } else {
        return this.itsoSmartcardsArray;
      }
    });
  }

  public selectedDeliveryOptionByUser(eticket: DeliveryOption, station: DeliveryOption, post: DeliveryOption, mobile: DeliveryOption): void {
    if (eticket) {
      this.selectedOption = eticket;
    } else if (station) {
      this.selectedOption = station;
    } else if (post) {
      this.selectedOption = post;
    } else if (mobile) {
      this.selectedOption = mobile;
    } else {
      this.selectedOption = _.first(this.deliveryOptions);
    }
  }

  public disableItsoIfMoreThanOnePassenger(): boolean {
    let peopleCounterOverOne: boolean = false;
    this.basket['_lastApiResponse'].basketdetails.forEach((singleFare) => {
      if ((singleFare.searchpassengergroups[0].numberofadults + singleFare.searchpassengergroups[0].numberofchildren) > 1) {
        peopleCounterOverOne = true;
      }
    });
    return peopleCounterOverOne;
  }

  public removeItsoFromOptions(): void {
    this.deliveryOptions = this.deliveryOptions.filter( (singleOption) => {
      return singleOption.isItso !== true;
    });
  }

  public onComponentFocus(): void {
    if (this.amend) {
      return;
    }
    this.onFocusClick({});
  }

  public onMouseDown(): void {
    this.mousedownStarted = true;
  }
  public onFocusClick(a): void {
    if (this.amend) {
      return;
    }
    this.isFocussed = true;
    this.userInput = '';
    this.searchQueryStream$.next('');
    this.gtmHelperService.saveFieldValue(this.id, this.collectionLocation);

    // Give ngIf a chance to render the <input>.
    // Then set the focus, but do this outside the Angular zone to be efficient.
    // There is no need to run change detection after setTimeout() runs,
    // since we're only focusing an element.

    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => this.inputElement.nativeElement.focus(), 10);
    });

  }

  public ngOnChanges(changes: any): void {
    if (changes[this.collectionLocation]) {
      this.valueStream$.next(changes[this.collectionLocation].currentValue);
      this.gtmHelperService.pushNewFieldValue(this.id, changes[this.collectionLocation].currentValue);
    }
  }

  public onKeyup(e: KeyboardEvent): void {
    this.keyStream$.next(e);
    this.searchQueryStream$.next(this.userInput);
  }

  public collapseDropdown(): void {
    // Need to wait before setting focus to false since a user may have clicked on an option
    // and a click event could take up to 300ms to fire.
    setTimeout(() => {
      this.isFocussed = false;
      this.mousedownStarted = false;
    }, this.mousedownStarted ? 301 : 0);
  }

  public selectLocation(location: Location): void {
    if (this.selectedOption && this.selectedOption.isTod) {
      this.validateTodLocation(location);
    }
    this.location = location;
    this.collectionLocation = location.id;
    this.valueStream$.next(this.collectionLocation);
    this.isFocussed = false;
  }

  public ngOnInit(): void {
    this.titleService.setTitle('Delivery details');
    this.analytics.trackPage(this.titleService.getTitle());
    this.appName = 'TransPennine Express';

    this.subscriptions.push(this.basketContinueButtonService.change.subscribe((response) => {
        if (response === true && this.basketContinueLimiter === 0) {
          this.basketContinueLimiter++;
          this.onContinueClick();
        }
      })
    );
    this.subscriptions.push(this.urlWatcherService.urlChange.subscribe( (event) => {
        this.selectItsoOptionAfterRegisterRedirection(this.urlWatcherService.urlState());
      })
    );
  }

  public selectItsoOptionAfterRegisterRedirection( urlState: IUrlStateObject): void {
    if (urlState !== undefined && urlState.previous !== undefined &&
      (urlState.previous.indexOf('register') !== -1 || urlState.previous.indexOf('reset') !== -1)) {
      this.userWasDirectlyRedirectedFromRegisterToItso = true;
    } else {
      this.userWasDirectlyRedirectedFromRegisterToItso = false;
    }
  }

  public cancelAmend(): void {
    this.subscriptions.push(this.basketService.cancelAmendBooking().subscribe((response) => {
      this.basketService.routeToMyAccount();
    }, (err) => {}));
  }

  public setUserAddress(basketAddress): void {
    this.postageForm.patchValue({
      address1: basketAddress.addressline1 || '',
      address2: basketAddress.addressline2 || '',
      address3: basketAddress.addressline3 || '',
      addressee: basketAddress.inhabitant || basketAddress.addressee || '',
      city: basketAddress.town || '',
      countrycode: basketAddress.countrycode || 'GB',
      postcode: basketAddress.postcode || '',
      region: basketAddress.region || '',
    });
  }

  public getUserAddress() {
    if (this.basketAddress == undefined && _.some(this.deliveryOptions, { isPost: true })) {
      this.subscriptions.push(this.userService.isLoggedIn$.subscribe((loggedIn) => {
        if (loggedIn) {
          this.subscriptions.push(this.userService.getAddressPreferences().subscribe((response) => {
            let address = _.find(response, { isdefault: true });
            if (address != undefined) {
              this.setUserAddress(address);
            }
          })
          );
        }
      }));
    }
  }

  public validatePostcode(c: any) {
    let POSTCODE_REGEXP = /[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}/gi;

    return POSTCODE_REGEXP.test(c.value) ? null : {
      validateEmail: {
        valid: false
      }
    };
  }

  public onContinueClick(): void {
    if (this.selectedOption.isTod && !this.todSelection) {
      this.uiService.alert('Please select a station to collect a ticket from.');
      return;
    }

    if (this.selectedOption.isTod || this.selectedOption.selfPrint) {
      this.setDeliveryInProgress = true;

      var todOption: ISetDeliveryOptionTod = {
        deliveryoptionid: this.selectedOption.id,
        todlocationnlc: this.todSelection
      };

      this.subscriptions.push(this.basketService.setDeliveryOption(todOption).subscribe((data) => {
          if (this.selectedOption.selfPrint) {
            this.deliverySelfPrint(this.selectedOption);
          } else {
              this.router.navigate(['/review-order']);
              this.setDeliveryInProgress = false;

              if (this.selectedOption.isTod || this.selectedOption.selfPrint) {
                this.analytics.gtmTrackEvent({
                  event: 'formSubmit',
                  form: 'delivery-method',
                  options: 'Tod'
                });
              }
            }
          }, (error: any) => {
            this.uiService.alert('Sorry, there\'s a problem with our system. Please try again');
        })
      );

      return;
    }

    if (this.selectedOption.isETicket) {
      var etOption: ISetDeliveryOptionETicket = {
        deliveryoptionid: this.selectedOption.id,
        todlocationnlc: 'NA'
      };

      this.subscriptions.push(this.basketService.setDeliveryOption(etOption).subscribe((data) => {
          this.router.navigate(['/review-order']);
          this.setDeliveryInProgress = false;
          if (this.selectedOption.isETicket) {
            this.analytics.gtmTrackEvent({
              event: 'formSubmit',
              form: 'delivery-method',
              options: 'ETicket'
            });
          }
        }, (error: any) => {
          this.uiService.alert('Sorry, there\'s a problem with our system. Please try again');
        })
      );
      return;
    }

    if (this.selectedOption.isPost) {
      this.postAddress();
      return;
    }
    if (this.selectedOption.isItso) {
      if (this.smartcardUserInput === undefined || this.smartcardUserInput === '' || this.itsoLocation === undefined) {
        this.uiService.alert(ItsoHelper.itsoSubmitValication(this.smartcardUserInput, this.itsoLocation, this.noCardsOnAccount));
        return;
      }
      this.setDeliveryInProgress = true;
      const itsoPostObject: IDeliveryItsoOption = ItsoHelper.createDeliveryOption(
        this.selectedOption.id,
        this.itsoLocation.id,
        this.smartcardUserInput,
        this.basket['_lastApiResponse']['lastupdated'],
        this.basket.closestTripOutwardMoment);
        this.subscriptions.push(this.basketService.setDeliveryOption(itsoPostObject).subscribe(() => {
          this.selectedOption = this.basicSelectedOption;
          this.analytics.gtmTrackEvent({
            event: 'formSubmit',
            form: 'delivery-method',
            options: 'itso'
          });
          this.router.navigate(['/review-order']);
          this.setDeliveryInProgress = false;
          }, (error: any) => {
          const errorMessage: string = ItsoHelper.itsoErrorFormMessageHandler(error);
          if (errorMessage.length > 60) {
            this.uiService.alertLong(errorMessage);
          } else {
            this.uiService.alert(errorMessage);
          }
          this.setDeliveryInProgress = false;
          })
        );
        return;
    }

    this.uiService.alert('Delivery option type not configured');
  }

  public postAddress(): void {
    if (!this.postageForm.valid) {
      for (let i in this.postageForm.controls) {
        this.postageForm.controls[i].markAsTouched();
      }
      window.scroll(0, document.querySelector('.tickets-via-post').getBoundingClientRect().top + window.scrollY);
      return;
    }

    this.setDeliveryInProgress = true;

    var postOption: ISetDeliveryOptionPost = {
      deliveryaddress: {
        address: {
          addressee: this.postageForm.value.addressee,
          addressline1: this.postageForm.value.address1,
          addressline2: this.postageForm.value.address2,
          addressline3: this.postageForm.value.address3,
          addresstype: 'D',
          country: '',
          countrycode: this.postageForm.value.countrycode || 'GB',
          isdefault: this.saveAddress.toString(),
          postcode: this.postageForm.value.postcode,
          region: this.postageForm.value.region,
          town: this.postageForm.value.city
        }
      },
      deliveryoptionid: this.selectedOption.id,
      rememberdeliveryaddress: this.saveAddress,
    };

    this.subscriptions.push(this.basketService.setDeliveryOption(postOption).subscribe((data) => {
      this.analytics.gtmTrackEvent({
        event: 'formSubmit',
        form: 'delivery-method',
        options: 'postOption'
      });

      this.router.navigate(['/review-order']);
      this.setDeliveryInProgress = false;
    })
    );
  }

  public deliverySelfPrint(selectedOption): void {
    let trips;
    let formValid = false;
    this.setDeliveryInProgress = false;

    if (this.isLeadTraveller) {
      // lead traveller
      formValid = this.printForm.controls['fullNameOnId'].valid && this.printForm.controls['last4digits'].valid;

      for (let i in this.printForm.controls) {
        if (i !== 'passengerName') {
          this.printForm.controls[i].markAsTouched();
        }
      }

    } else {
      // passenger
      formValid = this.printForm.controls['passengerName'].valid;
      this.printForm.controls['passengerName'].markAsTouched();
    }

    if (formValid) {
      trips = _.map(this.basket.trips, (trip) => {
        let selfPrintOption: ISetDeliveryOptionSelfPrint = {
          selfprintpassengers: {
            PassengerDetail: [{
              iddetails: this.isLeadTraveller ? this.printForm.value.last4digits : 'null',
              idname: this.isLeadTraveller ? this.printForm.value.fullNameOnId : this.printForm.value.passengerName,
              isadult: '1',
              isleadpassenger: this.isLeadTraveller ? '1' : '0',
              railcardcode: '',
              rspidtype: this.userIdentification
            }]
          },
          tripno: trip.id
        };

        return selfPrintOption;
      });

      this.subscriptions.push(this.basketService.setDeliverySelfPrint(trips).subscribe((response) => {
        this.router.navigate(['/review-order']);
        this.setDeliveryInProgress = false;
        this.analytics.gtmTrackEvent({
          event: 'formSubmit',
          form: 'delivery-method',
          options: 'selfPrint'
        });
      }));
    }
  }

  public searchAgainBtnClick() {
    if (this.device.isMobile()) {
      this.router.navigate(['/qtt']);
    } else {
      window.location.assign(window.location.origin + '/tickets');
    }
  }

  public addressSave(isChecked: boolean): void {
    this.saveAddress = isChecked ? 1 : 0;
  }

  public leadTraveller(isLead): void {
    this.isLeadTraveller = isLead;
  }

  public selectedID(id): void {
    this.userIdentification = id;
  }

  public showInfoEticket(): void {
    // tslint:disable:max-line-length
    this.uiService.modal(`<p>Make sure you download and sign into the ` + this.appName + ` app to view your ticket. Visit the Apple App Store or Google Play Store and search ‘` + this.appName + `’.</p><p>Your device will need enough charge for the whole of the journey, including your final station, so that you can show your ticket when asked.</p>`, true);
    // tslint:enable:max-line-length
  }

  public setSelectedOption(option: DeliveryOption): void {
    this.selectedOption = option;

    if (option.isTod) {
      this.populateTodStation();
    }
  }

  public setHighlight(index: number): void {
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

  public onFocusItsoClick() {
    if (this.itsoAmend)  {
      return;
    }
    this.itsoIsFocussed = true;
    this.itsoUserInput = '';
    this.itsoQueryStream$.next('');
  }
  public onItsoComponentFocus(): void {
    if (this.itsoAmend) {
      return;
    }
    this.onFocusItsoClick();
  }
  public closeModal(isUserLoggedIn: boolean): void {
    if (isUserLoggedIn) {
      this.ifSmartcardsLoaded();
    } else {
      this.selectedOption = this.basicSelectedOption;
    }
    this.showLoginView = false;
  }

  public apiCheckIfUserLoggedIn(): void {
    if (this.userService.userAuthenticated()) {
      this.userIsLoggedIn = true;
      this.loaderVisible = false;
      this.ifSmartcardsLoaded();
    } else {
      this.showLoginView = true;
      this.loaderVisible = false;
    }
  }

  public displayITSOLoader(option): boolean {
    option = option.toLowerCase();
    return this.enableItsoOnUI &&
    ((option.indexOf('itso') !== -1 || option.indexOf('smartcard') !== -1)) ? true : false;
  }

  public showLoginModalForItsoCase(option): void {
    if (this.enableItsoOnUI && option._apiResponse.fulfilmenttypename !== undefined
      && option._apiResponse.fulfilmenttypename.toLowerCase().indexOf('itso') !== -1) {
      this.showItsoModal();
    }
  }

  public showItsoModal(): void {
    if (this.userIsLoggedIn === false) {
      this.loaderVisible = true;
      this.apiCheckIfUserLoggedIn();
    } else {
      this.loaderVisible = false;
      this.ifSmartcardsLoaded();
    }
  }

  public showLoaderOnITSO(option): boolean {
    if (option._apiResponse.fulfilmenttypename !== undefined
      && option._apiResponse.fulfilmenttypename.toLowerCase().indexOf('itso') !== -1 && this.userIsLoggedIn) {
      return true;
    } else {
      return false;
    }
  }

  public itsoCollapseDropdown(): void {
    setTimeout(() => {
      this.itsoIsFocussed = false;
      this.itsoMousedownStarted = false;
    }, this.itsoMousedownStarted ? 301 : 0);
  }
  public itsoOnKeyup(e: KeyboardEvent): void {
    this.itsoQueryStream$.next(this.itsoUserInput);
  }
  public itsoOnMouseDown(): void {
    this.itsoMousedownStarted = true;
  }
  public itsoSelectLocation(location: Location): void {
    this.itsoLocation = location;
    this.itsoCollectionLocation = location.id;
    this.itsoIsFocussed = false;
  }

  public smartcardonFocusClick(): void {
    if (this.smartcardAmend) {
      return;
    }
    this.smartcardIsFocussed = true;
    this.smartcardUserInput = '';
    this.smartcardQueryStream$.next('');
  }

  public smartcardSelectLocation(smartcard: ISmartcardDropdownItem): void {
    this.smartcardUserInput = smartcard.isrn;
    this.tryToSelectDefaultStationFromUsersFirstTrip();
    this.smartcradItemSelected = smartcard;
    this.smartcardIsFocussed = false;
  }
  public smartcardOnKeyup(e: KeyboardEvent): void {
    if (!this.checkForNumerics(e)) {
      return;
    }
    this.smartcardQueryStream$.next(this.smartcardUserInput);
  }
  public smartcardCollapseDropdown(): void {
    setTimeout(() => {
      this.smartcardIsFocussed = false;
      this.smartcardMousedownStarted = false;
    }, this.smartcardMousedownStarted ? 301 : 0);
  }

  public smartcardOnComponentFocus(): void {
    if (this.smartcardAmend) {
      return;
    }
    this.smartcardonFocusClick();
  }
  public smartcardOnMouseDown(): void {
    this.smartcardMousedownStarted = true;
  }

  public checkForNumerics(ev: KeyboardEvent): boolean {
    return ItsoHelper.checkForNumerics(ev);
  }

  public ifSmartcardsLoaded(): void {
    if (!this.smartcardsLoaded) {
      this.getSmartcards();
    }
  }

  public getSmartcards(isrnSetWhenUserReturnsToPage: string = ''): void {
    this.stillLoadingSmartcards = true;
    this.subscriptions.push(this.userService.getITSOSmartcards().subscribe( (smartcardsData: ISmartcardsListItem[]) => {
        if (smartcardsData === undefined ||  smartcardsData === null || smartcardsData.length === 0) {
          this.noCardsOnAccount = true;
        } else {
          this.itsoSmartcardsArray = ItsoHelper.setupDropdownArray(smartcardsData);
        }
        this.stillLoadingSmartcards = false;
        this.smartcardsLoaded = true;

        if (isrnSetWhenUserReturnsToPage !== '') {
          this.setItsoOptionIfUserAlreadySelectedIt(isrnSetWhenUserReturnsToPage);
        }
      }, (error: any) => {
        this.stillLoadingSmartcards = false;
        this.uiService.alert('Something went wrong. Please try again');
        this.selectedOption = this.basicSelectedOption;
      })
    );
  }

  public tryToSelectDefaultStationFromUsersFirstTrip(): void {
    if (this.smartcradItemSelected === undefined) {
      setTimeout(() => {
        this.autoSelectItsoStation(this.basket.trips[0].outwardJourneys[0].origin.id);
      }, 201);
    }
  }

  public setItsoOptionIfUserAlreadySelectedIt(itsoNo: string): void {
    this.subscriptions.push(this.smartcardLocationSearchResults$.first().subscribe( (smartcard) => {
      if (itsoNo && smartcard !== undefined && smartcard.length > 0) {
        this.smartcardIsFocussed = true;
        this.smartcradItemSelected = smartcard[0];
        this.smartcardSelectLocation(smartcard[0]);
        this.autoSelectItsoStation(this.basket.itsoInfo.locationnlc);
      }
    }));
    this.smartcardQueryStream$.next(itsoNo);
  }

  public autoSelectItsoStation(stationNo: string): void {
    const station: Location = this.locationService.autoSelectItsoStation(stationNo);
    if (station.id !== '') {
      this.itsoSelectLocation(station);
    }
  }

  public getOutwardLocation(): string | null {
    return _.get(this.basket, 'trips[0].outwardJourneys[0].origin.code', null);
  }

  public validateTodLocation(location: Location): void {
    const code = this.getOutwardLocation();

    if (!code) {
      this.isValidateTodLocation = false;
    }

    this.isValidateTodLocation = location.code === code;
  }

  public populateTodStation(): void {
    const code = this.getOutwardLocation();
    if (!code || this.location) {
      return;
    }
    this.locationService.findOne({ code }).subscribe((location) => {
      if (location && location.tod) {
        this.selectLocation(location);
      }
    });
  }

  public checkIfCollectAtStationSection(sectionName: string): boolean {
    let correctSection: boolean = false;
    if (sectionName) {
      correctSection = sectionName.toLowerCase() === 'collect at station' ? true : false;
    }
    return correctSection;
  }

  private redirectToReviewOrderFromETicket() {
    this.router.navigate(['/review-order']);
    this.setDeliveryInProgress = false;
    this.analytics.gtmTrackEvent({
                event: 'formSubmit',
                form: 'delivery-method',
                options: 'ETicket'
              });
  }
}
